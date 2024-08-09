import { convertFileToBase64 } from "@configs/fileUpload";
import models from "@models";
import { Request, Response } from "express";
import { ApplicationController } from ".";
import { CategoryInstance } from "../models/category";
import { UserInstance } from "../models/user";

export class DevController extends ApplicationController {
  public async index(req: Request, res: Response) {
    console.log(req.session);
    res.render("home.view/index", { title: "Irwin Framework" });
  }

  public async show(req: Request, res: Response) {
    if (isNaN(+req.params.id)) {
      req.flash("errors", { msg: `${req.params.id} is not a user id.` });
      return res.redirect("/");
    }

    const user = (await models.user.findOne({
      where: {
        id: +req.params.id,
      },
      include: [
        { model: models.product, as: "cartProducts" },
        { model: models.order },
      ],
    })) as UserInstance;

    if (user) {
      req.session.userId = user.id;
      req.flash("success", { msg: `Get user: ${user.name}.` });
    } else {
      req.flash("errors", {
        msg: `User with id: ${req.params.id} does not found.`,
      });
    }

    res.redirect("/");
  }

  public async new(req: Request, res: Response) {
    res.render("dev.view/new");
  }

  public async create(req: Request, res: Response) {
    const file = req.file ? convertFileToBase64(req.file) : null;
    await models.category.create({
      name: req.body.name,
      description: req.body.description,
      image: file,
    });

    res.redirect("/");
  }

  public async edit(req: Request, res: Response) {
    const category = (await models.category.findOne({
      where: {
        id: +req.params.id,
      },
    })) as CategoryInstance;

    res.render("dev.view/edit", { category: category });
  }

  public async update(req: Request, res: Response) {}

  public async destroy(req: Request, res: Response) {}
}
