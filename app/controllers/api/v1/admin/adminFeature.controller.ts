import models from "@models";
import {
  FeatureCreateValidator,
  FeatureUpdateValidator,
} from "@validators/admin.validator";
import { NotFoundError } from "ts-rails";
import { ApiV1Controller } from "../apiV1.controller";

export class ApiV1AdminFeatureController extends ApiV1Controller {
  async index() {
    const features = await models.feature.findMany({
      where: { deleted: false },
      include: {
        permissions: { where: { deleted: false } },
      },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
    });
    this.renderJson(features);
  }

  async show() {
    const feature = await models.feature.findFirst({
      where: { id: this.req.params.id, deleted: false },
      include: {
        permissions: { where: { deleted: false } },
      },
    });
    if (!feature) throw new NotFoundError("Feature not found");
    this.renderJson(feature);
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
    const code = data.code.trim();
    const existing = await models.feature.findFirst({
      where: { code, deleted: false },
    });
    if (existing) {
      return this.res.status(409).json({
        success: false,
        error: "Feature code already exists",
      });
    }
    const feature = await models.feature.create({
      data: {
        code,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        type: data.type || "FEATURE",
        parentId: data.parentId?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    const permCodes = ["READ", "CREATE", "UPDATE", "DELETE"] as const;
    for (const pc of permCodes) {
      await models.permission.create({
        data: {
          code: pc,
          name: pc.charAt(0) + pc.slice(1).toLowerCase(),
          featureId: feature.id,
          type: "FEATURE",
        },
      });
    }
    const withPerms = await models.feature.findFirst({
      where: { id: feature.id },
      include: { permissions: true },
    });
    this.renderJson(withPerms, 201);
  }

  async update() {
    const id = this.req.params.id;
    const data = await this.params(FeatureUpdateValidator).permit(
      "code",
      "name",
      "description",
      "type",
      "parentId",
      "sortOrder",
    );
    const feature = await models.feature.findFirst({
      where: { id, deleted: false },
    });
    if (!feature) throw new NotFoundError("Feature not found");
    if (feature.type === "FEATURE") {
      return this.res.status(403).json({
        success: false,
        error: "Cannot edit system feature row via this API",
      });
    }

    await models.feature.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code.trim() }),
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.parentId !== undefined && {
          parentId: data.parentId?.trim() || null,
        }),
        ...(data.sortOrder !== undefined && {
          sortOrder: data.sortOrder ?? 0,
        }),
      },
    });
    const updated = await models.feature.findFirst({
      where: { id },
      include: { permissions: { where: { deleted: false } } },
    });
    this.renderJson(updated);
  }

  async destroy() {
    const id = this.req.params.id;
    const feature = await models.feature.findFirst({
      where: { id, deleted: false },
    });
    if (!feature) throw new NotFoundError("Feature not found");
    if (feature.type === "FEATURE") {
      return this.res.status(403).json({
        success: false,
        error: "Cannot delete feature type FEATURE",
      });
    }
    await models.feature.update({
      where: { id },
      data: { deleted: true },
    });
    this.renderJson({ deleted: true });
  }

  /** Body: { items: Record<id, { parentId?: string | null, sortOrder?: number }> } */
  async reorder() {
    const body = this.req.body as {
      items?: Record<string, { parentId?: string | null; sortOrder?: number }>;
    };
    const items = body?.items;
    if (!items || typeof items !== "object") {
      return this.res.status(422).json({
        success: false,
        error: "items object required",
      });
    }
    for (const [fid, it] of Object.entries(items)) {
      if (!fid || !it) continue;
      await models.feature.update({
        where: { id: fid },
        data: {
          ...(it.parentId !== undefined && {
            parentId: it.parentId || null,
          }),
          ...(it.sortOrder !== undefined && { sortOrder: Number(it.sortOrder) || 0 }),
        },
      });
    }
    this.renderJson({ ok: true });
  }
}
