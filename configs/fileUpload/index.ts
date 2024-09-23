import { Request } from "express";
import { readFileSync, unlinkSync } from "fs";
import multer, { FileFilterCallback } from "multer";
import path from "path";

export const uploadToFolder = multer({
  storage: multer.diskStorage({
    destination: "uploads",
    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void
    ): void => {
      cb(null, new Date().valueOf() + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10000000000, files: 1 },
  fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload a valid image file"));
    }
    cb(null, true);
  },
});

export const upload = multer({ dest: "uploads" });

export const convertFileToBase64 = (
  file: Express.Multer.File,
  isDelete: boolean = true
) => {
  const fileReaded = readFileSync(file.path);
  const encodeFile = fileReaded.toString("base64");

  if (isDelete) unlinkSync(file.path);

  return Buffer.from(encodeFile, "base64");
};
