import { getMetadataStorage } from "class-validator";
import { RequestHandler, Router } from "express";
import "reflect-metadata";
import { action } from "./controllerHelpers";
import { ValidatorClass } from "./strongParams";
import {
  buildSwaggerOp,
  DocOptions,
  registerSwaggerPath,
  resolveApiDocSchema,
} from "./swagger";

export enum RestActions {
  Index = "index",
  Show = "show",
  New = "new",
  Create = "create",
  Edit = "edit",
  Update = "update",
  Destroy = "destroy",
}

export interface PermissionHandlers {
  forUser(permission: string): RequestHandler;
  forAny(permissions: string[]): RequestHandler;
}

export interface ActionPermissionMap {
  read: string;
  create: string;
  update: string;
  delete: string;
}

export interface CustomRouteOptions {
  setPermissionFor?: string;
  setPermissionForAny?: string[];
  /** Document options. Body có thể truyền vào một Validator Class để tự động sinh Schema. */
  document?: Omit<DocOptions, "path" | "body"> & {
    path?: string;
    body?: ValidatorClass | any;
  };
}

export interface RouteOptions {
  only?: RestActions[];
  except?: RestActions[];
  setPermissionFor?: string;
  /** Chấp nhận AM hoặc UM - dùng cho admin routes */
  setPermissionForAny?: string[];
  /** Document options cho resource */
  document?: {
    path?: string;
    tags?: string[];
    summary?: string;
    body?: ValidatorClass | any;
    responses?: Record<number | string, string>;
  };
}

export abstract class RailsRoute {
  public readonly route: Router;
  public static permissionFactory: PermissionHandlers;
  public static actionPermissionMap: ActionPermissionMap = {
    read: "READ",
    create: "CREATE",
    update: "UPDATE",
    delete: "DELETE",
  };

  constructor() {
    this.route = Router();
  }

  /** Override method này để định nghĩa routes */
  abstract draw(): void;

  /**
   * Helper để khởi tạo và lấy router (dùng trong index.ts)
   * @example app.use('/users', UserRoute.draw())
   */
  public static draw(): Router {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = new (this as any)();
    instance.draw();
    return instance.route;
  }

