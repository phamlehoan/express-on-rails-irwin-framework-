import env from "@configs/env";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import sharp from "sharp";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "./constants";

const getSupabase = () => {
  if (!env.supabaseUrl || !env.supabaseKey) {
    return null;
  }
  return createClient(env.supabaseUrl, env.supabaseKey);
};

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.mimetype)) {
      return cb(
        new Error(
          `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        ),
      );
    }
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(new Error("Please upload a valid image file (jpg, jpeg, png)"));
    }
    cb(null, true);
  },
});

export const uploadToSupabase = async (
  file: Express.Multer.File,
  bucket: string = "task-attachments",
): Promise<string | null> => {
  try {
    const supabase = getSupabase();

    if (!supabase) {
      console.warn("⚠️ Supabase config missing, skipping upload.");
      return null;
    }

    const resizedImage = await sharp(file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const fileName = `${Date.now()}_${path.basename(
      file.originalname,
      path.extname(file.originalname),
    )}.jpg`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`tasks/${fileName}`, resizedImage, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`tasks/${fileName}`);

    return publicUrlData?.publicUrl || null;
  } catch (error) {
    console.error(`Supabase upload error: ${(error as Error).message}`);
    return null;
  }
};

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = "task-activities",
): Promise<string> => {
  try {
    const resizedImage = await sharp(file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const result = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "image",
            format: "jpg",
          },
          (error, result) => {
            if (error || !result) {
              return reject(new Error("Cloudinary upload failed"));
            }
            resolve(result.secure_url);
          },
        )
        .end(resizedImage);
    });

    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload error: ${(error as Error).message}`);
  }
};
