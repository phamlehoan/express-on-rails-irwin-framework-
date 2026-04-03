import { AuthController } from "@controllers";
import { action, RailsRoute } from "@rails";

export class AuthRoute extends RailsRoute {
  public draw() {
    this.get("/google", action(AuthController, "loginWithGoogle"));
    this.get(
      "/google/callback",
      action(AuthController, "loginWithGoogleRedirect"),
    );
    this.post("/login", action(AuthController, "login"));

    this.resource(AuthController);
  }
}
