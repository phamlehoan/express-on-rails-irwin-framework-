import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@configs/fileUpload";
import { BadRequestError } from "./errors";

export interface FileUploadOptions {
  allowedMimeTypes?: string[];
  maxSize?: number;
}

/**
 * Validate uploaded file - throw BadRequestError nếu không hợp lệ.
 */
export function validateFileUpload(
  file: Express.Multer.File | undefined,
  options: FileUploadOptions = {}
): void {
  if (!file) {
    throw new BadRequestError("No file uploaded");
  }

  const allowedTypes = options.allowedMimeTypes ?? [...ALLOWED_IMAGE_TYPES];
  const maxSize = options.maxSize ?? MAX_FILE_SIZE;

  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestError(
      `Invalid file type. Allowed: ${allowedTypes.join(", ")}`
    );
  }

  if (file.size > maxSize) {
    throw new BadRequestError(
      `File too large. Max size: ${Math.round(maxSize / 1024)}KB`
    );
  }
}
