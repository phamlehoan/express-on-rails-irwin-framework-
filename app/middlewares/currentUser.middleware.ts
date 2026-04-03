import { verifyToken } from "@lib";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

const ADMIN_FEATURE_CODES = ["AM", "UM"];

export class CurrentUserMiddleware extends ApplicationMiddleware {
  public async execute(req: Request, res: Response, next: NextFunction) {
    try {
      let userId: string | undefined;

      const isApiRequest = req.originalUrl.includes("/api");
      if (isApiRequest) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          req.user = null;
          return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        userId = decoded.id;
      } else {
        userId = req.session?.userId;
      }

      req.user = userId ? await super.getUserById(userId, true) : null;

      // Cho request web: set hasAdminAccess để layout hiển thị nút Admin (có bất kỳ permission AM hoặc UM)
      if (!isApiRequest) {
        const perms = req.user?.permissions ?? [];
        (res.locals as any).hasAdminAccess = perms.some((p: string) =>
          ADMIN_FEATURE_CODES.some((code) => p.startsWith(`${code}::`)),
        );
      }

      next();
    } catch (error) {
      req.user = null;
      next();
    }
  }
}
