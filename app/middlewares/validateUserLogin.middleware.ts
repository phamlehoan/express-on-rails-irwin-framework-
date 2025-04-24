import { FlashType } from "@configs/enum";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class ValidateUserLoginMiddleware extends ApplicationMiddleware {
  constructor() {
    super();
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      const isApiRequest = req.originalUrl.includes("/api");
      if (isApiRequest) {
        return res
          .status(403)
          .json({ success: false, error: "You have to login first." });
      } else {
        req.flash(FlashType.Errors, { msg: "You have to login first." });
        return res.redirect("/auth");
      }
    }

    next();
  }
}
