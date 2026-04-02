import env from "@configs/env";
import { getMailClient } from "@configs/mail";
import { RailsMailer } from "@lib";
import { google } from "googleapis";
import { createTransport, Transporter } from "nodemailer";

/**
 * ApplicationMailer - Kết nối RailsMailer với dịch vụ Google OAuth2.
 */
export class ApplicationMailer extends RailsMailer {
  protected static async getTransporter(): Promise<{
    transporter: Transporter;
    from: string;
  }> {
    const { oAuth2Client, accessToken } = await getMailClient();

    // Gọi API sang Google để lấy email chính xác của account đang sử dụng
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) {
      throw new Error("Could not retrieve sender email from Google API");
    }

    const transporter = createTransport({
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

    return { transporter, from: email };
  }
}
