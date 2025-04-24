import { Feature, RestActions } from "@configs/enum";
import { AdminUserController } from "@controllers";
import { Router } from "express";
import { Route } from "..";

export class AdminUserRoute {
  private static path = Router();
  private static adminUserController = new AdminUserController();

  public static draw() {
    Route.resource(this.path, this.adminUserController, {
      only: [RestActions.Index],
      setPermissionFor: Feature.AdministrationManagement,
    });

    return this.path;
  }
}
