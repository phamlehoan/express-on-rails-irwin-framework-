import env from "@configs/env";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import sharp from "sharp";

// Cấu hình Supabase client
const supabase = createClient(env.supabaseUrl, env.supabaseKey);

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

// Cấu hình multer để xử lý file upload
export const upload = multer({
  storage: multer.memoryStorage(), // Lưu file vào bộ nhớ thay vì đĩa
  limits: { fileSize: 10000000, files: 5 }, // Giới hạn 10MB, tối đa 5 file
  fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload a valid image file (jpg, jpeg, png)"));
    }
    cb(null, true);
  },
});

// Hàm upload file lên Supabase
export const uploadToSupabase = async (
  file: Express.Multer.File,
  bucket: string = "task-attachments"
): Promise<string> => {
  try {
    // Resize hình ảnh để đảm bảo kích thước tối đa 1MB
    const resizedImage = await sharp(file.buffer)
      .resize({ width: 1024, withoutEnlargement: true }) // Resize chiều rộng tối đa 1024px
      .jpeg({ quality: 80 }) // Giảm chất lượng để tối ưu kích thước
      .toBuffer();

    // Tạo tên file duy nhất
    const fileName = `${Date.now()}_${path.basename(
      file.originalname,
      path.extname(file.originalname)
    )}.jpg`;

    // Upload file lên Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`tasks/${fileName}`, resizedImage, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Lấy public URL của file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`tasks/${fileName}`);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to retrieve public URL from Supabase");
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    throw new Error(`Supabase upload error: ${(error as Error).message}`);
  }
};

// Hàm upload file lên Cloudinary
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = "task-activities"
): Promise<string> => {
  try {
    // Resize hình ảnh để đảm bảo kích thước tối đa 1MB
    const resizedImage = await sharp(file.buffer)
      .resize({ width: 1024, withoutEnlargement: true }) // Resize chiều rộng tối đa 1024px
      .jpeg({ quality: 80 }) // Giảm chất lượng để tối ưu kích thước
      .toBuffer();

    // Upload file lên Cloudinary
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
          }
        )
        .end(resizedImage);
    });

    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload error: ${(error as Error).message}`);
  }
};
