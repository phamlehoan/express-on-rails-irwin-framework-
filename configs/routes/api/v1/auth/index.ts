/**
 * Auth routes - controller dùng params.permit().
 */
import { AuthController } from "@controllers/api";
import { action, RailsRoute } from "@lib";
import { GoogleVerifyValidator } from "@validators/auth.validator";

export class AuthRoute extends RailsRoute {
  public draw() {
    this.post("/google/verify", action(AuthController, "googleVerify"), {
      document: {
        summary: "Verify Google ID token",
        tags: ["Auth"],
        body: GoogleVerifyValidator,
        responses: {
          200: "Success",
          401: "Invalid token",
          422: "Validation failed",
        },
      },
    });
  }
}
