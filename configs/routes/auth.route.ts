import { AuthController } from "@controllers";
import { action } from "@lib/controllerHelpers";
import { Router } from "express";
import { Route } from ".";

export class AuthRoute {
  private static path = Router();

  public static draw() {
    this.path.route("/google").get(action(AuthController, "loginWithGoogle"));
    this.path
      .route("/google/callback")
      .get(action(AuthController, "loginWithGoogleRedirect"));
    this.path.route("/login").post(action(AuthController, "login"));

    Route.resource(this.path, AuthController);

    return this.path;
  }
}
