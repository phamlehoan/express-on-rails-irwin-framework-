import models from "@models";
import { ApiV1Controller } from ".";

export class MyPermissionController extends ApiV1Controller {
  async index() {
    const myPermissions = await models.permission.findMany({
      where: {
        users: {
          some: {
            userId: this.req.user!.id,
          },
        },
      },
    });
    this.renderJson(myPermissions.map((p) => p.code));
  }
}
