import { MyPermissionController } from "@controllers/api";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { Router } from "express";
import { AuthRoute } from "./auth.route";

export class ApiV1Route {
  private static path = Router();
  private static validateUserLoginMiddleware =
    new ValidateUserLoginMiddleware();
  private static myPermissionController = new MyPermissionController();

  public static draw() {
    // Verify 3rd party token
    this.path.use("/auth", AuthRoute.draw());

    this.path.use(this.validateUserLoginMiddleware.execute);

    // Permission routes
    this.path
      .route("/permissions/me")
      .get(this.myPermissionController.index.bind(this.myPermissionController));

    return this.path;
  }
}
