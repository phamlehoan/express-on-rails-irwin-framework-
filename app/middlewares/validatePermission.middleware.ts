import { FlashType } from "@configs/enum";
import { User } from "@db";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class ValidateUserPermissionMiddleware extends ApplicationMiddleware {
  private permissionCode: string;

  constructor(permissionCode: string) {
    super();

    this.permissionCode = permissionCode;
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    const user = req.user as User & { permissions?: string[] };
    const isApiRequest = req.originalUrl.includes("/api");
    if (!user) {
      const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
      if (isApiRequest) {
        return res
          .status(403)
          .json({ success: false, error: t("flash.login_first") });
      } else {
        req.flash(FlashType.Errors, { msg: t("flash.no_permission") });
        return res.redirect("/");
      }
    }

    if (!user.permissions?.includes(this.permissionCode)) {
      const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
      if (isApiRequest) {
        return res.status(403).json({
          success: false,
          error: t("flash.no_permission"),
        });
      } else {
        req.flash(FlashType.Errors, { msg: t("flash.no_permission") });
        return res.redirect(req.header("Referer") || "/");
      }
    }

    next();
  }
}

/**
 * Kiểm tra user có ít nhất một trong các permission.
 * Dùng cho admin khi chấp nhận AM hoặc UM.
 */
export class ValidateAnyPermissionMiddleware extends ApplicationMiddleware {
  private permissionCodes: string[];

  constructor(permissionCodes: string[]) {
    super();
    this.permissionCodes = permissionCodes;
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    const user = req.user as User & { permissions?: string[] };
    const isApiRequest = req.originalUrl.includes("/api");
    if (!user) {
      const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
      if (isApiRequest) {
        return res
          .status(403)
          .json({ success: false, error: t("flash.login_first") });
      } else {
        req.flash(FlashType.Errors, { msg: t("flash.no_permission") });
        return res.redirect("/");
      }
    }

    const hasAny = this.permissionCodes.some((code) =>
      user.permissions?.includes(code),
    );

    if (!hasAny) {
      const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
      if (isApiRequest) {
        return res.status(403).json({
          success: false,
          error: t("flash.no_permission"),
        });
      } else {
        req.flash(FlashType.Errors, { msg: t("flash.no_permission") });
        return res.redirect(req.header("Referer") || "/");
      }
    }

    next();
  }
}
