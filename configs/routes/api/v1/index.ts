import { MyPermissionController, ReportController } from "@controllers/api";
import {
  ValidateUserLoginMiddleware,
  ValidateUserPermissionMiddleware,
} from "@middlewares";
import { Router } from "express";
import { ApiV1TaskRoute } from "./task.route";
import { ApiV1TaskTypeRoute } from "./taskType.route";

export class ApiV1Route {
  private static path = Router();
  private static validateUserLoginMiddleware =
    new ValidateUserLoginMiddleware();
  private static myPermissionController = new MyPermissionController();
  private static reportController = new ReportController();
  private static managerPermissionMiddleware =
    new ValidateUserPermissionMiddleware("TASK::READ");

  public static draw() {
    this.path.use(this.validateUserLoginMiddleware.execute);

    // Permission routes
    this.path
      .route("/permissions/me")
      .get(this.myPermissionController.index.bind(this.myPermissionController));

    // Task routes
    this.path.use("/tasks", ApiV1TaskRoute.draw());

    // Task Type routes (Settings)
    this.path.use("/settings/task-types", ApiV1TaskTypeRoute.draw());

    // Report routes (Manager only)
    this.path
      .route("/reports")
      .get(
        this.managerPermissionMiddleware.execute,
        this.reportController.generate.bind(this.reportController)
      );

    return this.path;
  }
}
