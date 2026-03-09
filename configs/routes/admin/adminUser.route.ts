import { Feature } from "@configs/enum";
import { AdminUserController } from "@controllers";
import { Router } from "express";
import { Route } from "..";

export class AdminUserRoute {
  private static path = Router();

  public static draw() {
    Route.resource(this.path, AdminUserController, {
      setPermissionForAny: [Feature.AdministrationManagement, Feature.UserManagement],
    });
    return this.path;
  }
}
