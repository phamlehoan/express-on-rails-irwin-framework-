import models from "@models";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ApiV1Controller } from ".";

export class ReportController extends ApiV1Controller {
  public async generate(req: Request, res: Response) {
    const { startDate, endDate } = req.query;

    const where: Prisma.TaskWhereInput = {
      updatedAt: {
        gte: startDate ? new Date(startDate as string) : undefined,
        lte: endDate ? new Date(endDate as string) : undefined,
      },
      status: "HOAN_THANH",
    };

    // Đếm số task hoàn thành
    const completedTasksCount = await models.task.count({ where });

    // Thống kê task theo nhân viên
    const userTasks = await models.user.findMany({
      include: {
        tasksAssigned: {
          where,
          include: {
            task: true,
          },
        },
      },
    });

    // Tính năng suất
    const productivity = {};

    res.status(200).json({
      success: true,
      data: {
        completedTasksCount,
        userProductivity: productivity,
        period: { startDate, endDate },
      },
    });
  }
}
