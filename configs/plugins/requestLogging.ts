import { NextFunction, Request, Response } from "express";
import { logger } from "ts-rails";

/**
 * Request logging - tương tự Rails request logging.
 */
export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const requestId = req.requestId;
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
    });
  });
  next();
}
