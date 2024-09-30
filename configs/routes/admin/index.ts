import { AdminController } from "@controllers";
import { Router } from "express";
import { Route } from "..";
import { RestActions } from "../../enum";
import { AdminUserRoute } from "./adminUser.route";

export class AdminRoute {
  private static path = Router();
  private static adminController = new AdminController();

  public static draw() {
    this.path.use("/users", AdminUserRoute.draw());

    Route.resource(this.path, this.adminController, {
      only: [RestActions.Index],
    });

    return this.path;
  }
}
