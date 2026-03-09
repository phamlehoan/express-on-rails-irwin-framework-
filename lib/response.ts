import { Response } from "express";

/**
 * Response helpers - chuẩn hóa format JSON cho API.
 * Tương tự respond_to trong Rails.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
}

export class ApiResponse {
  /**
   * Trả về success với data
   * @example res.json(ApiResponse.ok(user))
   */
  static ok<T>(data: T, message?: string): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      ...(message && { message }),
    };
  }

  /**
   * Trả về success với message (không có data)
   */
  static success(message: string = "Success"): ApiSuccessResponse<null> {
    return {
      success: true,
      data: null,
      message,
    };
  }

  /**
   * Trả về error
   */
  static error(
    message: string,
    errors?: Record<string, string[]>
  ): ApiErrorResponse {
    return {
      success: false,
      error: message,
      ...(errors && { errors }),
    };
  }

  /**
   * Gửi JSON response thành công
   */
  static sendOk<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json(ApiResponse.ok(data));
  }

  /**
   * Gửi JSON response lỗi
   */
  static sendError(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: Record<string, string[]>
  ): void {
    res.status(statusCode).json(ApiResponse.error(message, errors));
  }
}
