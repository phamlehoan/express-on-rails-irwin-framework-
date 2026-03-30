import * as channels from "@channels";
import { MiddlewareFactory, RailsApplication } from "@lib";
import { i18nMiddleware } from "@middlewares/i18n.middleware";
import { rateLimitMiddleware } from "@middlewares/rateLimit.middleware";
import { requestIdMiddleware } from "@middlewares/requestId.middleware";
import { requestLoggingMiddleware } from "@middlewares/requestLogging.middleware";
import cors from "cors";
import express from "express";
import flash from "express-flash";
import session from "express-session";
import { join, resolve } from "path";
import { startCronJobs } from "./cron";
import env from "./env";
import { initI18n } from "./i18n";
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
  private i18nReady: Promise<void> = Promise.resolve();

  constructor() {
    super();
    this.setupConfig();
    this.setupViewEngine();
    this.setupAppMiddlewares();
    this.setupServices();
    this.setupStaticFiles();
  }

  protected setupConfig() {
    this.port = env.port || "8000";
  }

  protected setupViewEngine() {
    this.app.set("views", join(resolve("./app"), "views"));
    this.app.set("view engine", "pug");
  }

  protected setupAppMiddlewares() {
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || true,
        credentials: true,
      }),
    );

    // Serverless optimization: Only use session for non-API routes if needed
    // or use a persistent store (Redis/Database) instead of MemoryStore.
    const sessionMiddleware = session({
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: env.nodeEnv === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 3,
      },
    });

    // Store reference for Socket.IO to reuse
    RailsApplication.sessionMiddleware = sessionMiddleware;

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

  protected setupServices() {
    this.i18nReady = initI18n().then(() => {
      // Only start cron jobs in serverfull mode
      if (
        !process.env.LAMBDA_TASK_ROOT &&
        !process.env.VERCEL &&
        !process.env.IS_OFFLINE
      ) {
        startCronJobs();
      }
    });
  }

  protected setupStaticFiles() {
    this.app.use(express.static(join(resolve("app"), "assets")));
    this.app.use(
      "/css",
      express.static(join(resolve("./node_modules"), "bootstrap/dist/css")),
    );
    this.app.use(
      "/css/font-awesome",
      express.static(join(resolve("./node_modules"), "font-awesome")),
    );
    this.app.use(
      "/js",
      express.static(
        join(resolve("./node_modules"), "@popperjs/core/dist/umd"),
      ),
    );
    this.app.use(
      "/js",
      express.static(join(resolve("./node_modules"), "bootstrap/dist/js")),
    );
    this.app.use(
      "/js",
      express.static(join(resolve("./node_modules"), "jquery/dist")),
    );
    this.app.use(
      "/js",
      express.static(join(resolve("./node_modules"), "vue/dist")),
    );
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
    await this.i18nReady;
    this.bootstrap();
  }

  public async run() {
    await this.initialize();
    super.run();
  }
}

export default new Application();
