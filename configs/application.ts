import { exec } from "child_process";
import cookieParser from "cookie-parser";
import express, { Express, NextFunction, Request, Response } from "express";
import createError from "http-errors";
import { join, resolve } from "path";
import serverless from "serverless-http";
import env from "./env";
import { Route } from "./routes";

class Application {
  private readonly port = env.PORT || "3000";
  private readonly app: Express = express();

  constructor() {
    this.app.set("views", join(resolve("./app"), "views"));
    this.app.set("view engine", "pug");

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());

    this.app.use(express.static(join(resolve("app"), "assets")));
    this.app.use(
      "/css",
      express.static(join(resolve("./node_modules"), "bootstrap/dist/css"))
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

    this.mountRoutes();
    this.on404Handler();
    this.onErrorHandler();
  }

  mountRoutes() {
    this.app.use(Route.draw());
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

  handler() {
    return serverless(this.app);
  }

  run() {
    this.app
      .listen(this.port, () => {
        const url = `http://localhost:${this.port}`;
        console.log(`[server]:⚡️ Server is running at ${url}`);
        if (env.NODE_ENV === "development") exec(`start microsoft-edge:${url}`);
      })
      .on("error", (_error) => {
        return console.log("Error: ", _error.message);
      });
  }
}

export default new Application();
