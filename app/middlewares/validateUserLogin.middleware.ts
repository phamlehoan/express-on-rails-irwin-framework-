import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class ValidateUserLoginMiddleware extends ApplicationMiddleware {
  constructor() {
    super()
  }

  public async execute(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!req.session.userId) {
      req.flash("errors", { msg: "You have to login first." });
      return res.redirect("/");
    }

    const user = await super.getUserById(req.session.userId);

    if (!user) {
      req.flash("errors", {
        msg: `User with id: ${req.session.userId} does not found.`,
      });
      return res.redirect("/");
    }

    next();
  }
}
