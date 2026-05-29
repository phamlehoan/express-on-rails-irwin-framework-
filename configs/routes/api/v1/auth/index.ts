/**
 * Auth routes - controller dùng params.permit().
 */
import { AuthController } from "@controllers/api";
import {
  GoogleVerifyValidator,
  InviteAcceptValidator,
  LoginValidator,
  RegisterApiValidator,
  RefreshTokenValidator,
} from "@validators/auth.validator";
import { action, RailsRoute } from "ts-rails";

export class AuthRoute extends RailsRoute {
  public draw() {
    this.get("/invite/verify", action(AuthController, "inviteVerify"), {
      document: {
        summary: "Verify account invitation token",
        tags: ["Auth"],
        public: true,
        params: { token: "string" },
      },
    });

    this.post("/invite/accept", action(AuthController, "inviteAccept"), {
      document: {
        summary: "Activate pending account with new password",
        tags: ["Auth"],
        public: true,
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
          public: true,
          params: { token: "string" },
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
          public: true,
          body: InviteAcceptValidator,
        },
      },
    );

    this.post("/register", action(AuthController, "register"), {
      document: {
        summary: "Register new account",
        tags: ["Auth"],
        public: true,
        body: RegisterApiValidator,
        responses: {
          201: "Created",
          422: "Validation failed",
        },
      },
    });

    this.post("/login", action(AuthController, "login"), {
      document: {
        summary: "Login email/password",
        tags: ["Auth"],
        public: true,
        body: LoginValidator,
        responses: {
          200: "OK",
          401: "Unauthorized",
          422: "Validation failed",
        },
      },
    });

    this.post("/refresh-token", action(AuthController, "refreshToken"), {
      document: {
        summary: "Refresh token",
        tags: ["Auth"],
        public: true,
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
        public: true,
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
