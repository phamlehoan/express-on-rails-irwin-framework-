/**
 * Mail config - OAuth token cho Gmail.
 * Logic gửi email nằm trong app/mailers/ (ApplicationMailer).
 */
import env from "@configs/env";
import { Auth, google } from "googleapis";

export const getMailClient = async (): Promise<{
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
  return {
    oAuth2Client,
    accessToken: token as string,
  };
};
