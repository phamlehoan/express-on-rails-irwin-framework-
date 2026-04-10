import { ApiResponse, AppError } from "ts-rails";
import type { ApplicationController } from "../application.controller";

/**
 * Rescuable concern - tương tự Rails rescue_from.
 * Cho phép controller định nghĩa error handlers.
 */
export const Rescuable = {
  /**
   * Xử lý lỗi AppError một cách thống nhất cho cả Web và API
   */
  rescueAppError(this: ApplicationController, err: unknown): boolean {
    if (err instanceof AppError) {
      const isApi = this.req.originalUrl?.includes("/api");
      if (isApi) {
        this.res
          .status(err.statusCode)
          .json(ApiResponse.error(err.message, (err as any).errors));
        return true;
      }

      this.res.status(err.statusCode).render("error", {
        message: err.message,
      });
      return true;
    }
    return false;
  },
};
