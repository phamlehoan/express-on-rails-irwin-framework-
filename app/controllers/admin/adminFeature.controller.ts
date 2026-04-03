import { FlashType } from "@configs/enum";
import { buildFeatureTree } from "@middlewares/adminFeatures.middleware";
import models from "@models";
import { NotFoundError } from "@rails";
import {
  FeatureCreateValidator,
  FeatureUpdateValidator,
} from "@validators/admin.validator";
import { randomUUID } from "crypto";
import { AdminController } from "./admin.controller";

export class AdminFeatureController extends AdminController {
  async index() {
    const search = String(this.req.query.search || "").trim();
    const sortBy = String(this.req.query.sortBy || "code");
    const filterType = String(this.req.query.filterType || "");
    const page = Math.max(1, parseInt(String(this.req.query.page || "1"), 10));
    const perPage = Math.min(
      50,
      Math.max(10, parseInt(String(this.req.query.perPage || "10"), 10)),
    );

    const where: any = { deleted: false };
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }
    if (filterType) where.type = filterType;

    const [flat, allFeatures] = await Promise.all([
      models.feature.findMany({
        where,
        include: { permissions: { where: { deleted: false } } },
        orderBy: { [sortBy]: "asc" },
      }),
      models.feature.findMany({
        where: { deleted: false },
        include: { permissions: { where: { deleted: false } } },
        orderBy: [{ parentId: "asc" }, { code: "asc" }],
      }),
    ]);
    const featuresTree = buildFeatureTree(flat);

    const q: Record<string, string> = {};
    if (search) q.search = search;
    if (sortBy !== "code") q.sortBy = sortBy;
    if (filterType) q.filterType = filterType;
    const buildQueryString = () =>
      Object.keys(q).length ? "&" + new URLSearchParams(q).toString() : "";
    const buildSortUrl = (col: string) => {
      const order = sortBy === col ? "desc" : "asc";
      return `/admin/features?${new URLSearchParams({ ...q, sortBy: col, sortOrder: order }).toString()}`;
    };

