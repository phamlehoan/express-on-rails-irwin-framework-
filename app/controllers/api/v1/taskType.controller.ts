import models from "@models";
import { Request, Response } from "express";
import { ApiV1Controller } from ".";

export class TaskTypeController extends ApiV1Controller {
  public async index(req: Request, res: Response) {
    const taskTypes = await models.taskType.findMany();

    res.status(200).json({
      success: true,
      data: taskTypes,
    });
  }

  public async create(req: Request, res: Response) {
    const { name } = req.body;
    const userId = req.user!.id;

    const taskType = await models.taskType.create({
      data: {
        name,
        createdBy: userId,
      },
    });

    res.status(201).json({
      success: true,
      data: taskType,
    });
  }

  public async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name } = req.body;

    const taskType = await models.taskType.update({
      where: { id },
      data: { name },
    });

    res.status(200).json({
      success: true,
      data: taskType,
    });
  }

  public async destroy(req: Request, res: Response) {
    const { id } = req.params;
    await models.taskType.delete({ where: { id } });
    res.status(204).json({ success: true });
  }
}
