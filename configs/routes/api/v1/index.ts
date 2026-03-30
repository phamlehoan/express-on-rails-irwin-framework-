import env from "@configs/env";
import { MyPermissionController } from "@controllers/api";
import { action, RailsRoute } from "@lib";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { ApiV1AdminRoute } from "./admin";
import { AuthRoute } from "./auth";
import { ApiV1DevRoute } from "./dev";

export class ApiV1Route extends RailsRoute {
  public draw() {
    if (env.nodeEnv === "development") {
      this.path("/dev", ApiV1DevRoute.draw());
    }

    this.path("/auth", AuthRoute.draw());

    this.path(action(ValidateUserLoginMiddleware));

    // Permission routes - action(Controller, "index") tạo instance mới mỗi request
    this.get("/permissions/me", action(MyPermissionController, "index"));

    // Admin routes - yêu cầu AM permission
    this.path("/admin", ApiV1AdminRoute.draw());
  }
}
