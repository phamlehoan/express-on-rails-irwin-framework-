import models from "@models";
import { NextFunction, Request, Response } from "express";

export class ApplicationController {
  public async validateUserLogin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
      req.flash("errors", { msg: 'You have to login first.' });
      return res.redirect('/');
    }

    const user = await models.user.findByPk(req.session.userId);
    if(!user) {
      req.flash("errors", { msg: `User with id: ${req.session.userId} does not found.` });
      return res.redirect('/');
    }

    req.user = user;
    next();
  }
}
