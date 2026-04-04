import env from "@configs/env";
import { createTransport, SendMailOptions, Transporter } from "nodemailer";
import { MailerAdapter } from "ts-rails";

/**
 * SmtpMailerAdapter - Gửi mail qua SMTP truyền thống (SendGrid, Mailgun, Custom SMTP...).
 */
export class SmtpMailerAdapter implements MailerAdapter {
  private transporter: Transporter;
  private defaultFromAddress: string;

  constructor() {
    this.transporter = createTransport({
      host: env.mailHost,
      port: env.mailPort,
      secure: env.mailPort === 465, // true cho port 465, false cho các port khác
      auth: {
        user: env.mailUser,
        pass: env.mailPass,
      },
    });
    this.defaultFromAddress = env.emailFrom || env.mailUser;
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail(options);
  }

  getDefaultFromAddress(): string {
    return this.defaultFromAddress;
  }
}
