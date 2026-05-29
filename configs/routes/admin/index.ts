import { Feature } from "@configs/enum";
import { AdminController } from "@controllers";
import { RailsRoute, RestActions } from "ts-rails";
import { AdminFeatureRoute } from "./adminFeature.route";
import { AdminJobRoute } from "./adminJob.route";
import { AdminProfileRoute } from "./adminProfile.route";
import { AdminRoleRoute } from "./adminRole.route";
import { AdminUserRoute } from "./adminUser.route";

export class AdminRoute extends RailsRoute {
  public draw() {
    this.path("/me", AdminProfileRoute.draw());
    this.path("/users", AdminUserRoute.draw());
    this.path("/roles", AdminRoleRoute.draw());
    this.path("/features", AdminFeatureRoute.draw());
    this.path("/jobs", AdminJobRoute.draw());

    this.resource(AdminController, {
      only: [RestActions.Index],
      setPermissionForAny: [Feature.UserManagement],
    });
  }
}
