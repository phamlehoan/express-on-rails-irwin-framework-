import env from "@configs/env";
import { registerSwaggerPath } from "@configs/swagger/registry";
import { HomeController } from "@controllers";
import { getApiDoc, resolveApiDocSchema } from "@lib/apiDoc";
import { action } from "@lib/controllerHelpers";
import { ApiResponse } from "@lib/response";
import {
  CurrentUserMiddleware,
  Permission,
  ValidateAnyPermissionMiddleware,
  ValidateUserPermissionMiddleware,
} from "@middlewares";
import { buildSwaggerOp } from "@routes/helpers";
import { Router } from "express";
import { Feature, RestActions } from "../enum";
import { AdminRoute } from "./admin";
import { ApiRoute } from "./api";
import { AuthRoute } from "./auth.route";
import { DevRoute } from "./dev.route";
import { ProfileRoute } from "./profile.route";
import { UserRoute } from "./user.route";

export class Route {
  private static path = Router();
  private static currentUserMiddware = new CurrentUserMiddleware();

  public static draw() {
    // Health - liveness (process còn chạy)
    this.path.get("/health", (_req, res) => {
      ApiResponse.sendOk(res, {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Readiness - sẵn sàng nhận traffic (DB, cache ok)
    this.path.get("/ready", async (_req, res) => {
      const { checkReadiness } = await import("@configs/health");
      const status = await checkReadiness();
      const code = status.status === "ok" ? 200 : 503;
      res.status(code).json(ApiResponse.ok(status));
    });

    this.path.use(this.currentUserMiddware.execute.bind(this.currentUserMiddware));

    if (env.nodeEnv === "development") this.path.use("/dev", DevRoute.draw());

    this.path.use("/api", ApiRoute.draw());

    this.path.use("/admin", AdminRoute.draw());
    this.path.use("/auth", AuthRoute.draw());
    this.path.use("/", ProfileRoute.draw());
    this.path.use("/users", UserRoute.draw());

    Route.resource(this.path, HomeController, {
      only: [RestActions.Index],
    });

    return this.path;
  }

  public static resource(
    path: Router,
    Controller: new (...args: any[]) => any,
    options?: {
      only?: RestActions[];
      except?: RestActions[];
      setPermissionFor?: Feature;
      /** Chấp nhận AM hoặc UM - dùng cho admin routes */
      setPermissionForAny?: Feature[];
      /** API mode: REST + Swagger từ @ApiDoc trên controller */
      api?: { swaggerPath: string; tags: string[] };
    }
  ) {
    if (options?.only && options?.except) {
      throw new Error("Can only pass only or except!");
    }

    const handler = (actionName: string) => action(Controller, actionName);
    const featureCodes: Feature[] = options?.setPermissionForAny ?? (options?.setPermissionFor ? [options.setPermissionFor] : []);
    const withPermission = (actionName: string, permission: string) => {
      const m = new ValidateUserPermissionMiddleware(permission);
      return [m.execute.bind(m), handler(actionName)];
    };
    const withAnyPermission = (actionName: string, perm: string) => {
      const codes = featureCodes.map((f: Feature) => `${f}::${perm}`);
      const m = new ValidateAnyPermissionMiddleware(codes);
      return [m.execute.bind(m), handler(actionName)];
    };

    const isApi = !!options?.api;
    const apiOnly = isApi ? [RestActions.Index, RestActions.Show, RestActions.Create, RestActions.Update, RestActions.Destroy] : undefined;
    const effectiveOnly = isApi ? apiOnly : options?.only;
    const effectiveExcept = options?.except;

    const addApiRoute = (actionName: string, method: "get" | "post" | "put" | "delete", routePath: string, swaggerPath: string) => {
      const doc = getApiDoc(Controller, actionName);
      const baseDoc = options?.api ? { tags: options.api.tags, auth: true } : {};
      const defaultResponses: Record<number, string> = actionName === "create"
        ? { 201: "Created", 403: "Forbidden", 422: "Validation failed" }
        : { 200: "OK", 403: "Forbidden", 404: "Not Found", 422: "Validation failed" };
      const { params: _p, body: _b, requiredBody: _r, ...docRest } = doc ?? {};
      const resolved = resolveApiDocSchema(doc ?? {});
      const docOpts = {
        path: swaggerPath,
        ...baseDoc,
        ...docRest,
        params: resolved.params,
        body: resolved.body,
        requiredBody: resolved.requiredBody,
        responses: (doc?.responses ?? defaultResponses) as Record<number | string, string>,
      };
      const op = buildSwaggerOp(docOpts);
      registerSwaggerPath(swaggerPath, method, op);

      const handlers: any[] = [];
      const permCode = actionName === "index" || actionName === "show" ? Permission.Read : actionName === "create" ? Permission.Create : actionName === "update" ? Permission.Update : Permission.Delete;
      if (options?.setPermissionForAny?.length) {
        const m = new ValidateAnyPermissionMiddleware(options.setPermissionForAny.map((f: Feature) => `${f}::${permCode}`));
        handlers.push(m.execute.bind(m));
      } else if (options?.setPermissionFor) {
        const m = new ValidateUserPermissionMiddleware(`${options.setPermissionFor}::${permCode}`);
        handlers.push(m.execute.bind(m));
      }
      handlers.push(handler(actionName));

      (path as any)[method](routePath, ...handlers);
    };

    const useAnyPerm = options?.setPermissionForAny && options.setPermissionForAny.length > 0;
    const usePerm = options?.setPermissionFor && !useAnyPerm;

    if (this.isAllowAccess(effectiveOnly, effectiveExcept, RestActions.Index)) {
      if (isApi) {
        addApiRoute("index", "get", "/", options!.api!.swaggerPath);
      } else if (useAnyPerm) {
        path.get("/", ...withAnyPermission("index", Permission.Read));
      } else if (usePerm) {
        path.get("/", ...withPermission("index", `${options!.setPermissionFor}::${Permission.Read}`));
      } else {
        path.route("/").get(handler("index"));
      }
    }

    if (!isApi && this.isAllowAccess(effectiveOnly, effectiveExcept, RestActions.New)) {
      if (useAnyPerm) {
        path.get("/new", ...withAnyPermission("new", Permission.Create));
      } else if (usePerm) {
        path.get("/new", ...withPermission("new", `${options!.setPermissionFor}::${Permission.Create}`));
      } else {
        path.route("/new").get(handler("new"));
      }
    }

    if (this.isAllowAccess(effectiveOnly, effectiveExcept, RestActions.Show)) {
      if (isApi) {
        addApiRoute("show", "get", "/:id", `${options!.api!.swaggerPath}/{id}`);
      } else if (useAnyPerm) {
        path.get("/:id", ...withAnyPermission("show", Permission.Read));
      } else if (usePerm) {
        path.get("/:id", ...withPermission("show", `${options!.setPermissionFor}::${Permission.Read}`));
      } else {
        path.route("/:id").get(handler("show"));
      }
    }

    if (this.isAllowAccess(effectiveOnly, effectiveExcept, RestActions.Create)) {
      if (isApi) {
        addApiRoute("create", "post", "/", options!.api!.swaggerPath);
      } else if (useAnyPerm) {
        path.post("/", ...withAnyPermission("create", Permission.Create));
      } else if (usePerm) {
        path.post("/", ...withPermission("create", `${options!.setPermissionFor}::${Permission.Create}`));
      } else {
        path.route("/").post(handler("create"));
      }
    }

    if (!isApi && this.isAllowAccess(effectiveOnly, effectiveExcept, RestActions.Edit)) {
      if (useAnyPerm) {
        path.get("/:id/edit", ...withAnyPermission("edit", Permission.Update));
      } else if (usePerm) {
        path.get("/:id/edit", ...withPermission("edit", `${options!.setPermissionFor}::${Permission.Update}`));
      } else {
        path.route("/:id/edit").get(handler("edit"));
      }
    }

    if (this.isAllowAccess(effectiveOnly, effectiveExcept, RestActions.Update)) {
      if (isApi) {
        addApiRoute("update", "put", "/:id", `${options!.api!.swaggerPath}/{id}`);
      } else if (useAnyPerm) {
        path.put("/:id", ...withAnyPermission("update", Permission.Update));
      } else if (usePerm) {
        path.put("/:id", ...withPermission("update", `${options!.setPermissionFor}::${Permission.Update}`));
      } else {
        path.route("/:id").put(handler("update"));
      }
    }

    if (this.isAllowAccess(effectiveOnly, effectiveExcept, RestActions.Destroy)) {
      if (isApi) {
        addApiRoute("destroy", "delete", "/:id", `${options!.api!.swaggerPath}/{id}`);
      } else if (useAnyPerm) {
        path.delete("/:id", ...withAnyPermission("destroy", Permission.Delete));
      } else if (usePerm) {
        path.delete("/:id", ...withPermission("destroy", `${options!.setPermissionFor}::${Permission.Delete}`));
      } else {
        path.route("/:id").delete(handler("destroy"));
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
