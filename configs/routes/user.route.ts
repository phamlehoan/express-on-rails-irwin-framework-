import { UserController } from "@controllers";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { Router } from "express";
import { Route } from ".";
import { RestActions } from "../enum";

export class UserRoute {
  private static path = Router();
  private static validateUserLoginMiddleware = new ValidateUserLoginMiddleware();
  private static userController = new UserController();

  public static draw() {
    this.path
      .route("/")
      .get(this.validateUserLoginMiddleware.execute, this.userController.index);
    Route.resource(this.path, this.userController, {
      only: [RestActions.New, RestActions.Create],
    });

    return this.path;
  }
}
