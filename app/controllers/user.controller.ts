import { getAccessToken, sendMail } from "@configs/mail";
import models from "@models";
import { Role, UserInstance } from "@models/user";
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
    const { confirmPassword, password } = req.body;
    if (confirmPassword !== password) {
      req.flash("errors", { msg: "Confirm password is not match." });
      return res.redirect("/users");
    }

    const user = (await models.user.create({
      name: req.body.name,
      avatarUrl: req.body.avatarUrl,
      email: req.body.email,
      password: req.body.password,
      role: Role.USER,
    })) as UserInstance;

    const accessToken = await getAccessToken();

    if (!accessToken) {
      req.flash("errors", { msg: "Google token has been exprired." });
      res.redirect("/users");
    }

    // TODO Gửi email cho người dùng sau khi tạo
    sendMail(
      {
        to: user.email,
        subject: "Created user",
        text: `You has been created user ${user.name}`,
      },
      {
        req,
        res,
      },
      accessToken.token as string
    );

    req.flash("success", { msg: `Created user ${user.name}` });
    res.redirect("/users");
  }
}