  /**
   * Trích xuất Swagger JSON Schema từ class-validator metadata.
   */
  private extractSchemaFromValidator(Model: ValidatorClass) {
    const metadata = getMetadataStorage();
    const targetMetadata = metadata.getTargetValidationMetadatas(
      Model,
      Model.name,
      true,
      false,
    );

    const properties: Record<string, any> = {};
    const required: string[] = [];

    targetMetadata.forEach((m) => {
      const prop = m.propertyName;
      if (properties[prop]) return;

      // Lấy type từ Reflect Metadata (nhờ class-transformer/validator)
      const designType = Reflect.getMetadata(
        "design:type",
        Model.prototype,
        prop,
      );
      let swaggerType = "string";

      if (designType === Number) swaggerType = "number";
      else if (designType === Boolean) swaggerType = "boolean";
      else if (designType === Array) swaggerType = "array";
      else if (designType === Object) swaggerType = "object";

      properties[prop] = {
        type: swaggerType,
        // Anh có thể map thêm các decorator như IsEmail, Min, Max vào đây
        description: m.constraints?.join(", ") || "",
      };

      // Nếu không có decorator IsOptional thì coi như required
      const isOptional = targetMetadata.some(
        (meta) => meta.propertyName === prop && meta.type === "isOptional",
      );
      if (!isOptional) required.push(prop);
    });

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  private resolveBody(body: any) {
    if (typeof body === "function" && body.prototype) {
      return this.extractSchemaFromValidator(body as ValidatorClass);
    }
    return body;
  }

  /**
   * Alias cho this.route.use()
   */
  protected path(...args: any[]) {
    this.route.use(...(args as [any]));
  }

  /**
   * Định nghĩa 7 routes chuẩn RESTful (Index, Show, New, Create, Edit, Update, Destroy)
   * Kèm theo logic Permission và Swagger
   */
  protected resource(
    Controller: new (...args: any[]) => any,
    options?: RouteOptions,
  ): void;
  protected resource(
    path: string,
    Controller: new (...args: any[]) => any,
    options?: RouteOptions,
  ): void;
  protected resource(
    arg1: string | (new (...args: any[]) => any),
    arg2?: (new (...args: any[]) => any) | RouteOptions,
    arg3?: RouteOptions,
  ) {
    let basePath = "/";
    let Controller: new (...args: any[]) => any;
    let options: RouteOptions | undefined;

    if (typeof arg1 === "string") {
      basePath = arg1;
      Controller = arg2 as new (...args: any[]) => any;
      options = arg3;
    } else {
      Controller = arg1 as new (...args: any[]) => any;
      options = arg2 as RouteOptions;
    }

    if (options?.only && options?.except) {
      throw new Error("Can only pass only or except!");
    }

    const getPermissionCode = (action: RestActions): string => {
      if ([RestActions.Index, RestActions.Show].includes(action)) {
        return RailsRoute.actionPermissionMap.read;
      }
      if ([RestActions.New, RestActions.Create].includes(action)) {
        return RailsRoute.actionPermissionMap.create;
      }
      if ([RestActions.Edit, RestActions.Update].includes(action)) {
        return RailsRoute.actionPermissionMap.update;
      }
      return RailsRoute.actionPermissionMap.delete; // For Destroy
    };

    const handler = (actionName: string) => action(Controller, actionName);
    const featureCodes: string[] =
      options?.setPermissionForAny ??
      (options?.setPermissionFor ? [options.setPermissionFor] : []);
    const withPermission = (actionName: string, permission: string) => {
      if (!RailsRoute.permissionFactory)
        throw new Error("RailsRoute.permissionFactory is not configured.");
      return [
        RailsRoute.permissionFactory.forUser(permission),
        handler(actionName),
      ];
    };

    const withAnyPermission = (actionName: string, perm: string) => {
      if (!RailsRoute.permissionFactory)
        throw new Error("RailsRoute.permissionFactory is not configured.");
      const codes = featureCodes.map((f: string) => `${f}::${perm}`);
      return [RailsRoute.permissionFactory.forAny(codes), handler(actionName)];
    };

    const isApi = !!options?.document;
    const apiOnly = isApi
      ? [
          RestActions.Index,
          RestActions.Show,
          RestActions.Create,
          RestActions.Update,
          RestActions.Destroy,
        ]
      : undefined;
    const effectiveOnly = isApi ? apiOnly : options?.only;
    const effectiveExcept = options?.except;

    const addApiRoute = (
      actionName: string,
      method: "get" | "post" | "put" | "delete",
      routePath: string,
      swaggerPath: string,
    ) => {
      // Generate a resource name like "Admin Users" from "/admin/users"
      const resourceName = basePath
        .split("/")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      // Capitalize the action name, e.g., "index" -> "Index"
      const capitalizedAction =
        actionName.charAt(0).toUpperCase() + actionName.slice(1);

      const defaultSummary = `${capitalizedAction} ${resourceName}`;

      // Tự động tạo tags từ tên Controller (bỏ hậu tố 'Controller')
      const defaultTags = [Controller.name.replace("Controller", "")];

      const baseDoc = options?.document
        ? {
            tags: options.document.tags || defaultTags,
            auth: true,
            summary: options.document.summary,
          }
        : { auth: true };
      const defaultResponses: Record<number, string> =
        actionName === "create"
          ? { 201: "Created", 403: "Forbidden", 422: "Validation failed" }
          : {
              200: "OK",
              403: "Forbidden",
              404: "Not Found",
              422: "Validation failed",
            };

      const docInput = { ...options?.document };
      if (docInput.body) docInput.body = this.resolveBody(docInput.body);

      const resolved = resolveApiDocSchema(docInput ?? {});
      const docOpts = {
        path: swaggerPath,
        ...baseDoc,
        ...docInput,
        // Priority: 1. options.document.summary, 2. generated default
        summary: baseDoc.summary || defaultSummary,
        params: resolved.params,
        body: resolved.body,
        requiredBody: resolved.requiredBody,
        responses: (options?.document?.responses ?? defaultResponses) as Record<
          number | string,
          string
        >,
      };
      const op = buildSwaggerOp(docOpts);
      registerSwaggerPath(swaggerPath, method, op);

      const handlers: any[] = [];
      const permCode =
        actionName === "index" || actionName === "show"
          ? "Read"
          : actionName === "create"
            ? "Create"
            : actionName === "update"
              ? "Update"
              : "Delete";

      if (options?.setPermissionForAny?.length || options?.setPermissionFor) {
        if (!RailsRoute.permissionFactory) {
          throw new Error(
            "Cannot apply permissions: RailsRoute.permissionFactory is not configured.",
          );
        }
        if (options.setPermissionForAny?.length) {
          const permCodes = options.setPermissionForAny.map(
            (f: string) => `${f}::${permCode}`,
          );
          handlers.push(RailsRoute.permissionFactory.forAny(permCodes));
        } else if (options.setPermissionFor) {
          const permCodeWithOptions = `${options.setPermissionFor}::${permCode}`;
          handlers.push(
            RailsRoute.permissionFactory.forUser(permCodeWithOptions),
          );
        }
      }
      handlers.push(handler(actionName));

      (this.route as any)[method](routePath, ...handlers);
    };

    const useAnyPerm =
      options?.setPermissionForAny && options.setPermissionForAny.length > 0;
    const usePerm = options?.setPermissionFor && !useAnyPerm;

    const routes = [
      { action: RestActions.Index, method: "get", path: "/", apiPath: "/" },
      { action: RestActions.New, method: "get", path: "/new", apiPath: null },
      {
        action: RestActions.Show,
        method: "get",
        path: "/:id",
        apiPath: "/{id}",
      },
      { action: RestActions.Create, method: "post", path: "/", apiPath: "/" },
      {
        action: RestActions.Edit,
        method: "get",
        path: "/:id/edit",
        apiPath: null,
      },
      {
        action: RestActions.Update,
        method: "put",
        path: "/:id",
        apiPath: "/{id}",
      },
      {
        action: RestActions.Destroy,
        method: "delete",
        path: "/:id",
        apiPath: "/{id}",
      },
    ] as const;

    routes.forEach(({ action: act, method, path: subPath, apiPath }) => {
      if (!this.isAllowAccess(effectiveOnly, effectiveExcept, act)) return;
      if (isApi && !apiPath) return; // Skip non-API routes (new, edit) in API mode

      const fullPath = (basePath === "/" ? "" : basePath) + subPath;

      if (isApi) {
        addApiRoute(
          act as string,
          method,
          fullPath,
          (options!.document!.path ||
            basePath.replace(/:([a-zA-Z0-9_]+)/g, "{$1}")) + apiPath,
        );
      } else {
        let handlers = [handler(act as string)];
        if (useAnyPerm) {
          const perm = getPermissionCode(act);
          handlers = withAnyPermission(act as string, perm);
        } else if (usePerm) {
          const perm = getPermissionCode(act);
          handlers = withPermission(
            act as string,
            `${options!.setPermissionFor}::${perm}`,
          );
        }
        (this.route as any)[method](fullPath, ...handlers);
      }
    });
  }

  private isAllowAccess(
    only: RestActions[] | undefined,
    except: RestActions[] | undefined,
    action: RestActions,
  ) {
    return (
      (!only && !except) ||
      (only && only?.includes(action)) ||
      (except && !except?.includes(action))
    );
  }

  // --- Helper Methods cho Custom Routes (GET, POST, PUT, DELETE) ---

  protected get(
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected get(
    path: string,
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected get(
    arg1: string | RequestHandler | RequestHandler[],
    arg2?: RequestHandler | RequestHandler[] | CustomRouteOptions,
    arg3?: CustomRouteOptions,
  ) {
    const { path, handlers, options } = this.resolveArgs(arg1, arg2, arg3);
    this.registerCustomRoute("get", path, handlers, options);
  }

  protected post(
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected post(
    path: string,
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected post(
    arg1: string | RequestHandler | RequestHandler[],
    arg2?: RequestHandler | RequestHandler[] | CustomRouteOptions,
    arg3?: CustomRouteOptions,
  ) {
    const { path, handlers, options } = this.resolveArgs(arg1, arg2, arg3);
    this.registerCustomRoute("post", path, handlers, options);
  }

  protected put(
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected put(
    path: string,
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected put(
    arg1: string | RequestHandler | RequestHandler[],
    arg2?: RequestHandler | RequestHandler[] | CustomRouteOptions,
    arg3?: CustomRouteOptions,
  ) {
    const { path, handlers, options } = this.resolveArgs(arg1, arg2, arg3);
    this.registerCustomRoute("put", path, handlers, options);
  }

  protected delete(
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected delete(
    path: string,
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected delete(
    arg1: string | RequestHandler | RequestHandler[],
    arg2?: RequestHandler | RequestHandler[] | CustomRouteOptions,
    arg3?: CustomRouteOptions,
  ) {
    const { path, handlers, options } = this.resolveArgs(arg1, arg2, arg3);
    this.registerCustomRoute("delete", path, handlers, options);
  }

  protected patch(
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected patch(
    path: string,
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ): void;
  protected patch(
    arg1: string | RequestHandler | RequestHandler[],
    arg2?: RequestHandler | RequestHandler[] | CustomRouteOptions,
    arg3?: CustomRouteOptions,
  ) {
    const { path, handlers, options } = this.resolveArgs(arg1, arg2, arg3);
    this.registerCustomRoute("patch", path, handlers, options);
  }

  private registerCustomRoute(
    method: "get" | "post" | "put" | "delete" | "patch",
    path: string,
    handlers: RequestHandler | RequestHandler[],
    options?: CustomRouteOptions,
  ) {
    let finalHandlers: RequestHandler[] = Array.isArray(handlers)
      ? handlers
      : [handlers];

    // 1. Permission Middleware
    if (options?.setPermissionForAny?.length || options?.setPermissionFor) {
      if (!RailsRoute.permissionFactory) {
        throw new Error(
          "Cannot apply permissions: RailsRoute.permissionFactory is not configured.",
        );
      }
      if (options.setPermissionForAny?.length) {
        finalHandlers.unshift(
          RailsRoute.permissionFactory.forAny(options.setPermissionForAny),
        );
      } else if (options.setPermissionFor) {
        finalHandlers.unshift(
          RailsRoute.permissionFactory.forUser(options.setPermissionFor),
        );
      }
    }

    // 2. Swagger Registration
    if (options?.document) {
      // Tự động convert path Express (:id) sang Swagger ({id}) nếu không có path cụ thể
      const swaggerPath =
        options.document.path || path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");

      // Tự động suy diễn tags từ tên Controller nếu chưa có
      if (!options.document.tags && !Array.isArray(handlers)) {
        // handlers có thể là [middleware, controllerAction] hoặc controllerAction
        // Ta cần tìm handler cuối cùng (thường là controller action) để lấy tên class
        const lastHandler = Array.isArray(handlers)
          ? handlers[handlers.length - 1]
          : handlers;
        // Lưu ý: Việc lấy tên class từ bound function (action(...)) khó thực hiện trực tiếp
        // vì 'action' trả về một hàm nặc danh.
        // Tuy nhiên, logic hiện tại của 'resource' đã xử lý việc này.
        // Đối với custom route (get/post...), ta chấp nhận tags do người dùng truyền hoặc để trống.
        // Nếu muốn tự động hoàn toàn, ta cần thay đổi cách 'action' lưu metadata.
      }

      // Default responses logic
      const defaultResponses: Record<string | number, string> =
        method === "post" ? { 201: "Created" } : { 200: "OK" };

      const { path: _p, responses, ...opts } = options.document; // loại bỏ path thừa nếu có

      const docInput = { ...opts };
      if (docInput.body) docInput.body = this.resolveBody(docInput.body);

      const resolved = resolveApiDocSchema(docInput as any);
      const operation = buildSwaggerOp({
        path: swaggerPath,
        ...docInput,
        ...resolved,
        responses: responses || defaultResponses,
      });
      registerSwaggerPath(swaggerPath, method, operation);
    }

    (this.route as any)[method](path, ...finalHandlers);
  }

  private resolveArgs(
    arg1: string | RequestHandler | RequestHandler[],
    arg2?: RequestHandler | RequestHandler[] | CustomRouteOptions,
    arg3?: CustomRouteOptions,
  ) {
    let path = "/";
    let handlers: RequestHandler | RequestHandler[];
    let options: CustomRouteOptions | undefined;

    if (typeof arg1 === "string") {
      path = arg1;
      handlers = arg2 as RequestHandler | RequestHandler[];
      options = arg3;
    } else {
      handlers = arg1 as RequestHandler | RequestHandler[];
      options = arg2 as CustomRouteOptions;
    }

    return { path, handlers, options };
  }
}
