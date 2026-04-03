import cookieParser from "cookie-parser";
import express, {
  Application,
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import fs from "fs";
import { createServer, Server as HttpServer } from "http";
import createError from "http-errors";
import methodOverride from "method-override";
import path from "path";
import { Server as SocketServer } from "socket.io";
import { CacheStore } from "./cache";
import { AppError } from "./errors";
import { LoggerAdapter } from "./logger";
import { RailsChannel } from "./railsChannel";
import { JobAdapter, RailsJob } from "./railsJob";
import { MailerAdapter } from "./railsMailer";
import { ApiResponse } from "./response";
import { PasswordHasher } from "./security";
import { viewHelpers } from "./viewHelpers";

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
  public readonly app: Express = express();
  protected readonly routes: RouteInfo[] = [];
  protected port: string | number = process.env.PORT || "8000";
  public static channelClasses: (new (...args: any[]) => RailsChannel)[] = [];
  public static jobClasses: (new () => RailsJob)[] = [];
  public static mailerAdapter: MailerAdapter | null = null;
  public static jobAdapter: JobAdapter | null = null;
  public static cacheStore: CacheStore | null = null;
  public static loggerAdapter: LoggerAdapter | null = null;
  public static hasher: PasswordHasher | null = null;
  protected isInitialized = false;
  public static middlewareFactory: MiddlewareFactory;
  public static sessionMiddleware: RequestHandler | null = null;

  constructor() {
    // Không khởi tạo middleware ở đây để đợi các static properties được cấu hình đầy đủ
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

    // Inject View Helpers vào res.locals để sử dụng trong Pug
    this.app.use((req, res, next) => {
      res.locals.h = viewHelpers;
      next();
    });
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
      const segment = route.regexp.source
        .replace(/\\\//g, "/") // Giải mã các dấu gạch chéo bị escape \/ -> /
        .replace(/\/\?\(\?=\/\|\$\)/g, "") // Loại bỏ cụm suffix mặc định của Express /?(?=/|$)
        .replace(/\(\?=\/\|\$\)/g, "") // Loại bỏ suffix (?=/|$) nếu không có /?
        .replace(/^\^/, "") // Loại bỏ ký tự bắt đầu dòng ^
        .replace(/\/\?$/, "") // Loại bỏ dấu gạch chéo tùy chọn ở cuối
        .replace(/\$$/, ""); // Loại bỏ ký tự kết thúc dòng $

      const newPrefix = (
        prefix + (segment.startsWith("/") ? segment : "/" + segment)
      ).replace(/\/+/g, "/");

      route.handle.stack?.forEach((layer: any) => {
        if (layer.route) {
          const path = layer.route.path;
          Object.keys(layer.route.methods).forEach((method) => {
            this.routes.push({
              method: method.toUpperCase(),
              prefix: newPrefix,
              path: path,
            });
          });
        } else {
          this.processRoutes(layer, newPrefix);
        }
      });
    } else if (route.route) {
      const path = route.route.path;
      Object.keys(route.route.methods).forEach((method) => {
        this.routes.push({
          method: method.toUpperCase(),
          prefix: prefix || "/",
          path: path,
        });
      });
    }
  }

  public getRoutes(): RouteInfo[] {
    this.routes.length = 0; // Xóa danh sách cũ để tránh bị lặp khi gọi nhiều lần
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

    return this.routes;
  }

  /**
   * Tự động nạp các Mixins từ thư mục vào Prototype của một Class.
   * Giúp hiện thực hóa tính năng Concerns của Rails.
   */
  protected loadConcerns(targetPrototype: any, directory: string) {
    const fullPath = path.resolve(process.cwd(), directory);
    if (!fs.existsSync(fullPath)) return;

    const files = fs.readdirSync(fullPath);
    for (const file of files) {
      if (file.endsWith(".ts") || file.endsWith(".js")) {
        const mod = require(path.join(fullPath, file));
        const methods = mod.default || Object.values(mod)[0];
        if (methods && typeof methods === "object") {
          Object.assign(targetPrototype, methods);
        }
      }
    }
  }

  /**
   * Hook để khởi chạy background processor (Worker).
   * Phải được ghi đè ở subclass nếu ứng dụng sử dụng background jobs.
   */
  protected startBackgroundProcessor() {
    // Default: do nothing. Let the app implement its own worker logic.
  }

  /**
   * Đảm bảo các thành phần quan trọng của App được nạp đúng thứ tự và duy nhất 1 lần.
   */
  public bootstrap() {
    if (this.isInitialized) return;
    this.setupStandardMiddlewares();
    this.mountRoutes();
    this.setupSwagger();
    this.setupErrorHandlers();

    // Chỉ khởi chạy worker nếu không phải serverless và không phải console
    if (!process.env.LAMBDA_TASK_ROOT && !process.env.IRWIN_CONSOLE) {
      this.startBackgroundProcessor();
    }

    this.isInitialized = true;
  }

  public async run() {
    this.bootstrap();
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

  protected wrapMiddleware(middleware: RequestHandler) {
    return (socket: any, next: any) => {
      const req = socket.request;
      const res = {
        setHeader: (name: string, value: string | number | string[]) => res,
        writeHead: (
          statusCode: number,
          headers?: Record<string, string | number | string[]>,
        ) => res,
        end: (
          chunk?: any,
          encoding?: BufferEncoding,
          callback?: () => void,
        ) => {
          callback?.();
          return res;
        },
        status: (code: number) => res,
        json: (data: any) => res,
        on: (event: string, listener: (...args: any[]) => void) => res,
        emit: (event: string, ...args: any[]) => res,
      } as any;

      middleware(req, res, (err?: any) => {
        if (err) return next(err);
        // Gán user từ req.user vào socket.data.user sau khi middleware chạy
        socket.data.user = req.user;
        next();
      });
    };
  }

  protected setupSocketMiddlewares(io: SocketServer, app: Application) {
    // Giải nén danh sách middleware từ app express
    const middlewares = (app as any)._router.stack.filter((layer: any) => {
      return layer.handle.length === 3; // req, res, next
    });

    // Bọc và đăng ký middleware cho socket.io
    middlewares.forEach((item: any) => {
      const middleware = item.handle;
      io.use(this.wrapMiddleware(middleware));
    });
  }

  protected setupServer(app: Application) {
    const httpServer: HttpServer = createServer(app);
    const io = new SocketServer(httpServer, {
      cors: {
        origin: true, // Allow any origin (same as Express CORS)
        credentials: true,
      },
    });

    return { httpServer, io };
  }

  protected setupSockets(io: SocketServer) {
    // Auth middleware cho Socket.IO
    // Wrap các middleware Express (cookie-parser + session + currentUser)
    io.use(async (socket, next) => {
      try {
        const req = socket.request as any;

        const res = {} as any;

        // 1. Run cookie-parser middleware
        const cookieParser = (await import("cookie-parser")).default;
        const cookieParserMiddleware = cookieParser();
        await new Promise<void>((resolve) => {
          cookieParserMiddleware(req, res, () => resolve());
        });

        // 2. Run session middleware
        if (RailsApplication.sessionMiddleware) {
          await new Promise<void>((resolve) => {
            RailsApplication.sessionMiddleware!(req, res, () => resolve());
          });
        }

        next();
      } catch (error) {
        console.error(
          "[Socket.IO] Auth error:",
          error instanceof Error ? error.message : error,
        );
        // Still allow connection, auth checking moved to channel level
        next();
      }
    });

    io.on("connection", (socket) => {
      const { logger } = require("./logger");
      const req = socket.request as any;
      logger.info(
        { socketId: socket.id, userId: req.user?.id },
        "Socket client connected",
      );

      // Instantiate and subscribe to all registered channels for this socket
      RailsApplication.channelClasses.forEach((ChannelClass) => {
        const channelInstance = new ChannelClass(io, socket);
        channelInstance.subscribe();
      });

      socket.on("disconnect", () => {
        logger.info({ socketId: socket.id }, "Socket client disconnected");
      });
    });
  }

  protected startServer() {
    const { httpServer, io } = this.setupServer(this.app);
    this.app.set("io", io);
    this.setupSockets(io);

    httpServer
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
