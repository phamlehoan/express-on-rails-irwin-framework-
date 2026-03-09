/**
 * Custom HTTP Errors - tương tự Rails ActionController exceptions.
 * Dùng với next(error) để global error handler xử lý.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 - Bad Request: Dữ liệu không hợp lệ */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request") {
    super(message, 400);
  }
}

/** 401 - Unauthorized: Chưa đăng nhập */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

/** 403 - Forbidden: Không có quyền truy cập */
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

/** 404 - Not Found: Tài nguyên không tồn tại */
export class NotFoundError extends AppError {
  constructor(message: string = "Not Found") {
    super(message, 404);
  }
}

/** 422 - Unprocessable Entity: Validation failed */
export class UnprocessableEntityError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(
    message: string = "Unprocessable Entity",
    errors?: Record<string, string[]>
  ) {
    super(message, 422);
    this.errors = errors;
  }
}
