import { PasswordType, UserStatus } from "@configs/db/enums";
import { FlashType } from "@configs/enum";
import env from "@configs/env";
import { Prisma } from "@db";
import { generateToken, verifyToken } from "@lib";
import { UserMailer } from "@mailers";
import models from "@models";
import {
  CreatePasswordValidator,
  LoginValidator,
  UpdatePasswordValidator,
} from "@validators/auth.validator";
import axios from "axios";
import { Security } from "ts-rails";
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
        // Nếu anh muốn dùng Token thay vì Session, anh có thể trả về JSON tại đây
        // const tokens = this.generateAuthTokens(newUser.id);
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

    // const tokens = this.generateAuthTokens(loginUser.id);

    this.req.session!.save((err) => {
      if (err) return this.redirect("/auth");
      this.flash(FlashType.Success, { msg: this.t("flash.login_success") });
      this.redirect("/");
    });
  }

  async index() {
    this.logoutUser();
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
          where: { deleted: false, type: PasswordType.PASSWORD },
          orderBy: { createdAt: Prisma.SortOrder.desc },
          take: 1,
        },
      },
    });

    if (
      user &&
      user.passwords.length > 0 &&
      (await Security.verifyPassword(password, user.passwords[0].password))
    ) {
      this.req.session!.userId = user.id;
      // const tokens = this.generateAuthTokens(user.id);

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

  // Change Password Page
  async new() {
    const email = this.req.params.id;
    if (this.req.user && email !== this.req.user.email) {
      this.logoutUser();
    }
    this.render("auth.view/new");
  }

  // Request send email to reset password
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
    });

    if (!user) {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
      return this.render("auth.view/new");
    }

    // Tạo JWT token tạm thời có hiệu lực trong 15 phút
    const resetToken = generateToken({ id: user.id, email: user.email }, "15m");
    const protocol = this.req.protocol;
    const host = this.req.get("host");
    const baseUrl = env.appUrl || `${protocol}://${host}`;

    // Tạo link dẫn tới trang reset password trên Frontend
    const resetLink = `${baseUrl}/auth/${encodeURIComponent(user.email)}/edit?token=${resetToken}`;

    // Gửi email cho người dùng
    await UserMailer.passwordReset(user.email, resetLink);

    this.flash(FlashType.Success, { msg: this.t("flash.reset_password_sent") });
    return this.redirect("/auth");
  }

  async edit() {
    const email = this.req.params.id;
    const token = this.req.query.token as string;

    if (this.req.user && email !== this.req.user.email) {
      this.logoutUser();
    }

    if (!token && !this.req.user) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.first_time_password"),
      });
      return this.redirect("/auth");
    }

    let isFirstTimeCreatePassword = false;
    if (!this.req.user || !this.req.session!.userId) {
      try {
        const decoded = verifyToken(token);
        if (decoded.email !== email) {
          this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
          return this.redirect("/auth");
        }
        const user = await models.user.findUnique({
          where: {
            id: decoded.id,
            email,
            status: UserStatus.ACTIVE,
            deleted: false,
          },
          select: { passwords: true },
        });

        if (!user) {
          this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
          return this.redirect("/auth");
        }
      } catch {
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
    const { password, passwordConfirmation, oldPassword, token } =
      await this.params(UpdatePasswordValidator).permit(
        "password",
        "passwordConfirmation",
        "oldPassword",
        "token",
      );
    const email = this.req.params.id;

    // Phải có hoặc oldPassword (đang logged in) hoặc token (quên mật khẩu)
    if (!oldPassword && !token) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.first_time_password"),
      });
      return this.redirect("/auth");
    }

    const user = await models.user.findUnique({
      where: {
        email,
        status: UserStatus.ACTIVE,
        deleted: false,
      },
    });

    if (!user) {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
      return this.redirect(`/auth/${email}/edit`);
    }

    if (token) {
      // Verify token và kiểm tra tính hợp lệ của User ID
      try {
        const decoded = verifyToken(token);
        if (decoded.id !== user.id) throw new Error("User mismatch");
      } catch (err) {
        this.flash(FlashType.Errors, { msg: this.t("flash.invalid_token") });
        return this.redirect(`/auth/${email}/edit?token=${token}`);
      }
    } else if (oldPassword) {
      const currentPwd = await models.password.findFirst({
        where: { userId: user.id, deleted: false },
      });
      const isMatch = currentPwd
        ? await Security.verifyPassword(
            oldPassword as string,
            currentPwd.password,
          )
        : false;

      if (!isMatch) {
        this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
        return this.redirect(`/auth/${email}/edit`);
      }
    } else {
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
            password: await Security.hashPassword(password),
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
    this.logoutUser();
    this.flash(FlashType.Info, { msg: this.t("flash.logged_out") });
    this.redirect("/auth");
  }
}
