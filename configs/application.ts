import env from "./env";
import { startCronJobs } from "./cron";
import { initI18n } from "./i18n";
import { AppError } from "@lib/errors";
import { ApiResponse } from "@lib/response";
import { i18nMiddleware } from "@middlewares/i18n.middleware";
import { rateLimitMiddleware } from "@middlewares/rateLimit.middleware";
import { requestIdMiddleware } from "@middlewares/requestId.middleware";
import { requestLoggingMiddleware } from "@middlewares/requestLogging.middleware";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import flash from "express-flash";
import session from "express-session";
import createError from "http-errors";
import methodOverride from "method-override";
import { join, resolve } from "path";
import serverless from "serverless-http";
import { Route } from "./routes";

type RouteInfo = {
  method: string;
  prefix: string;
  path: string;
};

class Application {
  private readonly port = env.port || "8000";
  private readonly app: Express = express();
  private readonly routes: RouteInfo[] = [];
  private i18nReady: Promise<void> = Promise.resolve();

  constructor() {
    this.app.set("views", join(resolve("./app"), "views"));
    this.app.set("view engine", "pug");

    this.app.use(requestIdMiddleware);
    this.app.use(requestLoggingMiddleware);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(methodOverride("_method"));
    this.app.use(cookieParser());
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || true,
        credentials: true,
      })
    );
    this.app.use(rateLimitMiddleware());
    this.app.use(
      session({
        secret: env.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: env.nodeEnv === "production",
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 3,
        },
      })
    );
    this.app.use(flash());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(i18nMiddleware);

    this.app.use(express.static(join(resolve("app"), "assets")));
    this.app.use(
      "/css",
      express.static(join(resolve("./node_modules"), "bootstrap/dist/css"))
    );
    this.app.use(
      "/css/font-awesome",
      express.static(join(resolve("./node_modules"), "font-awesome"))
    );
    this.app.use(
      "/js",
      express.static(join(resolve("./node_modules"), "@popperjs/core/dist/umd"))
    );
    this.app.use(
      "/js",
      express.static(join(resolve("./node_modules"), "bootstrap/dist/js"))
    );
    this.app.use(
      "/js",
      express.static(join(resolve("./node_modules"), "jquery/dist"))
    );
    this.app.use(
      "/js",
      express.static(join(resolve("./node_modules"), "vue/dist"))
    );

    // I18n, Cron (async init) - lưu promise để run() await
    this.i18nReady = initI18n().then(() => startCronJobs());

    // Cài đặt các route được xây dựng trong hệ thống
    this.mountRoutes();

    // API Documentation (Swagger) - paths được đăng ký từ từng route file
    if (env.nodeEnv === "development") {
      const { setupSwagger } = require("./swagger/index");
      setupSwagger(this.app);
    }

    // 404 - catch-all cho route không tồn tại
    this.on404Handler();
    // Global error handler
    this.onErrorHandler();

    // Hàm dùng để hỗ trợ lập trình viên kiểm tra những route đã được cài đặt trong hệ thống
    this.getRoutes();
  }

  mountRoutes() {
    this.app.use("/", Route.draw());
  }

  on404Handler() {
    this.app.use((_req: Request, _res: Response, next: NextFunction) => {
      next(createError(404, "Not Found"));
    });
  }

  onErrorHandler() {
    this.app.use(
      (err: unknown, req: Request, res: Response, _next: NextFunction) => {
        const isApiRequest = req.originalUrl?.includes("/api");
        const isDev = req.app.get("env") === "development";

        res.locals.message = err instanceof Error ? err.message : "Internal Server Error";
        res.locals.error = isDev && err instanceof Error ? err : {};

        // AppError (BadRequestError, NotFoundError, ...)
        if (err instanceof AppError) {
          if (isApiRequest) {
            const errors = (err as any).errors as
              | Record<string, string[]>
              | undefined;
            return res.status(err.statusCode).json(
              ApiResponse.error(err.message, errors)
            );
          }
          res.status(err.statusCode);
          return res.render("error");
        }

        // JWT errors
        if (err instanceof Error && err.message === "Invalid or expired token") {
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
      }
    );
  }

  processRoutes(route: any, prefix: string = ""): any {
    if (route.name === "router") {
      prefix += route.regexp
        .toString()
        .replace(/\/\^|\/\?|\/\$/g, "")
        .replace("(?=\\/|$)", "")
        .replace(/\\(.)/g, "$1")
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

  getRoutes() {
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

  showRoutes(search?: string) {
    this.routes.forEach((route) => {
      if (!search || JSON.stringify(route).includes(search)) console.log(route);
    });
  }

  handler() {
    return serverless(this.app);
  }

  async run() {
    await this.i18nReady;
    this.app
      .listen(this.port, () => {
        const url = `http://localhost:${this.port}`;
        const { logger } = require("@lib/logger");
        logger.info({ url }, `Server is running at ${url}`);
      })
      .on("error", (_error: Error) => {
        const { logger } = require("@lib/logger");
        logger.error({ err: _error }, _error.message);
      });
  }
}

export default new Application();
