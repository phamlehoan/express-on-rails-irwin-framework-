import * as channels from "@channels";
import { ApplicationController } from "@controllers/application.controller";
import * as jobs from "@jobs";
import { i18nMiddleware } from "@middlewares/i18n.middleware";
import { rateLimitMiddleware } from "@middlewares/rateLimit.middleware";
import { requestIdMiddleware } from "@middlewares/requestId.middleware";
import { requestLoggingMiddleware } from "@middlewares/requestLogging.middleware";
import { MiddlewareFactory, RailsApplication } from "@rails";
import bcrypt from "bcrypt";
import cors from "cors";
import express from "express";
import flash from "express-flash";
import session from "express-session";
import NodeCache from "node-cache";
import { join, resolve } from "path";
import pino from "pino";
import env from "./env";
import { initI18n } from "./i18n";
import { startCronJobs } from "./job";
import {
  GmailOAuth2MailerAdapter,
  SmtpMailerAdapter,
  TestMailerAdapter,
} from "./mail";
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

// Register all job classes for BullMQ
RailsApplication.jobClasses = Object.values(jobs) as any;

// Triển khai Adapter cho BullMQ tại tầng ứng dụng
RailsApplication.jobAdapter = {
  async enqueue(jobName: string, args: any[]) {
    const { Queue } = require("bullmq");
    const queue = new Queue("rails-jobs", {
      connection: { host: env.redisHost, port: env.redisPort },
    });
    await queue.add(jobName, args, { removeOnComplete: true });
  },
};

// Cấu hình Mailer Adapter dựa trên biến môi trường
switch (env.mailService) {
  case "gmail":
    RailsApplication.mailerAdapter = new GmailOAuth2MailerAdapter();
    break;
  case "smtp":
    RailsApplication.mailerAdapter = new SmtpMailerAdapter();
    break;
  case "test":
    RailsApplication.mailerAdapter = new TestMailerAdapter();
    break;
  default:
    console.warn(
      `[Mailer] Unknown mail service: ${env.mailService}. Mailer will not send emails.`,
    );
}

// Cấu hình Cache Store (In-memory cho dự án này)
const nodeCache = new NodeCache({ stdTTL: 300 });
RailsApplication.cacheStore = {
  get: (key) => nodeCache.get(key),
  set: (key, value, ttl) => nodeCache.set(key, value, ttl || 300),
  del: (key) => nodeCache.del(key),
  flush: () => nodeCache.flushAll(),
  has: (key) => nodeCache.has(key),
};

// Cấu hình Password Hasher (Bcrypt)
RailsApplication.hasher = {
  hash: async (password) => bcrypt.hash(password, 10),
  verify: async (password, hash) => bcrypt.compare(password, hash),
};

const pinoLogger = pino({
  level: env.nodeEnv === "development" ? "debug" : "info",
  transport:
    env.nodeEnv === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        }
      : undefined,
});

// Cấu hình Logger (Pino)
RailsApplication.loggerAdapter = {
  info: pinoLogger.info.bind(pinoLogger),
  warn: pinoLogger.warn.bind(pinoLogger),
  error: pinoLogger.error.bind(pinoLogger),
  debug: pinoLogger.debug.bind(pinoLogger),
};

export class Application extends RailsApplication {
  private i18nReady: Promise<void> | null = null;

  constructor() {
    super();
    this.setupConfig();
  }

  protected setupConfig() {
    this.port = env.port || "8000";
  }

  /**
   * Hiện thực hóa logic Worker cho BullMQ tại đây
   */
  protected startBackgroundProcessor() {
    const { Worker } = require("bullmq");
    const connection = { host: env.redisHost, port: env.redisPort };

    const registry = RailsApplication.jobClasses.reduce((acc, Klass) => {
      acc[Klass.name] = Klass;
      return acc;
    }, {} as any);

    const worker = new Worker(
      "rails-jobs",
      async (job: any) => {
        const JobClass = registry[job.name];
        if (JobClass) await new JobClass().perform(...job.data);
      },
      { connection },
    );

    // Quản lý log lỗi một cách chủ động
    let isRedisDown = false;
    worker.on("error", (err: any) => {
      if (err.code === "ECONNREFUSED" && !isRedisDown) {
        console.error("[BullMQ] Redis connection failed.");
        isRedisDown = true;
      }
    });
    worker.on("ready", () => {
      if (isRedisDown) {
        console.info("[BullMQ] Redis connection restored.");
        isRedisDown = false;
      }
    });
    worker.on("failed", (job: any, err: Error) =>
      console.error(`[Job Failed] ${job?.id}: ${err.message}`),
    );
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

  protected async setupServices() {
    if (this.i18nReady) return await this.i18nReady;

    this.i18nReady = initI18n().then(() => {
      // Only start cron jobs in serverfull mode
      if (
        !process.env.LAMBDA_TASK_ROOT &&
        !process.env.VERCEL &&
        !process.env.IS_OFFLINE &&
        !process.env.IRWIN_CONSOLE
      ) {
        startCronJobs();
      }
    });
    await this.i18nReady;
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
