/**
 * File upload config - tương tự Rails config cho ActiveStorage/Paperclip.
 * Các hằng số cấu hình nằm trong configs.
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
