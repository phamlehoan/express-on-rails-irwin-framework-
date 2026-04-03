import env from "@configs/env";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import sharp from "sharp";
import { rootPath } from "./path";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// --- Middlewares ---
export const fileUploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter(req, file, cb: FileFilterCallback) {
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.mimetype)) {
      return cb(
        new Error(
          `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        ),
      );
    }
    cb(null, true);
  },
});

// --- Helpers & Adapters ---

export interface StorageAdapter {
  upload(file: Express.Multer.File): Promise<string | null>;
}

/**
 * Lưu file vào thư mục public/uploads của dự án
 */
export class DiskStorageAdapter implements StorageAdapter {
  async upload(file: Express.Multer.File): Promise<string | null> {
    const uploadDir = rootPath("public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}_${path.basename(file.originalname, path.extname(file.originalname))}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    await sharp(file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(filePath);

    return `/uploads/${fileName}`;
  }
}

/**
 * Lưu file lên Cloudinary
 */
export class CloudinaryStorageAdapter implements StorageAdapter {
  constructor() {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
    });
  }

  async upload(file: Express.Multer.File): Promise<string | null> {
    const resizedImage = await sharp(file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "task-activities", resource_type: "image", format: "jpg" },
          (error, result) => {
            if (error || !result)
              return reject(new Error("Cloudinary upload failed"));
            resolve(result.secure_url);
          },
        )
        .end(resizedImage);
    });
  }
}

/**
 * Lưu file lên Supabase Storage
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private supabase = createClient(env.supabaseUrl, env.supabaseKey);

  async upload(
    file: Express.Multer.File,
    bucket: string = "task-attachments",
  ): Promise<string | null> {
    const resizedImage = await sharp(file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const fileName = `${Date.now()}_${path.basename(file.originalname, path.extname(file.originalname))}.jpg`;
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(`tasks/${fileName}`, resizedImage, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    return (
      this.supabase.storage.from(bucket).getPublicUrl(`tasks/${fileName}`).data
        ?.publicUrl || null
    );
  }
}

// --- Lazy Initialization (Giống cơ chế của JWT) ---
let storageAdapterInstance: StorageAdapter;

/**
 * Hàm getter để lấy Adapter tương ứng với cấu hình môi trường.
 * Instance sẽ được tạo duy nhất một lần (Singleton) khi hàm này được gọi lần đầu.
 */
export const getStorageAdapter = (): StorageAdapter => {
  if (!storageAdapterInstance) {
    if (env.storageService === "supabase") {
      storageAdapterInstance = new SupabaseStorageAdapter();
    } else if (env.storageService === "cloudinary") {
      storageAdapterInstance = new CloudinaryStorageAdapter();
    } else {
      storageAdapterInstance = new DiskStorageAdapter();
    }
  }
  return storageAdapterInstance;
};
