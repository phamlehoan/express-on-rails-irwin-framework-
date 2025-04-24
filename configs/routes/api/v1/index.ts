import { MyPermissionController } from "@controllers";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { Router } from "express";

export class ApiV1Route {
  private static path = Router();
  private static validateUserLoginMiddleware =
    new ValidateUserLoginMiddleware();
  private static myPermissionController = new MyPermissionController();

  public static draw() {
    this.path.use(this.validateUserLoginMiddleware.execute);

    this.path
      .route("/permissions/me")
      .get(this.myPermissionController.index.bind(this.myPermissionController));

    return this.path;
  }
}
