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
      html: this.render("user.mailer/created_user", { fullName, to, appName }),
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
      }),
    });
  }
}
