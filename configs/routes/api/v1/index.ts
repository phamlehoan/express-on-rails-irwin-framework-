import env from "@configs/env";
import { AuthController, MyPermissionController } from "@controllers/api";
import { ValidateUserLoginMiddleware } from "@middlewares";
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

    this.get("/auth/me", action(AuthController, "me"));

    this.patch("/auth/me/profile", action(AuthController, "updateProfile"));

    this.post("/auth/me/password", action(AuthController, "changePassword"));

    // Permission routes - action(Controller, "index") tạo instance mới mỗi request
    this.get("/permissions/me", action(MyPermissionController, "index"));

    this.path("/ai", ApiV1AiAssistantRoute.draw());

    this.path("/notifications", ApiV1NotificationRoute.draw());

    // Admin routes - yêu cầu AM permission
    this.path("/admin", ApiV1AdminRoute.draw());
  }
}
