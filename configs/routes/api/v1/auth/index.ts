/**
 * Auth routes - controller dùng params.permit().
 */
import { AuthController } from "@controllers/api";
import {
  GoogleVerifyValidator,
  InviteAcceptValidator,
  RefreshTokenValidator,
} from "@validators/auth.validator";
import { action, RailsRoute } from "ts-rails";

export class AuthRoute extends RailsRoute {
  public draw() {
    this.get("/invite/verify", action(AuthController, "inviteVerify"), {
      document: {
        summary: "Verify account invitation token",
        tags: ["Auth"],
      },
    });

    this.post("/invite/accept", action(AuthController, "inviteAccept"), {
      document: {
        summary: "Activate pending account with new password",
        tags: ["Auth"],
        body: InviteAcceptValidator,
      },
    });

    this.get(
      "/password-reset/verify",
      action(AuthController, "passwordResetVerify"),
      {
        document: {
          summary: "Verify admin-initiated password reset token",
          tags: ["Auth"],
        },
      },
    );

    this.post(
      "/password-reset/accept",
      action(AuthController, "passwordResetAccept"),
      {
        document: {
          summary: "Complete password reset with new password",
          tags: ["Auth"],
          body: InviteAcceptValidator,
        },
      },
    );

    this.post("/login", action(AuthController, "login"), {
      document: {
        summary: "Login email/password",
        tags: ["Auth"],
      },
    });

    this.post("/refresh-token", action(AuthController, "refreshToken"), {
      document: {
        summary: "Refresh token",
        tags: ["Auth"],
        body: RefreshTokenValidator,
        responses: {
          200: "Success",
          401: "Invalid token",
          422: "Validation failed",
        },
      },
    });

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
