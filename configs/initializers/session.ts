import env from "@configs/env";
import { RequestHandler } from "express";
import session from "express-session";
import { RailsApplication } from "ts-rails";

/**
 * Khởi tạo Session Middleware
 */
export function initializeSession(): RequestHandler {
  const sessionMiddleware = session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.nodeEnv === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 3, // 3 hours
    },
  });

  // Lưu lại để Socket.IO có thể dùng chung
  RailsApplication.sessionMiddleware = sessionMiddleware;
  return sessionMiddleware;
}
