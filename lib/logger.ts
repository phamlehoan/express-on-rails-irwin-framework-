/**
 * Logger - tương tự Rails.logger.
 * Dùng Pino cho performance.
 */
import pino from "pino";
import { env } from "process";

export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});
