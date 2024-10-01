import { AuthController } from "@controllers";
import { Router } from "express";
import { Route } from ".";

export class AuthRoute {
  private static path = Router();
  private static authController = new AuthController();

  public static draw() {
    this.path.route("/google").get(this.authController.loginWithGoogle.bind(this.authController));
    this.path
      .route("/google/callback")
      .get(this.authController.loginWithGoogleRedirect.bind(this.authController));
    this.path
      .route("/login")
      .post(this.authController.login.bind(this.authController))

    Route.resource(this.path, this.authController);

    return this.path;
  }
}
