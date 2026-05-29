import { Feature } from "@configs/enum";
import { ApiV1AdminRoleController } from "@controllers/api";
import { Permission } from "@middlewares/enums/permissions";
import {
  AssignUsersValidator,
  RoleCreateValidator,
  RoleUpdateValidator,
} from "@validators/admin.validator";
import { action, RailsRoute, RestActions } from "ts-rails";

const updatePerms = [`${Feature.RoleAndPermission}::${Permission.Update}`];

export class ApiV1AdminRoleRoute extends RailsRoute {
  public draw() {
    this.post(
      "/:id/assign-users",
      action(ApiV1AdminRoleController, "assignUsers"),
      {
        document: {
          summary: "Assign users to role",
          tags: ["Admin Role"],
          auth: true,
          body: AssignUsersValidator,
        },
        setPermissionForAny: updatePerms,
      },
    );
    this.delete(
      "/:id/users/:userId",
      action(ApiV1AdminRoleController, "unassignUser"),
      {
        document: {
          summary: "Unassign user from role",
          tags: ["Admin Role"],
          auth: true,
        },
        setPermissionForAny: updatePerms,
      },
    );
    this.resource(ApiV1AdminRoleController, {
      document: { tags: ["Admin Role"], auth: true },
      documentByAction: {
        [RestActions.Create]: { body: RoleCreateValidator },
        [RestActions.Update]: { body: RoleUpdateValidator },
      },
      setPermissionFor: Feature.RoleAndPermission,
    });
  }
}
