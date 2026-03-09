/**
 * Mail config - OAuth token cho Gmail.
 * Logic gửi email nằm trong app/mailers/ (ApplicationMailer).
 */
import env from "@configs/env";
import { Auth, google } from "googleapis";

export const getAccessToken = async (): Promise<Auth.Credentials> => {
  const oAuth2Client = new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    "https://developers.google.com/oauthplayground"
  );

  oAuth2Client.setCredentials({ refresh_token: env.googleRefreshToken });

  const { token } = await oAuth2Client.getAccessToken();
  return { access_token: token } as Auth.Credentials;
};