    this.render("admin/feature.view/index", {
      user: this.req.user,
      features: allFeatures,
      featuresTree,
      search,
      sortBy,
      filterType,
      buildQueryString,
      buildSortUrl,
    });
  }

  async show() {
    const feature = await models.feature.findFirst({
      where: { id: this.req.params.id, deleted: false },
      include: {
        permissions: { where: { deleted: false } },
        parent: true,
      },
    });
    if (!feature) throw new NotFoundError("Feature not found");
    const features = await models.feature.findMany({
      where: { deleted: false },
      orderBy: { code: "asc" },
    });
    this.render("admin/feature.view/show", {
      user: this.req.user,
      feature,
      features,
    });
  }

  async new() {
    const features = await models.feature.findMany({
      where: { deleted: false },
      orderBy: { code: "asc" },
    });
    this.render("admin/feature.view/new", {
      user: this.req.user,
      features,
    });
  }

  async create() {
    const data = await this.params(FeatureCreateValidator).permit(
      "code",
      "name",
      "description",
      "type",
      "parentId",
      "sortOrder",
    );
    const { code, name, description, type, parentId, sortOrder } = data;

    const existing = await models.feature.findFirst({
      where: { code, deleted: false },
    });
    if (existing) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.feature_code_exists"),
      });
      return this.redirect("/admin/features/new");
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const sortOrderVal = parseInt(String(sortOrder), 10) || 0;
    await (models as any).$executeRawUnsafe(
      `INSERT INTO features (id, created_at, updated_at, deleted, code, name, description, type, parent_id, sort_order) VALUES (?, ?, ?, 0, ?, ?, ?, 'MENU_GROUP', ?, ?)`,
      id,
      now,
      now,
      code || "",
      name || "",
      description || "",
      parentId || null,
      sortOrderVal,
    );
    const feature = await models.feature.findUniqueOrThrow({ where: { id } });

    this.flash(FlashType.Success, {
      msg: this.t("flash.feature_created", { name: feature.name }),
    });
    this.redirect(`/admin/features/${feature.id}`);
  }

  async edit() {
    const feature = await models.feature.findFirst({
      where: { id: this.req.params.id, deleted: false },
      include: { permissions: true },
    });
    if (!feature) throw new NotFoundError("Feature not found");
    if (feature.type === "FEATURE") {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.cannot_edit_feature_type"),
      });
      return this.redirect(`/admin/features/${feature.id}`);
    }
    const features = await models.feature.findMany({
      where: { deleted: false },
      orderBy: { code: "asc" },
    });
    this.render("admin/feature.view/edit", {
      user: this.req.user,
      feature,
      features,
    });
  }

  async update() {
    const id = this.req.params.id;
    const feature = await models.feature.findFirst({
      where: { id, deleted: false },
      include: { permissions: true },
    });
    if (!feature) throw new NotFoundError("Feature not found");
    if (feature.type === "FEATURE") {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.cannot_edit_feature_type"),
      });
      return this.redirect(`/admin/features/${id}`);
    }

    const data = await this.params(FeatureUpdateValidator).permit(
      "code",
      "name",
      "description",
      "type",
      "parentId",
      "sortOrder",
    );
    const { code, name, description, type, parentId, sortOrder } = data;

    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (parentId !== undefined) {
      updateData.parent = parentId
        ? { connect: { id: parentId } }
        : { disconnect: true };
    }
    if (sortOrder !== undefined)
      updateData.sortOrder = parseInt(String(sortOrder), 10) || 0;

    if (Object.keys(updateData).length) {
      await models.feature.update({
        where: { id },
        data: updateData,
      });
    }

    this.flash(FlashType.Success, { msg: this.t("flash.feature_updated") });
    this.redirect(`/admin/features/${id}`);
  }

  async destroy() {
    const id = this.req.params.id;
    const feature = await models.feature.findFirst({
      where: { id, deleted: false },
      include: { permissions: true },
    });
    if (!feature) throw new NotFoundError("Feature not found");
    if (feature.type === "FEATURE") {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.cannot_delete_feature_type"),
      });
      return this.redirect(`/admin/features/${id}`);
    }

    await models.feature.update({
      where: { id },
      data: { deleted: true },
    });

    this.flash(FlashType.Success, { msg: this.t("flash.feature_deleted") });
    this.redirect("/admin/features");
  }

  async reorder() {
    let items = this.req.body?.items as
      | Record<string, { parentId?: string; sortOrder?: string }>
      | undefined;
    if (!items || typeof items !== "object") {
      items = {};
      const body = this.req.body || {};
      for (const [key, value] of Object.entries(body)) {
        const m = String(key).match(
          /^items\[([^\]]+)\]\[(parentId|sortOrder)\]$/,
        );
        if (m) {
          const [, id, field] = m;
          if (!items![id]) items![id] = {};
          (items as any)[id][field] = String(value ?? "");
        }
      }
    }
    if (Object.keys(items).length === 0) {
      this.flash(FlashType.Errors, { msg: this.t("flash.invalid_data") });
      return this.redirect("/admin/features");
    }
    for (const [id, it] of Object.entries(items)) {
      if (!id) continue;
      const updates: string[] = [];
      const params: (string | number)[] = [];
      if (it?.parentId !== undefined) {
        if (it.parentId) {
          updates.push("parent_id = ?");
          params.push(it.parentId);
        } else {
          updates.push("parent_id = NULL");
        }
      }
      if (it?.sortOrder !== undefined) {
        updates.push("sort_order = ?");
        params.push(parseInt(String(it.sortOrder), 10) || 0);
      }
      if (updates.length) {
        params.push(id);
        await (models as any).$executeRawUnsafe(
          `UPDATE features SET ${updates.join(", ")} WHERE id = ?`,
          ...params,
        );
      }
    }
    this.flash(FlashType.Success, { msg: this.t("flash.order_updated") });
    this.redirect("/admin/features");
  }
}
