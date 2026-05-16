import { Feature } from "@configs/enum";
import { ApiV1AdminRoleController } from "@controllers/api";
import { Permission } from "@middlewares/enums/permissions";
import { action, RailsRoute } from "ts-rails";

const updatePerms = [`${Feature.RoleAndPermission}::${Permission.Update}`];

export class ApiV1AdminRoleRoute extends RailsRoute {
  public draw() {
    /** Đăng ký trước `resource` để tránh xung đột route (DELETE …/users/… vs …/:id). */
    this.post(
      "/:id/assign-users",
      action(ApiV1AdminRoleController, "assignUsers"),
      {
        setPermissionForAny: updatePerms,
      },
    );
    this.delete(
      "/:id/users/:userId",
      action(ApiV1AdminRoleController, "unassignUser"),
      {
        setPermissionForAny: updatePerms,
      },
    );
    this.resource(ApiV1AdminRoleController, {
      document: { tags: ["Admin Role"] },
      setPermissionFor: Feature.RoleAndPermission,
    });
  }
}
