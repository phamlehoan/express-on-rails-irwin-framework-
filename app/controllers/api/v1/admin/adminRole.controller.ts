import models from "@models";
import { NotFoundError } from "ts-rails";
import { ApiV1Controller } from "..";

export class ApiV1AdminRoleController extends ApiV1Controller {
  async index() {
    const roles = await models.role.findMany({
      where: { deleted: false },
      include: {
        permissions: {
          include: {
            permission: { include: { feature: true } },
          },
        },
      },
    });
    this.renderJson(roles);
  }

  async show() {
    const role = await models.role.findFirst({
      where: { id: this.req.params.id, deleted: false },
      include: {
        permissions: {
          include: {
            permission: { include: { feature: true } },
          },
        },
      },
    });
    if (!role) throw new NotFoundError("Role not found");
    this.renderJson(role);
  }
}
