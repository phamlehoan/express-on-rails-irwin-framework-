import { Request, Response, NextFunction } from "express";
import { AppError } from "@lib/errors";
import { ApiResponse } from "@lib/response";

/**
 * Rescuable concern - tương tự Rails rescue_from.
 * Cho phép controller định nghĩa error handlers.
 */
export type ErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export function rescueFrom(
  handler: ErrorHandler
): (err: Error, req: Request, res: Response, next: NextFunction) => void {
  return (err, req, res, next) => {
    Promise.resolve(handler(err, req, res, next)).catch(next);
  };
}

export function handleAppError(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const isApi = req.originalUrl?.includes("/api");
    if (isApi) {
      res
        .status(err.statusCode)
        .json(ApiResponse.error(err.message, (err as any).errors));
    } else {
      res.status(err.statusCode).render("error", {
        message: err.message,
      });
    }
    return;
  }
  _next(err);
}
