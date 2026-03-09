import { Feature } from "@configs/enum";
import { AdminProfileController } from "@controllers";
import { action } from "@lib/controllerHelpers";
import { Permission, ValidateAnyPermissionMiddleware } from "@middlewares";
import { Router } from "express";

const readPerm = new ValidateAnyPermissionMiddleware([
  `${Feature.AdministrationManagement}::${Permission.Read}`,
  `${Feature.UserManagement}::${Permission.Read}`,
]);
const updatePerm = new ValidateAnyPermissionMiddleware([
  `${Feature.AdministrationManagement}::${Permission.Update}`,
  `${Feature.UserManagement}::${Permission.Update}`,
]);

export class AdminProfileRoute {
  private static path = Router();

  public static draw() {
    this.path.get("/me", readPerm.execute.bind(readPerm), action(AdminProfileController, "show"));
    this.path.put("/me", updatePerm.execute.bind(updatePerm), action(AdminProfileController, "update"));
    return this.path;
  }
}
