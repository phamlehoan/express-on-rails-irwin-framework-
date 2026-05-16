import env from "@configs/env";
import { HomeController } from "@controllers";
import {
  CurrentUserMiddleware,
  Permission,
  ValidateAnyPermissionMiddleware,
  ValidateUserPermissionMiddleware,
} from "@middlewares";
import { action, RailsRoute, RestActions } from "ts-rails";
import { AdminRoute } from "./admin";
import { ApiRoute } from "./api";
import { AuthRoute } from "./auth.route";
import { DevRoute } from "./dev.route";
import { ProfileRoute } from "./profile.route";
import { NotificationRoute } from "./notification.route";
import { UserRoute } from "./user.route";

// Configure the permission factory for the entire application.
// This decouples the RailsRoute library from specific application middlewares.
RailsRoute.permissionFactory = {
  forUser: (permission: string) => {
    const m = new ValidateUserPermissionMiddleware(permission);
    return m.execute.bind(m);
  },
  forAny: (permissions: string[]) => {
    const m = new ValidateAnyPermissionMiddleware(permissions);
    return m.execute.bind(m);
  },
};

// Configure the action permission map based on the application's Permission enum.
// This ensures the library uses the correct permission codes defined in the app.
RailsRoute.actionPermissionMap = {
  read: Permission.Read,
  create: Permission.Create,
  update: Permission.Update,
  delete: Permission.Delete,
};

export class Route extends RailsRoute {
  public draw() {
    this.path(action(CurrentUserMiddleware));

    if (env.appEnv === "development") this.path("/dev", DevRoute.draw());

    this.path("/api", ApiRoute.draw());

    this.path("/admin", AdminRoute.draw());
    this.path("/auth", AuthRoute.draw());
    this.path("/me", ProfileRoute.draw());
    this.path("/notifications", NotificationRoute.draw());
    this.path("/users", UserRoute.draw());

    this.resource(HomeController, {
      only: [RestActions.Index],
    });
  }
}
