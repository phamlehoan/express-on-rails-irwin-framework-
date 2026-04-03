import { BadRequestError } from "./errors";

const DEFAULT_ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileUploadOptions {
  allowedMimeTypes?: string[];
  maxSize?: number;
}

/**
 * Validate uploaded file - throw BadRequestError nếu không hợp lệ.
 */
export function validateFileUpload(
  file: Express.Multer.File | undefined,
  options: FileUploadOptions = {},
): void {
  if (!file) {
    throw new BadRequestError("No file uploaded");
  }

  const allowedTypes = options.allowedMimeTypes ?? DEFAULT_ALLOWED_TYPES;
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;

  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestError(
      `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
    );
  }

  if (file.size > maxSize) {
    throw new BadRequestError(
      `File too large. Max size: ${Math.round(maxSize / 1024)}KB`,
    );
  }
}
