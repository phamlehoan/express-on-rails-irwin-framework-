import env from "@configs/env";
import { NextFunction, Request, Response } from "express";

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

/**
 * Rate limiter - Rails/Rack-Attack style.
 * - Development: không throttle (Rails mặc định dùng null_store cache, throttle không hoạt động).
 * - Production: 300 req / 5 phút (60 req/phút) - tương tự rack-attack throttle('req/ip', limit: 300, period: 5.minutes).
 */
export function rateLimitMiddleware(options?: {
  windowMs?: number;
  max?: number;
}) {
  const isDev = env.nodeEnv === "development";
  const windowMs = options?.windowMs ?? 5 * 60 * 1000; // 5 phút
  const max = options?.max ?? 300;

  return (req: Request, res: Response, next: NextFunction) => {
    if (isDev) return next();

    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    if (!store[key] || now > store[key].resetAt) {
      store[key] = { count: 1, resetAt: now + windowMs };
    } else {
      store[key].count++;
    }

    if (store[key].count > max) {
      res.setHeader(
        "Retry-After",
        Math.ceil((store[key].resetAt - now) / 1000),
      );
      return res.status(429).json({
        success: false,
        error: "Too many requests, please try again later.",
      });
    }

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(Math.max(0, max - store[key].count)),
    );
    next();
  };
}
