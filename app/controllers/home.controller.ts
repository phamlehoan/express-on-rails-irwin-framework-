import models from "@models";
import { Request, Response } from "express";
import { ApplicationController } from ".";

export class HomeController extends ApplicationController {
  public async index(req: Request, res: Response) {
    const users = await models.user.findOne({
      where: {
        id: 1,
      },
      include: [{ model: models.userOrganization }],
    });
    console.log(users);

    res.render("home.view/index", { title: "Irwin Framework" });
  }

  public async show(req: Request, res: Response) {}

  public async new(req: Request, res: Response) {}

  public async create(req: Request, res: Response) {}

  public async edit(req: Request, res: Response) {}

  public async update(req: Request, res: Response) {}

  public async destroy(req: Request, res: Response) {}
}
