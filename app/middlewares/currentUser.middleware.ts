import { verifyToken } from "@configs/jwt";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class CurrentUserMiddleware extends ApplicationMiddleware {
  public async execute(req: Request, res: Response, next: NextFunction) {
    try {
      let userId;

      const isApiRequest = req.originalUrl.includes("/api");
      if (isApiRequest) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          req.user = null;
          return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);

        userId = decoded.userId;
      } else {
        userId = req.session.userId;
      }

      req.user = userId ? await super.getUserById(userId) : null;

      next();
    } catch (error) {
      req.user = null;
      next();
    }
  }
}
