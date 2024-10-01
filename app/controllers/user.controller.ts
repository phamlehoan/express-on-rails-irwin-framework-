import { FlashType } from "@configs/enum";
import { getAccessToken, sendMail } from "@configs/mail";
import models from "@models";
import { Request, Response } from "express";
import { ApplicationController } from ".";

export class UserController extends ApplicationController {
  public async index(req: Request, res: Response) {
    res.render("user.view/index", { user: req.user });
  }

  public async new(req: Request, res: Response) {
    res.render("user.view/new", { user: req.user });
  }

  public async create(req: Request, res: Response) {
    const user = await models.user.create({
      data: {
        ...req.body,
      },
    });

    const accessToken = await getAccessToken();

    if (!accessToken) {
      req.flash(FlashType.Errors, { msg: "Google token has been exprired." });
      res.redirect("/users");
    }

    sendMail(
      {
        to: user.email,
        subject: "Created user",
        text: `You has been created user ${user.firstName}${
          user.middleName ? ` ${user.middleName}` : ""
        } ${user.lastName}`,
      },
      {
        req,
        res,
      },
      accessToken.token as string
    );

    req.flash(FlashType.Success, {
      msg: `Created user ${user.firstName}${
        user.middleName ? ` ${user.middleName}` : ""
      } ${user.lastName}`,
    });
    res.redirect("/users");
  }
}
