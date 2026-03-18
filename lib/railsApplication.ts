import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express, {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import createError from "http-errors";
import methodOverride from "method-override";
import serverless from "serverless-http";
import { AppError } from "./errors";
import { ApiResponse } from "./response";

export type RouteInfo = {
  method: string;
  prefix: string;
  path: string;
};

export interface MiddlewareFactory {
  rateLimit(): RequestHandler;
  requestId(): RequestHandler;
  requestLogging(): RequestHandler;
}

export class RailsApplication {
  protected readonly app: Express = express();
  protected readonly routes: RouteInfo[] = [];
  protected port: string | number = process.env.PORT || "8000";
  public static middlewareFactory: MiddlewareFactory;

  constructor() {
    this.setupStandardMiddlewares();
  }

  protected setupStandardMiddlewares() {
    if (!RailsApplication.middlewareFactory) {
      throw new Error(
        "RailsApplication.middlewareFactory has not been configured.",
      );
    }
    this.app.use(RailsApplication.middlewareFactory.requestId());
    this.app.use(RailsApplication.middlewareFactory.requestLogging());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(methodOverride("_method"));
    this.app.use(cookieParser());
    this.app.use(RailsApplication.middlewareFactory.rateLimit());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  protected mountRoutes() {
    // Override this in subclass
  }

  protected on404Handler() {
    this.app.use((_req: Request, _res: Response, next: NextFunction) => {
      next(createError(404, "Not Found"));
    });
  }

  protected onErrorHandler() {
    this.app.use(
      (err: unknown, req: Request, res: Response, _next: NextFunction) => {
        const isApiRequest = req.originalUrl?.includes("/api");
        const isDev = req.app.get("env") === "development";

        res.locals.message =
          err instanceof Error ? err.message : "Internal Server Error";
        res.locals.error = isDev && err instanceof Error ? err : {};

        // AppError (BadRequestError, NotFoundError, ...)
        if (err instanceof AppError) {
          if (isApiRequest) {
            const errors = (err as any).errors as
              | Record<string, string[]>
              | undefined;
            return res
              .status(err.statusCode)
              .json(ApiResponse.error(err.message, errors));
          }
          res.status(err.statusCode);
          return res.render("error");
        }

        // JWT errors
        if (
          err instanceof Error &&
          err.message === "Invalid or expired token"
        ) {
          return res.status(401).json(ApiResponse.error(err.message));
        }

        // http-errors và các lỗi khác
        const status = (err as any)?.status ?? (err as any)?.statusCode ?? 500;
        const message =
          err instanceof Error ? err.message : "Internal Server Error";
        if (isApiRequest) {
          return res.status(status).json(ApiResponse.error(message));
        }

        res.status(status);
        res.render("error");
      },
    );
  }

  protected processRoutes(route: any, prefix: string = ""): any {
    if (route.name === "router") {
      prefix += route.regexp
        .toString()
        .replace(/\/\^|\/\?|\/\$/g, "")
        .replace("(?=\/|$)", "")
        .replace(/\(.\)/g, "")
        .replace(/\/i\n/g, "")
        .replace(/\/i$/, "");
      route.handle.stack?.map((r: any) => {
        const path = r.route?.path;

        if (r.route)
          r.route?.stack?.map((r: any) => {
            this.routes.push({
              method: r.method.toUpperCase(),
              prefix: prefix,
              path: path,
            });
          });
        else this.processRoutes(r, prefix);
      });
    }
  }

  public getRoutes() {
    this.app._router.stack.map((r: any) => {
      this.processRoutes(r);
    });

    this.routes.sort((a: RouteInfo, b: RouteInfo) => {
      const nameA = a.prefix.toUpperCase();
      const nameB = b.prefix.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      return 0;
    });
  }

  public showRoutes(search?: string) {
    this.routes.forEach((route) => {
      if (!search || JSON.stringify(route).includes(search)) console.log(route);
    });
  }

  public handler() {
    return serverless(this.app);
  }

  public async run() {
    this.setupSwagger();
    this.setupErrorHandlers();
    this.startServer();
  }

  protected setupSwagger() {
    // This method is a placeholder and is intended to be overridden in a subclass
    // within the main application. The application is responsible for setting up
    // its own Swagger UI implementation.
  }

  protected setupErrorHandlers() {
    this.on404Handler();
    this.onErrorHandler();
  }

  protected startServer() {
    this.app
      .listen(this.port as number, () => {
        const url = `http://localhost:${this.port}`;
        const { logger } = require("./logger");
        logger.info({ url }, `Server is running at ${url}`);
      })
      .on("error", (_error: any) => {
        const { logger } = require("./logger");
        if (_error.code === "EADDRINUSE") {
          logger.error(`Port ${this.port} is already in use.`);
        } else {
          logger.error({ err: _error }, _error.message);
        }
      });
  }
}
