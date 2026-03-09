import { ApiDoc } from "@lib/apiDoc";
import { NotFoundError } from "@lib/errors";
import models from "@models";
import { ApiV1Controller } from "..";

export class ApiV1AdminRoleController extends ApiV1Controller {
  @ApiDoc({ summary: "List roles (AM)" })
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
    this.render(roles);
  }

  @ApiDoc({ summary: "Show role (AM)" })
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
    this.render(role);
  }
}
