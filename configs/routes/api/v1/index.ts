import env from "@configs/env";
import { AuthController, MyPermissionController } from "@controllers/api";
import { ValidateUserLoginMiddleware } from "@middlewares";
import {
  ChangeMyPasswordValidator,
  UpdateMyProfileValidator,
} from "@validators/auth.validator";
import { action, RailsRoute } from "ts-rails";
import { ApiV1AdminRoute } from "./admin";
import { AuthRoute } from "./auth";
import { ApiV1DevRoute } from "./dev";
import { ApiV1AiAssistantRoute } from "./aiAssistant.route";
import { ApiV1NotificationRoute } from "./notification.route";

export class ApiV1Route extends RailsRoute {
  public draw() {
    if (env.appEnv === "development") {
      this.path("/dev", ApiV1DevRoute.draw());
    }

    this.path("/auth", AuthRoute.draw());

    this.path(action(ValidateUserLoginMiddleware));

    this.get("/auth/me", action(AuthController, "me"), {
      document: {
        summary: "Current user profile + permissions",
        tags: ["Auth"],
        auth: true,
        responses: { 200: "OK", 401: "Unauthorized" },
      },
    });

    this.patch("/auth/me/profile", action(AuthController, "updateProfile"), {
      document: {
        summary: "Update my profile",
        tags: ["Auth"],
        auth: true,
        body: UpdateMyProfileValidator,
      },
    });

    this.post("/auth/me/password", action(AuthController, "changePassword"), {
      document: {
        summary: "Change my password",
        tags: ["Auth"],
        auth: true,
        body: ChangeMyPasswordValidator,
      },
    });

    // Permission routes - action(Controller, "index") tạo instance mới mỗi request
    this.get("/permissions/me", action(MyPermissionController, "index"));

    this.path("/ai", ApiV1AiAssistantRoute.draw());

    this.path("/notifications", ApiV1NotificationRoute.draw());

    // Admin routes - yêu cầu AM permission
    this.path("/admin", ApiV1AdminRoute.draw());
  }
}
