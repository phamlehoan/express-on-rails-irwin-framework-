import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express, { Express, NextFunction, Request, Response } from "express";
import flash from "express-flash";
import session from "express-session";
import createError from "http-errors";
import { join, resolve } from "path";
import serverless from "serverless-http";
import { Route } from "./routes";

type RouteInfo = {
  method: string;
  prefix: string;
  path: string;
};

class Application {
  private readonly port = process.env.PORT || "8000";
  private readonly app: Express = express();
  private readonly routes: RouteInfo[] = [];

  constructor() {
    // Cài đặt template engine
    this.app.set("views", join(resolve("./app"), "views"));
    this.app.set("view engine", "pug");

    // Cài đặt các công cụ giải mã
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "a",
        resave: false,
        saveUninitialized: true,
        cookie: {
          secure: false,
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 3,
        },
      })
    );
    this.app.use(flash());
    this.app.use(bodyParser.urlencoded({ extended: false }));

    // Xuất file tĩnh như CSS, Javascript và các thư viện như Bootstraps, Vue, ...
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

    // Cài đặt các route được xây dựng trong hệ thống
    this.mountRoutes();

    // Báo lỗi khi hệ thống ghi nhận sai sót
    this.on404Handler();
    this.onErrorHandler();

    // Hàm dùng để hỗ trợ lập trình viên kiểm tra những route đã được cài đặt trong hệ thống
    this.getRoutes();
  }

  mountRoutes() {
    this.app.use('/', Route.draw());
  }

  on404Handler() {
    this.app.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        next(createError(404));
      }
    );
  }

  onErrorHandler() {
    this.app.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};

        // render the error page
        res.status(err.status || 500);
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

  run() {
    this.app
      .listen(this.port, () => {
        const url = `http://localhost:${this.port}`;
        console.log(`[server]:⚡️ Server is running at ${url}`);
        // if (env.NODE_ENV === "development") exec(`start microsoft-edge:${url}`);
      })
      .on("error", (_error) => {
        return console.log("Error: ", _error.message);
      });
  }
}

export default new Application();
