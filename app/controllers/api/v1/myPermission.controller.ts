import models from "@models";
import { Request, Response } from "express";
import { ApiV1Controller } from ".";

export class MyPermissionController extends ApiV1Controller {
  public async index(req: Request, res: Response) {
    const myPermissions = await models.permission.findMany({
      where: {
        users: {
          some: {
            userId: req.user!.id,
          },
        },
      },
    });
    res
      .status(403)
      .json({
        success: true,
        data: myPermissions.map((permission) => permission.code),
      });
  }
}
