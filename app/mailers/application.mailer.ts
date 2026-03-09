import env from "@configs/env";
import { getAccessToken } from "@configs/mail";
import { createTransport, Transporter } from "nodemailer";

/**
 * Base mailer - tương tự ActionMailer trong Rails.
 */
export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

async function getTransporter(): Promise<Transporter> {
  const { access_token } = await getAccessToken();
  return createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: env.emailFrom,
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      refreshToken: env.googleRefreshToken,
      accessToken: access_token as string,
    },
  });
}

export class ApplicationMailer {
  static async deliver(options: MailOptions): Promise<void> {
    const transport = await getTransporter();
    await transport.sendMail({
      ...options,
      from: options.from || env.emailFrom,
    });
  }
}
