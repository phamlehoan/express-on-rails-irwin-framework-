import { ProfileController } from "@controllers";
import { action } from "@lib/controllerHelpers";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { Router } from "express";

export class ProfileRoute {
  private static path = Router();
  private static auth = new ValidateUserLoginMiddleware();

  public static draw() {
    this.path.get("/me", this.auth.execute.bind(this.auth), action(ProfileController, "show"));
    this.path.put("/me", this.auth.execute.bind(this.auth), action(ProfileController, "update"));
    return this.path;
  }
}
