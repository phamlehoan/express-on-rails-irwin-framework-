import env from "@configs/env";
import { createTransport, SendMailOptions, Transporter } from "nodemailer";
import { MailerAdapter } from "ts-rails";

/**
 * TestMailerAdapter - Không gửi mail thật, chỉ in ra console (giống Rails logger).
 */
export class DevMailerAdapter implements MailerAdapter {
  private transporter: Transporter;
  private defaultFromAddress: string;

  constructor() {
    // `nodemailer/rails/json-transport` không tồn tại trong gói npm; dùng transport JSON của nodemailer.
    const JSONTransport = require("nodemailer/lib/json-transport");
    this.transporter = createTransport(new JSONTransport());
    // Ghi đè hàm sendMail để log nội dung ra terminal cho anh dễ debug
    const originalSend = this.transporter.sendMail.bind(this.transporter);
    this.transporter.sendMail = (options: any) => {
      console.info(
        "\x1b[35m[Mail Sent (Test Mode)]\x1b[0m",
        JSON.stringify(options, null, 2),
      );
      return originalSend(options);
    };
    this.defaultFromAddress = `Test Mailer <${env.emailFrom || env.mailUser}>`;
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail(options);
  }

  getDefaultFromAddress(): string {
    return this.defaultFromAddress;
  }
}
