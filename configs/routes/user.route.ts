import { UserController } from "@controllers";
import { action, RailsRoute, RestActions } from "@lib";
import { ValidateUserLoginMiddleware } from "@middlewares";

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
