import { UserStatus } from "@configs/database";
import { FlashType } from "@configs/enum";
import env from "@configs/env";
import models from "@models";
import { Prisma } from "@prisma/client";
import {
  CreatePasswordValidator,
  LoginValidator,
  UpdatePasswordValidator,
} from "@validators/auth.validator";
import axios from "axios";
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
  async loginWithGoogle() {
    this.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.googleClientId}&redirect_uri=${env.googleRedirectUri}&response_type=code&scope=profile email`,
    );
  }

  async loginWithGoogleRedirect() {
    const { code } = this.req.query;
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
      },
    )) as { data: GoogleUser };

    const loginUser = await models.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!loginUser) {
      const newUser = await models.user.create({
        data: {
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          email: googleUser.email,
          avatarUrl: googleUser.picture,
          googleId: googleUser.id,
        },
      });
      this.req.session!.userId = newUser.id;
      this.req.session!.save((err) => {
        if (err) return this.redirect("/auth");
        this.flash(FlashType.Success, { msg: this.t("flash.login_success") });
        this.redirect("/");
      });
      return;
    }
    if (loginUser.deleted) {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_deleted") });
      return this.redirect("/auth");
    }
    if (loginUser.status === UserStatus.INACTIVE) {
      this.flash(FlashType.Errors, { msg: "User is banned." });
      return this.redirect("/auth");
    }
    if (loginUser.status === UserStatus.PENDING) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.admin_reviewing_full"),
      });
      return this.redirect("/auth");
    }

    await models.user.update({
      where: { id: loginUser.id },
      data: {
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        email: googleUser.email,
        avatarUrl: googleUser.picture,
        googleId: loginUser.googleId ? loginUser.googleId : googleUser.id,
      },
    });
    this.req.session!.userId = loginUser.id;

    this.req.session!.save((err) => {
      if (err) return this.redirect("/auth");
      this.flash(FlashType.Success, { msg: this.t("flash.login_success") });
      this.redirect("/");
    });
  }

  async index() {
    this.clearSession();
    this.render("auth.view/index");
  }

  async login() {
    const { email, password } = await this.params(LoginValidator).permit(
      "email",
      "password",
    );

    const user = await models.user.findFirst({
      where: {
        email,
        status: UserStatus.ACTIVE,
        deleted: false,
      },
      include: {
        passwords: {
          where: { deleted: false },
          orderBy: { createdAt: Prisma.SortOrder.desc },
          take: 1,
        },
      },
    });

    if (
      user &&
      user.passwords.length > 0 &&
      user.passwords[0].password === md5(password)
    ) {
      this.req.session!.userId = user.id;
      this.req.session!.save((err) => {
        if (err) {
          this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
          return this.redirect("/auth");
        }
        this.flash(FlashType.Success, { msg: this.t("flash.login_success") });
        this.redirect("/");
      });
    } else {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
      return this.redirect("/auth");
    }
  }

  async new() {
    const email = this.req.params.id;
    if (this.req.user && email !== this.req.user.email) {
      this.clearSession();
    }
    this.render("auth.view/new");
  }

  async create() {
    const { email } = await this.params(CreatePasswordValidator).permit(
      "email",
    );

    const user = await models.user.findUnique({
      where: {
        email,
        status: UserStatus.ACTIVE,
        deleted: false,
      },
      select: {
        passwords: {
          where: { deleted: false },
          select: { password: true },
          orderBy: { createdAt: Prisma.SortOrder.desc },
        },
      },
    });

    if (!user) {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
      return this.render("auth.view/new");
    }

    // TODO: Thêm logic gửi email chứa link tạo password nếu chưa có password nào,
    // thay vì hiển thị token trực tiếp trên URL
    const token = user.passwords.length
      ? user.passwords[0]!.password
      : undefined;
    if (!token && !this.req.user) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.first_time_password"),
      });
      return this.redirect("/auth");
    }

    return this.redirect(`/auth/${email}/edit?token=${token}`);
  }

  async edit() {
    const email = this.req.params.id;
    const token = this.req.query.token as string;

    if (this.req.user && email !== this.req.user.email) {
      this.clearSession();
    }

    if (!token && !this.req.user) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.first_time_password"),
      });
      return this.redirect("/auth");
    }

    let isFirstTimeCreatePassword = false;
    if (!this.req.user || !this.req.session!.userId) {
      const user = await models.user.findUnique({
        where: {
          email,
          passwords: {
            some: {
              deleted: false,
              password: token,
            },
          },
          status: UserStatus.ACTIVE,
          deleted: false,
        },
        select: { passwords: true },
      });

      if (!user) {
        this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
        return this.redirect("/auth");
      }
    } else {
      const currentPassword = await models.password.findFirst({
        where: {
          userId: this.req.user!.id,
          deleted: false,
        },
      });
      isFirstTimeCreatePassword = !currentPassword;
    }

    this.render("auth.view/edit", {
      email,
      token,
      isFirstTimeCreatePassword,
    });
  }

  async update() {
    const { password, passwordConfirmation, oldPassword } = await this.params(
      UpdatePasswordValidator,
    ).permit("password", "passwordConfirmation", "oldPassword");
    const email = this.req.params.id;
    const oldPasswordValue =
      this.req.user && oldPassword ? md5(oldPassword) : oldPassword;

    if (!oldPasswordValue && !this.req.user) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.first_time_password"),
      });
      return this.redirect("/auth");
    }

    const user = await models.user.findUnique({
      where: {
        email,
        ...(oldPasswordValue && {
          passwords: {
            some: {
              password: oldPasswordValue,
              deleted: false,
            },
          },
        }),
        status: UserStatus.ACTIVE,
        deleted: false,
      },
      select: {
        id: true,
        passwords: true,
      },
    });

    if (!user) {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
      return this.redirect(`/auth/${email}/edit`);
    }

    if (!oldPasswordValue && user.passwords.length) {
      this.flash(FlashType.Errors, { msg: this.t("flash.input_old_password") });
      return this.redirect(`/auth/${email}/edit`);
    }

    if (
      !password ||
      !passwordConfirmation ||
      password !== passwordConfirmation
    ) {
      this.flash(FlashType.Errors, { msg: this.t("flash.password_mismatch") });
      return this.redirect(`/auth/${email}/edit`);
    }

    await models.user.update({
      where: { id: user.id },
      data: {
        passwords: {
          updateMany: {
            where: { deleted: false },
            data: { deleted: true },
          },
          create: {
            password: md5(password),
          },
        },
      },
    });

    this.flash(FlashType.Success, {
      msg: this.t("flash.password_changed_relogin"),
    });
    this.redirect("/auth");
  }

  destroy() {
    this.clearSession();
    this.flash(FlashType.Info, { msg: this.t("flash.logged_out") });
    this.redirect("/auth");
  }

  private clearSession() {
    if (this.req.user) {
      this.req.session!.userId = undefined;
      (this.req as any).user = undefined;
    }
  }
}
