import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

/**
 * Gán X-Request-ID cho mỗi request - dùng để trace logs.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = (req.headers["x-request-id"] as string) || randomUUID();
  (req as Request & { requestId: string }).requestId = id;
  res.setHeader("X-Request-ID", id);
  next();
}
