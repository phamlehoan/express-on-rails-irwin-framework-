import { ApplicationMailer } from "./application.mailer";

/**
 * User mailer - tương tự Rails app/mailers/user_mailer.rb
 */
export class UserMailer extends ApplicationMailer {
  static async welcomeEmail(to: string, name: string): Promise<void> {
    await this.deliver({
      to,
      subject: `Welcome, ${name}!`,
      html: `
        <h1>Welcome to Irwin Framework</h1>
        <p>Hi ${name},</p>
        <p>Your account has been created successfully.</p>
      `,
      text: `Welcome ${name}! Your account has been created.`,
    });
  }

  /** Gửi email khi tạo user mới (dùng trong UserController) */
  static async createdUser(
    to: string,
    firstName: string,
    lastName: string,
    middleName?: string
  ): Promise<void> {
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
    await this.deliver({
      to,
      subject: "Created user",
      text: `You has been created user ${fullName}`,
    });
  }

  static async passwordReset(to: string, resetLink: string): Promise<void> {
    await this.deliver({
      to,
      subject: "Password Reset",
      html: `<p>Click here to reset: <a href="${resetLink}">${resetLink}</a></p>`,
      text: `Reset your password: ${resetLink}`,
    });
  }
}
