import env from "@configs/env";
import { MyPermissionController } from "@controllers/api";
import { action } from "@lib/controllerHelpers";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { Router } from "express";
import { ApiV1AdminRoute } from "./admin";
import { AuthRoute } from "./auth";
import { DevRoute } from "./dev";

export class ApiV1Route {
  private static path = Router();
  private static validateUserLoginMiddleware =
    new ValidateUserLoginMiddleware();

  public static draw() {
    if (env.nodeEnv === "development") {
      this.path.use("/dev", DevRoute.draw());
    }
    this.path.use("/auth", AuthRoute.draw());

    this.path.use(this.validateUserLoginMiddleware.execute);

    // Permission routes - action(Controller, "index") tạo instance mới mỗi request
    this.path
      .route("/permissions/me")
      .get(action(MyPermissionController, "index"));

    // Admin routes - yêu cầu AM permission
    this.path.use("/admin", ApiV1AdminRoute.draw());

    return this.path;
  }
}
