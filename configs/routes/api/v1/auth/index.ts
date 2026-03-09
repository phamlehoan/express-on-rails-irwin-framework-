/**
 * Auth routes - controller dùng params.permit().
 */
import { AuthController } from "@controllers/api";
import { action } from "@lib/controllerHelpers";
import { route, doc } from "@routes/helpers";
import { GoogleVerifyValidator } from "@validators/auth.validator";
import { Router } from "express";

export class AuthRoute {
  private static path = Router();

  public static draw() {
    const r = this.path;

    route(r, "post", "/google/verify", doc("auth/google/verify", {
      summary: "Verify Google ID token",
      tags: ["Auth"],
      body: GoogleVerifyValidator,
      responses: { 200: "Success", 401: "Invalid token", 422: "Validation failed" },
    }), action(AuthController, "googleVerify"));

    return r;
  }
}
