import { FlashType } from "@configs/enum";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export enum Feature {
  AdministrationManagement = 'AM'
}

export class ValidateUserPermissionMiddleware extends ApplicationMiddleware {
  private permissionCode: string;

  constructor(permissionCode: string) {
    super();

    this.permissionCode = permissionCode;
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

    const isGetPermission = true;
    const user = await super.getUserById(req.session.userId, isGetPermission);

    if (!user) {
      req.flash(FlashType.Errors, {
        msg: `User with id: ${req.session.userId} does not found.`,
      });
      return res.redirect("/auth");
    }

    if (!user.permissions?.includes(this.permissionCode)) {
      req.flash(FlashType.Errors, {
        msg: `You don't have permission to access this page.`,
      });
      return res.redirect(req.header('Referer') || '/');
    }

    next();
  }
}
