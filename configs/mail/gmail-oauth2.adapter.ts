import env from "@configs/env";
import { Auth, google } from "googleapis";
import { createTransport, SendMailOptions, Transporter } from "nodemailer";
import { MailerAdapter } from "ts-rails";

/** Phải trùng client khi tạo GOOGLE_REFRESH_TOKEN (OAuth Playground mặc định). */
const gmailOAuthRedirectUri =
  process.env.GMAIL_OAUTH_REDIRECT_URI ||
  "https://developers.google.com/oauthplayground";

function createMailOAuth2Client(): Auth.OAuth2Client {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    gmailOAuthRedirectUri,
  );
}

/**
 * Gmail SMTP + XOAUTH2.
 * Email hộp thư lấy từ Gmail API `users.getProfile` (chỉ cần scope mail, vd https://mail.google.com/).
 * Không dùng `oauth2.userinfo` — token chỉ có Gmail sẽ báo "missing required authentication credential".
 */
export class GmailOAuth2MailerAdapter implements MailerAdapter {
  private transporter: Transporter | null = null;
  private defaultFromAddress: string;
  private mailboxEmail: string;

  constructor() {
    this.defaultFromAddress = "";
    this.mailboxEmail = "";
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      await this.initializeTransporter();
    }

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
    const oAuth2Client = createMailOAuth2Client();
    oAuth2Client.setCredentials({ refresh_token: env.googleRefreshToken });

    const { token: probe } = await oAuth2Client.getAccessToken();
    if (!probe || typeof probe !== "string") {
      throw new Error(
        "Gmail OAuth2: could not obtain access token. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN.",
      );
    }

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const mailbox = (profile.data.emailAddress || "").trim();
    if (!mailbox) {
      throw new Error(
        "GmailOAuth2MailerAdapter: Gmail profile has no emailAddress. Enable Gmail API and use a refresh token with mail scope (e.g. https://mail.google.com/).",
      );
    }
    this.mailboxEmail = mailbox;

    const fromEnv = (env.emailFrom || "").trim();
    const sameMailbox =
      fromEnv.length > 0 && fromEnv.toLowerCase() === mailbox.toLowerCase();
    this.defaultFromAddress = sameMailbox ? fromEnv : mailbox;

    this.transporter = createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        type: "OAuth2",
        user: this.mailboxEmail,
        provisionCallback: (_user, _renew, callback) => {
          const cb = callback as (
            err: Error | null,
            accessToken?: string,
            expires?: number,
          ) => void;
          const c = createMailOAuth2Client();
          c.setCredentials({ refresh_token: env.googleRefreshToken });
          void c
            .getAccessToken()
            .then(({ token }) => {
              if (!token || typeof token !== "string") {
                cb(
                  new Error(
                    "Gmail provisionCallback: empty access token. Check refresh token and Gmail scopes.",
                  ),
                );
                return;
              }
              cb(null, token, 3600);
            })
            .catch((err: unknown) => {
              cb(err instanceof Error ? err : new Error(String(err)));
            });
        },
      },
    });
  }
}
