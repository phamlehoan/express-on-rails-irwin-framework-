import { ApiDoc } from "@lib/apiDoc";
import { NotFoundError } from "@lib/errors";
import {
  buildPaginatedResponse,
  parsePagination,
} from "@lib/pagination";
import models from "@models";
import {
  CreateUserValidator,
  PaginationValidator,
  UpdateUserValidator,
} from "@validators/admin.validator";
import { ApiV1Controller } from "..";

export class ApiV1AdminUserController extends ApiV1Controller {
  @ApiDoc({ summary: "List users (AM)", params: PaginationValidator })
  async index() {
    const permitted = await this.params(PaginationValidator).permit("page", "perPage");
    const { page, perPage, skip } = parsePagination(permitted as any);
    const [users, total] = await Promise.all([
      models.user.findMany({
        where: { deleted: false },
        include: {
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      models.user.count({ where: { deleted: false } }),
    ]);
    const result = buildPaginatedResponse(users, total, { page, perPage });
    this.render(result);
  }

  @ApiDoc({ summary: "Show user (AM)" })
  async show() {
    const user = await models.user.findFirst({
      where: { id: this.req.params.id, deleted: false },
      include: {
        roles: { include: { role: true } },
        permissions: {
          include: {
            permission: { include: { feature: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundError("User not found");
    this.render(user);
  }

  @ApiDoc({ summary: "Create user (AM)", body: CreateUserValidator })
  async create() {
    const data = await this.params(CreateUserValidator).permit(
      "firstName",
      "lastName",
      "email",
      "roleIds"
    );
    const { firstName, lastName, email, roleIds } = data;
    const roleIdsArr = Array.isArray(roleIds) ? roleIds : roleIds ? [roleIds] : [];

    const user = await models.user.create({
      data: {
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        status: "PENDING",
        roles: {
          create: roleIdsArr.map((roleId: string) => ({
            role: { connect: { id: roleId } },
          })),
        },
      },
      include: { roles: { include: { role: true } } },
    });
    this.render(user, 201);
  }

  @ApiDoc({ summary: "Update user (AM)", body: UpdateUserValidator })
  async update() {
    const id = this.req.params.id;
    const data = await this.params(UpdateUserValidator).permit(
      "firstName",
      "lastName",
      "email",
      "status",
      "roleIds",
      "permissionIds"
    );
    const { firstName, lastName, email, status, roleIds, permissionIds } = data;

    const roleIdsArr = Array.isArray(roleIds) ? roleIds : roleIds ? [roleIds] : [];
    const permissionIdsArr = Array.isArray(permissionIds)
      ? permissionIds
      : permissionIds ? [permissionIds] : [];

    await models.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(status && { status }),
      },
    });

    await models.userToRole.deleteMany({ where: { userId: id } });
    for (const roleId of roleIdsArr) {
      await models.userToRole.create({
        data: { userId: id, roleId },
      });
    }

    await models.userToPermission.deleteMany({ where: { userId: id } });
    for (const permissionId of permissionIdsArr) {
      await models.userToPermission.create({
        data: { userId: id, permissionId },
      });
    }

    const user = await models.user.findFirst({
      where: { id },
      include: {
        roles: { include: { role: true } },
        permissions: {
          include: {
            permission: { include: { feature: true } },
          },
        },
      },
    });
    this.render(user);
  }

  @ApiDoc({ summary: "Delete user (AM)" })
  async destroy() {
    const id = this.req.params.id;
    await models.user.update({
      where: { id },
      data: { deleted: true },
    });
    this.render({ deleted: true });
  }
}
