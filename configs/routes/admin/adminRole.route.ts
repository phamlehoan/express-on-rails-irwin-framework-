import { Feature, RestActions } from "@configs/enum";
import { AdminRoleController } from "@controllers";
import { action } from "@lib/controllerHelpers";
import { Permission, ValidateAnyPermissionMiddleware } from "@middlewares";
import { Router } from "express";
import { Route } from "..";

const perm = new ValidateAnyPermissionMiddleware([
  `${Feature.AdministrationManagement}::${Permission.Update}`,
  `${Feature.UserManagement}::${Permission.Update}`,
]);

export class AdminRoleRoute {
  private static path = Router();

  public static draw() {
    Route.resource(this.path, AdminRoleController, {
      only: [
        RestActions.Index,
        RestActions.Show,
        RestActions.Create,
        RestActions.Edit,
        RestActions.Update,
        RestActions.Destroy,
      ],
      setPermissionForAny: [Feature.AdministrationManagement],
    });
    this.path.get(
      "/:id/assign",
      perm.execute.bind(perm),
      action(AdminRoleController, "assignPage")
    );
    this.path.get(
      "/:id/assign-users.json",
      perm.execute.bind(perm),
      action(AdminRoleController, "assignUsersJson")
    );
    this.path.post(
      "/:id/assign-user",
      perm.execute.bind(perm),
      action(AdminRoleController, "assignUser")
    );
    this.path.delete(
      "/:id/users/:userId",
      perm.execute.bind(perm),
      action(AdminRoleController, "unassignUser")
    );
    return this.path;
  }
}
