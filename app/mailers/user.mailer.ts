import i18next from "i18next";
import { ApplicationMailer } from "./application.mailer";

/**
 * User mailer - tương tự Rails app/mailers/user_mailer.rb
 */
export class UserMailer extends ApplicationMailer {
  /** Gửi email khi tạo user mới (dùng trong UserController) */
  static async createdUser(
    to: string,
    firstName: string,
    lastName: string,
    middleName?: string,
  ): Promise<void> {
    const fullName = [firstName, middleName, lastName]
      .filter(Boolean)
      .join(" ");

    const appName = i18next.t("app_name");

    await this.deliver({
      to,
      subject: i18next.t("mailer.subjects.welcome", {
        name: fullName,
        appName,
      }),
      html: this.render("user.mailer/created_user", {
        fullName,
        to,
        appName,
        headerTitle: appName,
        headerColor: "#4e73df",
        accentColor: "#4e73df",
      }),
    });
  }

  /** Email kích hoạt tài khoản PENDING (Admin tạo) — link đặt mật khẩu lần đầu. */
  static async accountInvite(
    to: string,
    firstName: string,
    lastName: string,
    activateLink: string,
  ): Promise<void> {
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const appName = i18next.t("app_name");

    await this.deliver({
      to,
      subject: i18next.t("mailer.subjects.account_invite", { appName }),
      html: this.render("user.mailer/account_invite", {
        fullName,
        to,
        appName,
        activateLink,
        headerTitle: appName,
        headerColor: "#1565c0",
        accentColor: "#1565c0",
      }),
    });
  }

  static async passwordReset(to: string, resetLink: string): Promise<void> {
    const appName = i18next.t("app_name");

    await this.deliver({
      to,
      subject: i18next.t("mailer.subjects.password_reset"),
      html: this.render("user.mailer/password_reset", {
        resetLink,
        to,
        appName,
        headerTitle: i18next.t("mailer.password_reset.title"),
        headerColor: "#e74a3b",
        accentColor: "#e74a3b",
      }),
    });
  }
}
