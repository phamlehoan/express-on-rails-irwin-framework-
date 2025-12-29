import { AuthController } from "@controllers/api";
import { Router } from "express";

export class AuthRoute {
  private static path = Router();
  private static authController = new AuthController();

  public static draw() {
    this.path.post(
      "/google/verify",
      this.authController.googleVerify.bind(this.authController)
    );
    return this.path;
  }
}
