import env from "@configs/env";
import { Auth, google } from "googleapis";
import { createTransport, SendMailOptions, Transporter } from "nodemailer";
import { MailerAdapter } from "ts-rails";

/**
 * Helper để lấy OAuth2Client và Access Token từ Google.
 * (Được chuyển từ configs/mail/index.ts)
 */
const getGoogleMailClient = async (): Promise<{
  oAuth2Client: Auth.OAuth2Client;
  accessToken: string;
}> => {
  const oAuth2Client = new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    "https://developers.google.com/oauthplayground",
  );
  oAuth2Client.setCredentials({ refresh_token: env.googleRefreshToken });
  const { token } = await oAuth2Client.getAccessToken();
  return { oAuth2Client, accessToken: token as string };
};

/**
 * GmailOAuth2MailerAdapter - Gửi mail qua Gmail sử dụng OAuth2.
 */
export class GmailOAuth2MailerAdapter implements MailerAdapter {
  private transporter: Transporter | null = null;
  private defaultFromAddress: string;

  constructor() {
    this.defaultFromAddress = env.emailFrom || "";
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    // Nếu chưa có transporter hoặc chưa lấy được email thật từ Google
    if (!this.transporter || !this.defaultFromAddress) {
      await this.initializeTransporter();
    }

    // Framework có thể truyền from là "" do gọi getDefaultFromAddress() lúc chưa init.
    // Ta sẽ ưu tiên lấy email đã discovery được nếu options.from không hợp lệ.
    const fromAddress =
      options.from && options.from !== ""
        ? options.from
        : this.defaultFromAddress;

    await this.transporter!.sendMail({
      ...options,
      from: fromAddress,
    });
  }

  getDefaultFromAddress(): string {
    return this.defaultFromAddress;
  }

  private async initializeTransporter() {
    const { oAuth2Client, accessToken } = await getGoogleMailClient();

    // Nếu emailFrom không được setup trong env, lấy trực tiếp từ Google API qua Refresh Token
    if (!this.defaultFromAddress) {
      const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
      const userInfo = await oauth2.userinfo.get();
      this.defaultFromAddress = userInfo.data.email || "";
    }

    if (!this.defaultFromAddress) {
      throw new Error(
        "GmailOAuth2MailerAdapter: EMAIL_FROM is missing and could not be retrieved from Google API. Please check your Refresh Token.",
      );
    }

    this.transporter = createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: this.defaultFromAddress,
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
        refreshToken: env.googleRefreshToken,
        accessToken: accessToken,
      },
    });
  }
}
