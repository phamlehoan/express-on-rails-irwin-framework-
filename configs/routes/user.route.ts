import { UserController } from "@controllers";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { action, RailsRoute, RestActions } from "ts-rails";

export class UserRoute extends RailsRoute {
  public draw() {
    this.get([
      action(ValidateUserLoginMiddleware),
      action(UserController, "index"),
    ]);
    this.resource(UserController, {
      only: [RestActions.New, RestActions.Create],
    });
  }
}
