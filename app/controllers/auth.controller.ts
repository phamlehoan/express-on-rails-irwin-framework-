import env from "@configs/env";
import models from "@models";
import { Role, UserInstance } from "@models/user";
import axios from "axios";
import { Request, Response } from "express";
import { ApplicationController } from ".";

export class AuthController extends ApplicationController {
  public async loginWithGoogle(req: Request, res: Response) {
    res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.googleClientId}&redirect_uri=${env.googleRedirectUri}&response_type=code&scope=profile email`
    );
  }

  public async loginWithGoogleRedirect(req: Request, res: Response) {
    const { code } = req.query;
    const {
      data: { access_token },
    } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code,
      redirect_uri: env.googleRedirectUri,
      grant_type: "authorization_code",
    });

    const { data: googleUser } = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const loginUser = (await models.user.findOne({
      where: {
        email: googleUser.email,
      },
    })) as UserInstance;

    if (!loginUser) {
      const newUser = (await models.user.create({
        name: googleUser.name,
        email: googleUser.email,
        avatarUrl: googleUser.picture,
        role: Role.USER,
        password: null,
      })) as UserInstance;

      req.session.userId = newUser.id;
    } else {
      await models.user.update(
        {
          name: googleUser.name,
          email: googleUser.email,
          avatarUrl: googleUser.picture,
        },
        {
          where: {
            id: loginUser.id,
          },
        }
      );

      req.session.userId = loginUser.id;
    }

    req.flash("success", { msg: "Login successfully" });

    res.redirect("/");
  }

  public async destroy(req: Request, res: Response) {
    req.session.destroy((err: Error) => {
      if (err) console.log(err);
      else {
        res.redirect("https://accounts.google.com/logout");
      }
    });
  }
}
