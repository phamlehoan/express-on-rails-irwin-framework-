import * as channels from "@channels";
import { ApplicationController } from "@controllers/application.controller";
import { setupBullMQWorker } from "@lib/jobs/worker";
import { appPath, vendorPath } from "@lib/utils/path";
import { i18nMiddleware } from "@middlewares/i18n.middleware";
import { rateLimitMiddleware } from "@middlewares/rateLimit.middleware";
import { requestIdMiddleware } from "@middlewares/requestId.middleware";
import { requestLoggingMiddleware } from "@middlewares/requestLogging.middleware";
import { MiddlewareFactory, RailsApplication } from "@rails";
import cors from "cors";
import express from "express";
import flash from "express-flash";
import env from "./env";
import { initI18n } from "./i18n";
import {
  initializeCache,
  initializeJobs,
  initializeLogger,
  initializeMailer,
  initializeSession,
} from "./initializers";
import { Route } from "./routes";
import { setupSwagger } from "./swagger";

// Configure the middleware factory for the entire application.
RailsApplication.middlewareFactory = {
  rateLimit: rateLimitMiddleware,
  requestId: () => requestIdMiddleware,
  requestLogging: () => requestLoggingMiddleware,
} as MiddlewareFactory;

// Register all channel classes for Socket.io
RailsApplication.channelClasses = Object.values(channels);

export class Application extends RailsApplication {
  private i18nReady: Promise<void> | null = null;

  constructor() {
    super();
    this.setupConfig();
  }

  protected setupConfig() {
    this.port = env.port || "8000";
  }

  // Phương thức mới để chạy tất cả các Initializer
  protected runInitializers() {
    initializeLogger();
    initializeMailer();
    initializeJobs();
    initializeCache();
    // Thêm các initializer khác vào đây
  }

  /**
   * Hiện thực hóa logic Worker cho BullMQ tại đây
   */
  protected startBackgroundProcessor() {
    setupBullMQWorker();
  }

  protected setupViewEngine() {
    this.app.set("views", appPath("views"));
    this.app.set("view engine", "pug");
  }

  protected setupAppMiddlewares() {
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || true,
        credentials: true,
      }),
    );

    const sessionMiddleware = initializeSession();

    // If we want purely stateless API, we could conditionalize this:
    this.app.use((req, res, next) => {
      const isStateless =
        req.path.startsWith("/api") ||
        req.path.startsWith("/docs") ||
        req.path.startsWith("/swagger.json");

      if (isStateless) return next();

      sessionMiddleware(req, res, (err) => {
        if (err) return next(err);
        flash()(req, res, next);
      });
    });

    this.app.use(i18nMiddleware);
  }

  protected async setupServices() {
    if (this.i18nReady) return await this.i18nReady;

    this.i18nReady = initI18n();
    await this.i18nReady;
  }

  protected setupStaticFiles() {
    // 1. App Assets
    this.app.use(express.static(appPath("assets")));

    // 2. Vendor Assets (Refactored to be cleaner)
    const vendors = [
      { path: "/css", dir: vendorPath("bootstrap", "dist/css") },
      { path: "/css/font-awesome", dir: vendorPath("font-awesome") },
      { path: "/js", dir: vendorPath("@popperjs/core", "dist/umd") },
      { path: "/js", dir: vendorPath("bootstrap", "dist/js") },
      { path: "/js", dir: vendorPath("jquery", "dist") },
      { path: "/js", dir: vendorPath("vue", "dist") },
    ];

    vendors.forEach((v) => {
      this.app.use(v.path, express.static(v.dir));
    });
  }

  protected mountRoutes() {
    this.app.use("/", Route.draw());
  }

  protected setupSwagger() {
    if (env.nodeEnv === "development") {
      setupSwagger(this.app);
      this.getRoutes();
    }
  }

  public async initialize() {
    this.runInitializers();
    this.setupViewEngine();
    this.setupAppMiddlewares();

    // Tự động load tất cả Controller Concerns
    this.loadConcerns(
      ApplicationController.prototype,
      "app/controllers/concerns",
    );

    this.setupStaticFiles();
    await this.setupServices();
    this.bootstrap();
  }

  public async run() {
    await this.initialize();
    super.run();
  }
}

export default new Application();
