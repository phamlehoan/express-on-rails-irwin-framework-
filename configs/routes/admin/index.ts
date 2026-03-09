import { AdminController } from "@controllers";
import { Router } from "express";
import { Route } from "..";
import { Feature, RestActions } from "../../enum";
import { AdminFeatureRoute } from "./adminFeature.route";
import { AdminProfileRoute } from "./adminProfile.route";
import { AdminRoleRoute } from "./adminRole.route";
import { AdminUserRoute } from "./adminUser.route";

export class AdminRoute {
  private static path = Router();

  public static draw() {
    this.path.use("/", AdminProfileRoute.draw());
    this.path.use("/users", AdminUserRoute.draw());
    this.path.use("/roles", AdminRoleRoute.draw());
    this.path.use("/features", AdminFeatureRoute.draw());

    Route.resource(this.path, AdminController, {
      only: [RestActions.Index],
      setPermissionForAny: [Feature.AdministrationManagement, Feature.UserManagement],
    });

    return this.path;
  }
}
