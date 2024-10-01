import env from "@configs/env";
import { HomeController } from "@controllers";
import { CurrentUserMiddleware, Feature, Permission, ValidateUserPermissionMiddleware } from "@middlewares";
import { Router } from "express";
import { RestActions } from "../enum";
import { AdminRoute } from "./admin";
import { AuthRoute } from "./auth.route";
import { DevRoute } from "./dev.route";
import { UserRoute } from "./user.route";

export class Route {
  private static path = Router();
  private static currentUserMiddware = new CurrentUserMiddleware();
  private static homeController = new HomeController();

  public static draw() {
    this.path.use(this.currentUserMiddware.execute);

    if (env.nodeEnv === "development") this.path.use("/dev", DevRoute.draw());

    this.path.use("/admin", AdminRoute.draw());
    this.path.use("/auth", AuthRoute.draw());
    this.path.use("/users", UserRoute.draw());

    Route.resource(this.path, this.homeController, {
      only: [RestActions.Index],
    });

    return this.path;
  }

  public static resource(
    path: Router,
    customController: any,
    options?: {
      only?: RestActions[];
      except?: RestActions[];
      setPermissionFor?: Feature;
    }
  ) {
    if (options?.only && options?.except) {
      throw new Error("Can only pass only or except!");
    }

    if (this.isAllowAccess(options?.only, options?.except, RestActions.Index)) {
      if (options?.setPermissionFor) {
        const permissionMiddleware = new ValidateUserPermissionMiddleware(
          `${options?.setPermissionFor}::${Permission.Read}`);
        path.get(
          "/",
          permissionMiddleware.execute.bind(permissionMiddleware),
          customController.index
        );
      } else {
        path.route("/").get(customController.index.bind(customController));
      }
    }

    if (this.isAllowAccess(options?.only, options?.except, RestActions.New)) {
      if (options?.setPermissionFor) {
        const permissionMiddleware = new ValidateUserPermissionMiddleware(
          `${options?.setPermissionFor}::${Permission.Create}`);
        path.get(
          "/new",
          permissionMiddleware.execute.bind(permissionMiddleware),
          customController.new
        );
      } else {
        path.route("/new").get(customController.new.bind(customController));
      }
    }

    if (this.isAllowAccess(options?.only, options?.except, RestActions.Show)) {
      if (options?.setPermissionFor) {
        const permissionMiddleware = new ValidateUserPermissionMiddleware(
          `${options?.setPermissionFor}::${Permission.Read}`);
        path.get(
          "/:id",
          permissionMiddleware.execute.bind(permissionMiddleware),
          customController.show
        );
      } else {
        path.route("/:id").get(customController.show.bind(customController));
      }
    }

    if (this.isAllowAccess(options?.only, options?.except, RestActions.Create)) {
      if (options?.setPermissionFor) {
        const permissionMiddleware = new ValidateUserPermissionMiddleware(
          `${options?.setPermissionFor}::${Permission.Create}`);
        path.post(
          "/",
          permissionMiddleware.execute.bind(permissionMiddleware),
          customController.create
        );
      } else {
        path.route("/").post(customController.create.bind(customController));
      }
    }
      
    if (this.isAllowAccess(options?.only, options?.except, RestActions.Edit)) {
      if (options?.setPermissionFor) {
        const permissionMiddleware = new ValidateUserPermissionMiddleware(
          `${options?.setPermissionFor}::${Permission.Update}`);
        path.get(
          "/:id/edit",
          permissionMiddleware.execute.bind(permissionMiddleware),
          customController.edit
        );
      } else {
        path.route("/:id/edit").get(customController.edit.bind(customController));
      }
    }
      
    if (this.isAllowAccess(options?.only, options?.except, RestActions.Update)) {
      if (options?.setPermissionFor) {
        const permissionMiddleware = new ValidateUserPermissionMiddleware(
          `${options?.setPermissionFor}::${Permission.Update}`);
        path.put(
          "/:id",
          permissionMiddleware.execute.bind(permissionMiddleware),
          customController.update
        );
      } else {
        path.route("/:id").put(customController.update.bind(customController));
      }
    }
      

    if (this.isAllowAccess(options?.only, options?.except, RestActions.Destroy)) {
      if (options?.setPermissionFor) {
        const permissionMiddleware = new ValidateUserPermissionMiddleware(
          `${options?.setPermissionFor}::${Permission.Delete}`);
        path.delete(
          "/:id",
          permissionMiddleware.execute.bind(permissionMiddleware),
          customController.destroy
        );
      } else {
        path.route("/:id").delete(customController.destroy.bind(customController));
      }
    }
  }

  private static isAllowAccess(
    only: RestActions[] | undefined,
    except: RestActions[] | undefined,
    action: RestActions
  ) {
    return (
      (!only && !except) ||
      (only && only?.includes(action)) ||
      (except && !except?.includes(action))
    );
  }
}
