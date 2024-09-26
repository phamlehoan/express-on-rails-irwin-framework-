import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class CurrentUserMiddleware extends ApplicationMiddleware {
  public async execute(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const userId = req.session.userId;
    req.user = userId ? await super.getUserById(userId) : null;

    next();
  }
}
