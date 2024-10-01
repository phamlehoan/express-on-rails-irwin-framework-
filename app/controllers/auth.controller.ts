import { UserStatus } from "@configs/database";
import { FlashType } from "@configs/enum";
import env from "@configs/env";
import models from "@models";
import { Prisma } from "@prisma/client";
import axios from "axios";
import { Request, Response } from "express";
import md5 from "md5";
import { ApplicationController } from ".";

export type GoogleUser = {
  email: string;
  family_name: string;
  given_name: string;
  id: string;
  name: string;
  picture: string;
  verified_email: boolean;
};

export class AuthController extends ApplicationController {
  // Submit login with Google
  public async loginWithGoogle(req: Request, res: Response) {
    res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.googleClientId}&redirect_uri=${env.googleRedirectUri}&response_type=code&scope=profile email`
    );
  }

  // Login with Google callback
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

    const { data: googleUser } = (await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )) as { data: GoogleUser };

    const loginUser = await models.user.findUnique({
      where: {
        email: googleUser.email,
      },
    });

    if (!loginUser) {
      const newUser = await models.user.create({
        data: {
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          email: googleUser.email,
          avatarUrl: googleUser.picture,
        },
      });

      req.session.userId = newUser.id;
    } else {
      if (loginUser.deleted) {
        req.flash(FlashType.Errors, { msg: "User is deleted." });
        return res.redirect('/auth');
      } else if (loginUser.status === UserStatus.INACTIVE) {
        req.flash(FlashType.Errors, { msg: "User is banned." });
        return res.redirect('/auth');
      } else if (loginUser.status === UserStatus.PENDING) {
        req.flash(FlashType.Errors, {
          msg: "Admin is reviewing your account creation request. Please wait.!"
        });
        return res.redirect('/auth');
      }

      await models.user.update({
        where: {
          id: loginUser.id,
        },
        data: {
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          email: googleUser.email,
          avatarUrl: googleUser.picture,
        },
      });

      req.session.userId = loginUser.id;
    }

    req.flash(FlashType.Success, { msg: "Login successfully" });

    res.redirect("/");
  }

  // Login form
  public async index(req: Request, res: Response) {
    this.clearSession(req);

    res.render("auth.view/index");
  }

  // Submit login
  public async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await models.user.findUnique({
      where: {
        email,
        passwords: {
          some: {
            deleted: false,
            password: md5(password),
          }
        },
        status: UserStatus.ACTIVE,
        deleted: false,
      },
    });

    if (user) {
      req.session.userId = user.id;
      req.flash(FlashType.Success, { msg: "Login successfully" });
    } else {
      req.flash(FlashType.Errors, { msg: "User is not found." });
      return res.redirect("/auth");
    }

    res.redirect("/");
  }

  // Forgot password submited respponse
  public async show(req: Request, res: Response) {}

  // Forgot password form
  public async new(req: Request, res: Response) {
    // Logs out current user if user requests to change password for another account
    const email = req.params.id;
    if (req.user && email !== req.user.email) {
      this.clearSession(req);
    }

    res.render("auth.view/new");
  }

  // Submit forgot password
  public async create(req: Request, res: Response) {
    const { email } = req.body;

    const user = await models.user.findUnique({
      where: {
        email,
        status: UserStatus.ACTIVE,
        deleted: false,
      },
      select: {
        passwords: {
          where: {
            deleted: false
          },
          select: {
            password: true
          },
          orderBy: {
            createdAt: Prisma.SortOrder.desc
          }
        }
      }
    });

    if (!user) {
      req.flash(FlashType.Errors, { msg: "User is not found." });
      return res.render('/auth/new');
    }

    const token = user.passwords.length ? user.passwords[0]!.password : undefined;
    if (!token && !req.user) {
      req.flash(FlashType.Errors, {
        msg: "You are changing your password for the first time. " + 
          "Please log in to your account using another method before changing your password."
      });
      return res.redirect('/auth');
    }

    // TODO: Send email instead of redirect here
    return res.redirect(`/auth/${email}/edit?token=${token}`);

    res.redirect(`/auth/${email}`);
  }

  // Change password form
  public async edit(req: Request, res: Response) {
    const email = req.params.id;
    const token = req.query.token as string;

    // Logs out current user if user requests to change password for another account
    if (req.user && email !== req.user.email) {
      this.clearSession(req);
    }

    if (!token && !req.user) {
      req.flash(FlashType.Errors, {
        msg: "You are changing your password for the first time." + 
          "Please log in to your account using another method before changing your password."
      });
      return res.redirect('/auth');
    }

    let isFirstTimeCreatePassword = false;
    // Confirm token if user is forgot password and confirmed by url from email
    if (!req.user || !req.session.userId) {
      const user = await models.user.findUnique({
        where: {
          email,
          passwords: {
            some: {
              deleted: false,
              password: token,
            }
          },
          status: UserStatus.ACTIVE,
          deleted: false,
        },
        select: {
          passwords: true
        }
      });

      if (!user) {
        req.flash(FlashType.Errors, { msg: "User is not found." });
        return res.redirect('/auth');
      }
    } else {
      const currentPassword = await models.password.findFirst({
        where: {
          userId: req.user.id,
          deleted: false
        }
      });

      isFirstTimeCreatePassword = !currentPassword;
    }

    res.render('auth.view/edit', {
      user: req.user,
      email: email,
      token: token,
      isFirstTimeCreatePassword: isFirstTimeCreatePassword
    });
  }

  // Submit change password
  public async update(req: Request, res: Response) {
    const { password, passwordConfirmation } = req.body;
    const email = req.params.id;
    const oldPassword = req.user && req.body.oldPassword
      ? md5(req.body.oldPassword) // Password in session
      : req.body.oldPassword; // Password is a token from email

    if (!oldPassword && !req.user) {
      req.flash(FlashType.Errors, {
        msg: "You are changing your password for the first time." + 
          "Please log in to your account using another method before changing your password."
      });
      return res.redirect('/auth');
    }
    
    const user = await models.user.findUnique({
      where: {
        email,
        ...(oldPassword && {
          passwords: {
            some: {
              password: oldPassword,
              deleted: false,
            }
          }
        }),
        status: UserStatus.ACTIVE,
        deleted: false,
      },
      select: {
        id: true,
        passwords: true,
      }
    });

    if (!user) {
      req.flash(FlashType.Errors, { msg: "User is not found." });
      return res.redirect(`/auth/${email}/edit`);
    }

    if (!oldPassword && user.passwords.length) {
      req.flash(FlashType.Errors, { msg: "Please input your old password." });
      return res.redirect(`/auth/${email}/edit`);
    }

    if (!password || !passwordConfirmation || password !== passwordConfirmation) {
      req.flash(FlashType.Errors, { msg: "Password and confirmation do not match." });
      return res.redirect(`/auth/${email}/edit`);
    }

    await models.user.update({
      where: {
        id: user.id
      },
      data: {
        passwords: {
          updateMany: {
            where: { deleted: false },
            data: { deleted: true }
          },
          create: {
            password: md5(password),
          }
        }
      }
    })

    req.flash(FlashType.Success, {
      msg: "Change password successfully. Please login to confirm your new password!"
    });
    res.redirect('/auth');
  }

  // Logout
  public destroy(req: Request, res: Response) {
    this.clearSession(req);

    req.flash(FlashType.Info, {
      msg: "You are logged out!"
    });
    res.redirect('/auth');
  }

  private clearSession(req: Request) {
    if (req.user) {
      req.session.userId = undefined;
      req.user = undefined;
    }
  }
}
