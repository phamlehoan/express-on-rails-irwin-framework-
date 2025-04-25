import { upload, uploadToCloudinary } from "@configs/fileAttachment";
import models from "@models";
import { Request, RequestHandler, Response } from "express";
import { ApiV1Controller } from ".";

export class TaskActivityController extends ApiV1Controller {
  public static uploadMiddleware: RequestHandler = upload.array("images", 5);

  public async create(req: Request, res: Response) {
    const { taskId, status, score } = req.body;
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];
    const isManager = req.user!.roles.some(
      (role: any) => role.code === "MANAGER"
    );

    // Kiểm tra bắt buộc đính kèm hình ảnh khi chuyển sang Nghiệm thu
    if (status === "NGHIEM_THU" && (!files || files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Image attachment is required for Nghiệm thu status",
      });
    }

    // Kiểm tra chấm điểm khi chuyển sang Hoàn thành (chỉ Manager)
    if (status === "HOAN_THANH") {
      if (!isManager) {
        return res.status(403).json({
          success: false,
          message: "Only Manager can set task to Hoàn thành",
        });
      }
      if (!score || score < 0 || score > 10) {
        return res.status(400).json({
          success: false,
          message: "Score must be between 0 and 10 for Hoàn thành status",
        });
      }
    }

    // Upload images to Cloudinary
    const imageUrls = files
      ? await Promise.all(files.map((file) => uploadToCloudinary(file)))
      : [];

    // Tạo activity
    const activity = await models.taskActivity.create({
      data: {
        taskId,
        userId,
        status,
        imageUrl: imageUrls[0] || null,
        score: status === "HOAN_THANH" ? parseFloat(score) : null,
      },
      include: {
        task: true,
        user: true,
      },
    });

    // Cập nhật status của task
    await models.task.update({
      where: { id: taskId },
      data: { status },
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  }
}
