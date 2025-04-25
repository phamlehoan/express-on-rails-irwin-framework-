import { Feature, RestActions } from "@configs/enum";
import { TaskActivityController, TaskController } from "@controllers/api";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { Router } from "express";
import { Route } from "../..";

export class ApiV1TaskRoute {
  private static path = Router();
  private static validateUserLoginMiddleware =
    new ValidateUserLoginMiddleware();
  private static taskController = new TaskController();
  private static taskActivityController = new TaskActivityController();

  public static draw() {
    this.path.use(this.validateUserLoginMiddleware.execute);

    // CRUD Task
    Route.resource(this.path, this.taskController, {
      setPermissionFor: Feature.Task,
      only: [
        RestActions.Index,
        RestActions.Show,
        RestActions.Create,
        RestActions.Update,
        RestActions.Destroy,
      ],
    });

    // Assign members to task
    this.path.post(
      "/:id/assign",
      TaskController.uploadMiddleware,
      this.taskController.assign.bind(this.taskController)
    );

    // Change task status and log activity
    this.path.post(
      "/:taskId/activities",
      TaskActivityController.uploadMiddleware,
      this.taskActivityController.create.bind(this.taskActivityController)
    );

    return this.path;
  }
}
