import { Feature } from "@configs/enum";
import { AdminRoleController } from "@controllers";
import { action, RailsRoute, RestActions } from "@lib";
import { Permission } from "@middlewares";

export class AdminRoleRoute extends RailsRoute {
  public draw() {
    this.resource(AdminRoleController, {
      except: [RestActions.New],
      setPermissionForAny: [Feature.AdministrationManagement],
    });

    const updatePerms = [
      `${Feature.AdministrationManagement}::${Permission.Update}`,
      `${Feature.UserManagement}::${Permission.Update}`,
    ];

    this.get("/:id/assign", action(AdminRoleController, "assignPage"), {
      setPermissionForAny: updatePerms,
    });
    this.get(
      "/:id/assign-users.json",
      action(AdminRoleController, "assignUsersJson"),
      { setPermissionForAny: updatePerms },
    );
    this.post("/:id/assign-user", action(AdminRoleController, "assignUser"), {
      setPermissionForAny: updatePerms,
    });
    this.delete(
      "/:id/users/:userId",
      action(AdminRoleController, "unassignUser"),
      { setPermissionForAny: updatePerms },
    );
  }
}
