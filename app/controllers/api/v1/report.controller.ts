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
    const productivity = await Promise.all(
      userTasks.map(async (user) => {
        const tasks = user.tasksAssigned.map((assignment) => assignment.task);
        const scores = await models.taskActivity.findMany({
          where: {
            taskId: { in: tasks.map((task) => task.id) },
            status: "HOAN_THANH",
          },
          select: { score: true },
        });

        const averageScore =
          scores.length > 0
            ? scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length
            : 0;

        return {
          userId: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          taskCount: tasks.length,
          tasks: tasks.map((task) => ({
            id: task.id,
            title: task.title,
          })),
          averageProductivity: averageScore,
        };
      })
    );

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
