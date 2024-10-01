import { FlashType } from "@configs/enum";
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
      req.flash(FlashType.Errors, { msg: "You have to login first." });
      return res.redirect("/auth");
    }

    const user = await super.getUserById(req.session.userId);

    if (!user) {
      req.flash(FlashType.Errors, {
        msg: `User with id: ${req.session.userId} does not found.`,
      });
      return res.redirect("/auth");
    }

    next();
  }
}
