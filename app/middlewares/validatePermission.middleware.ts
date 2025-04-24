import { FlashType } from "@configs/enum";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class ValidateUserPermissionMiddleware extends ApplicationMiddleware {
  private permissionCode: string;

  constructor(permissionCode: string) {
    super();

    this.permissionCode = permissionCode;
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    const isApiRequest = req.originalUrl.includes("/api");
    if (!req.user) {
      if (isApiRequest) {
        return res
          .status(403)
          .json({ success: false, error: "You have to login first." });
      } else {
        req.flash(FlashType.Errors, { msg: "You have to login first." });
        return res.redirect("/auth");
      }
    }

    const isGetPermission = true;
    const user = await super.getUserById(req.user.id, isGetPermission);

    if (!user!.permissions?.includes(this.permissionCode)) {
      if (isApiRequest) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to access this page.",
        });
      } else {
        req.flash(FlashType.Errors, {
          msg: `You don't have permission to access this page.`,
        });
        return res.redirect(req.header("Referer") || "/");
      }
    }

    next();
  }
}
