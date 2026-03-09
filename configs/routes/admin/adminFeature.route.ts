import { Feature, RestActions } from "@configs/enum";
import { AdminFeatureController } from "@controllers";
import { action } from "@lib/controllerHelpers";
import { Permission, ValidateAnyPermissionMiddleware } from "@middlewares";
import { Router } from "express";
import { Route } from "..";

const perm = new ValidateAnyPermissionMiddleware([
  `${Feature.AdministrationManagement}::${Permission.Update}`,
  `${Feature.UserManagement}::${Permission.Update}`,
]);

export class AdminFeatureRoute {
  private static path = Router();

  public static draw() {
    Route.resource(this.path, AdminFeatureController, {
      only: [
        RestActions.Index,
        RestActions.Show,
        RestActions.New,
        RestActions.Create,
        RestActions.Edit,
        RestActions.Update,
        RestActions.Destroy,
      ],
      setPermissionForAny: [Feature.AdministrationManagement],
    });
    this.path.post("/reorder", perm.execute.bind(perm), action(AdminFeatureController, "reorder"));
    return this.path;
  }
}
