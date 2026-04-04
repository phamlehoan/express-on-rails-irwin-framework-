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
  private defaultFromAddress: string | null = null;

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.transporter || !this.defaultFromAddress) {
      await this.initializeTransporter();
    }
    await this.transporter!.sendMail(options);
  }

  getDefaultFromAddress(): string {
    if (!this.defaultFromAddress) {
      throw new Error(
        "GmailOAuth2MailerAdapter not initialized. Call sendMail first.",
      );
    }
    return this.defaultFromAddress;
  }

  private async initializeTransporter() {
    const { oAuth2Client, accessToken } = await getGoogleMailClient();
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email)
      throw new Error("Could not retrieve sender email from Google API");

    this.transporter = createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: email,
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
        refreshToken: env.googleRefreshToken,
        accessToken: accessToken,
      },
    });
    this.defaultFromAddress = email;
  }
}
