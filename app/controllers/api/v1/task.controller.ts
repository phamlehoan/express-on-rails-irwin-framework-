import { upload, uploadToSupabase } from "@configs/fileAttachment";
import models from "@models";
import { Prisma } from "@prisma/client";
import { Request, RequestHandler, Response } from "express";
import { ApiV1Controller } from ".";

export class TaskController extends ApiV1Controller {
  public static uploadMiddleware: RequestHandler = upload.array(
    "attachments",
    5
  );

  public async index(req: Request, res: Response) {
    const userId = req.user!.id;
    const isManager = req.user!.roles.some(
      (role: any) => role.code === "MANAGER"
    );

    let where: Prisma.TaskWhereInput = {};

    if (!isManager) {
      where = {
        OR: [
          { assignments: { some: { userId } } },
          { assignments: { none: {} } },
        ],
      };
    }

    const tasks = await models.task.findMany({
      where,
      include: {
        type: true,
        createdBy: true,
        assignments: { include: { user: true } },
        checklists: true,
        attachments: true,
        activities: { include: { user: true } },
        products: true,
      },
    });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  }

  public async show(req: Request, res: Response) {
    const { id } = req.params;
    const task = await models.task.findUnique({
      where: { id },
      include: {
        type: true,
        createdBy: true,
        assignments: { include: { user: true } },
        checklists: true,
        attachments: true,
        activities: { include: { user: true } },
        products: true,
      },
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  }

  public async create(req: Request, res: Response) {
    const {
      title,
      description,
      typeId,
      status,
      dueDate,
      assignments,
      checklists,
      productCodes,
    } = req.body;
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    // Upload attachments to Supabase
    const attachmentUrls = files
      ? await Promise.all(files.map((file) => uploadToSupabase(file)))
      : [];

    // Xử lý sản phẩm
    const products = productCodes
      ? await Promise.all(
          productCodes.map(async (code: string) => {
            let product = await models.product.findFirst({ where: { code } });
            if (!product) {
              product = await models.product.create({
                data: { code, taskId: "" },
              });
            }
            return { id: product.id };
          })
        )
      : [];

    const task = await models.task.create({
      data: {
        title,
        description,
        type: {
          connect: {
            id: typeId,
          },
        },
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: userId,
        assignments: {
          create: assignments?.map((userId: string) => ({
            userId,
            assignedAt: new Date(),
          })),
        },
        checklists: {
          create: checklists?.map((checklist: any) => ({
            title: checklist.title,
            isCompleted: checklist.isCompleted || false,
          })),
        },
        products: {
          connect: products,
        },
        attachments: {
          create: attachmentUrls.map((url: string) => ({
            url,
          })),
        },
      },
      include: {
        type: true,
        createdBy: true,
        assignments: { include: { user: true } },
        checklists: true,
        attachments: true,
        activities: true,
        products: true,
      },
    });

    // Cập nhật taskId cho products
    await Promise.all(
      products.map((product) =>
        models.product.update({
          where: { id: product.id },
          data: { taskId: task.id },
        })
      )
    );

    res.status(201).json({
      success: true,
      data: task,
    });
  }

  public async update(req: Request, res: Response) {
    const { id } = req.params;
    const {
      title,
      description,
      typeId,
      status,
      dueDate,
      assignments,
      checklists,
      productCodes,
    } = req.body;
    const files = req.files as Express.Multer.File[];

    // Upload attachments to Supabase
    const attachmentUrls = files
      ? await Promise.all(files.map((file) => uploadToSupabase(file)))
      : [];

    // Xử lý sản phẩm
    const products = productCodes
      ? await Promise.all(
          productCodes.map(async (code: string) => {
            let product = await models.product.findFirst({ where: { code } });
            if (!product) {
              product = await models.product.create({
                data: { code, taskId: id },
              });
            }
            return { id: product.id };
          })
        )
      : [];

    const task = await models.task.update({
      where: { id },
      data: {
        title,
        description,
        typeId,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignments: {
          deleteMany: {},
          create: assignments?.map((userId: string) => ({
            userId,
            assignedAt: new Date(),
          })),
        },
        checklists: {
          deleteMany: {},
          create: checklists?.map((checklist: any) => ({
            title: checklist.title,
            isCompleted: checklist.isCompleted || false,
          })),
        },
        products: {
          set: products,
        },
        attachments: {
          deleteMany: {},
          create: attachmentUrls.map((url: string) => ({
            url,
          })),
        },
      },
      include: {
        type: true,
        createdBy: true,
        assignments: { include: { user: true } },
        checklists: true,
        attachments: true,
        activities: true,
        products: true,
      },
    });

    // Cập nhật taskId cho products
    await Promise.all(
      products.map((product) =>
        models.product.update({
          where: { id: product.id },
          data: { taskId: id },
        })
      )
    );

    res.status(200).json({
      success: true,
      data: task,
    });
  }

  public async destroy(req: Request, res: Response) {
    const { id } = req.params;
    await models.task.delete({ where: { id } });
    res.status(204).json({ success: true });
  }

  public async assign(req: Request, res: Response) {
    const { id } = req.params;
    const { userIds } = req.body;

    const task = await models.task.findUnique({ where: { id } });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    await models.task.update({
      where: { id },
      data: {
        assignments: {
          create: userIds.map((userId: string) => ({
            userId,
            assignedAt: new Date(),
          })),
        },
      },
      include: {
        assignments: { include: { user: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: { message: "Members assigned successfully" },
    });
  }
}
