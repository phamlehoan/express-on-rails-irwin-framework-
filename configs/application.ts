import cookieParser from "cookie-parser";
import express, { Express, NextFunction, Request, Response } from "express";
import createError from "http-errors";
import env from "./env";
import { Route } from "./routes";

class Application {
  private readonly port = env.PORT || "8080";
  private readonly app: Express = express();

  constructor() {
    // TBD: Setup view engine

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());

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

  run() {
    this.mountRoutes();
    this.app
      .listen(this.port, () => {
        console.log(
          `⚡️[server]: Server is running at http://localhost:${this.port}`
        );
      })
      .on("error", (_error) => {
        return console.log("Error: ", _error.message);
      });
  }
}

export default new Application();
