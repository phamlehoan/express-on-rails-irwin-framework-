import dotenv from "dotenv";
dotenv.config();

export default {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  search: process.env.SEARCH,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  emailFrom: process.env.EMAIL_FROM,
};
