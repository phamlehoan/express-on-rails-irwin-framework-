import { Feature, RestActions } from "@configs/enum";
import { TaskTypeController } from "@controllers/api";
import {
  ValidateUserLoginMiddleware,
  ValidateUserPermissionMiddleware,
} from "@middlewares";
import { Router } from "express";
import { Route } from "../..";

export class ApiV1TaskTypeRoute {
  private static path = Router();
  private static validateUserLoginMiddleware =
    new ValidateUserLoginMiddleware();
  private static taskTypeController = new TaskTypeController();
  private static managerPermissionMiddleware =
    new ValidateUserPermissionMiddleware("TASK_TYPE::READ");

  public static draw() {
    this.path.use(this.validateUserLoginMiddleware.execute);
    this.path.use(this.managerPermissionMiddleware.execute);

    Route.resource(this.path, this.taskTypeController, {
      setPermissionFor: Feature.TaskType,
      only: [
        RestActions.Index,
        RestActions.Create,
        RestActions.Update,
        RestActions.Destroy,
      ],
    });

    return this.path;
  }
}
