import { AdminUserController } from "@controllers";
import { Router } from "express";
import { Route } from "..";
import { RestActions } from "../../enum";

export class AdminUserRoute {
  private static path = Router();
  private static adminUserController = new AdminUserController();

  public static draw() {
    Route.resource(this.path, this.adminUserController, {
      only: [RestActions.Index],
    });

    return this.path;
  }
}
