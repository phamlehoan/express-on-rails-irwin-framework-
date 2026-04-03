import dotenv from "dotenv";
dotenv.config();

export default {
  search: process.env.SEARCH,
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || "3000",
  databaseUrl: process.env.DATABASE_URL || "file:./schema/app.db",
  dbMaxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "1"),
  sessionSecret: process.env.SESSION_SECRET || "your-session-secret",
  jwtSecret: process.env.JWT_SECRET || "your-jwt-secret",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/auth/google/callback",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_KEY || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
  emailFrom: process.env.EMAIL_FROM || "",
  mailService: process.env.MAIL_SERVICE || "gmail", // gmail, smtp, sendgrid...
  mailHost: process.env.MAIL_HOST || "smtp.gmail.com",
  mailPort: parseInt(process.env.MAIL_PORT || "587"),
  mailUser: process.env.MAIL_USER || "",
  mailPass: process.env.MAIL_PASS || "",
  redisHost: process.env.REDIS_HOST || "127.0.0.1",
  redisPort: parseInt(process.env.REDIS_PORT || "6379"),
};
