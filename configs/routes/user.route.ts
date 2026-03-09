import { UserController } from "@controllers";
import { action } from "@lib/controllerHelpers";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { Router } from "express";
import { Route } from ".";
import { RestActions } from "../enum";

export class UserRoute {
  private static path = Router();
  private static validateUserLoginMiddleware =
    new ValidateUserLoginMiddleware();

  public static draw() {
    this.path
      .route("/")
      .get(this.validateUserLoginMiddleware.execute, action(UserController, "index"));
    Route.resource(this.path, UserController, {
      only: [RestActions.New, RestActions.Create],
    });

    return this.path;
  }
}
