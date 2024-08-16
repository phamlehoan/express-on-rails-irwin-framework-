import { convertFileToBase64 } from "@configs/fileUpload";
import models from "@models";
import { Request, Response } from "express";
import { ApplicationController } from ".";

export class CategoryController extends ApplicationController {
  public async index(req: Request, res: Response) {
    const categories = await models.category.findAll();
    res.render("category.view/index", { categories: categories });
  }

  public async new(req: Request, res: Response) {
    res.render("category.view/new");
  }

  public async create(req: Request, res: Response) {
    const { name, description } = req.body;
    const file = req.file ? convertFileToBase64(req.file) : null;

    const createdCategory = await models.category.create({
      name,
      description,
      image: file,
    });

    req.flash("success", { msg: `Created category ${name}` });
    res.redirect("/categories");
  }

  public async destroy(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      req.flash("errors", { msg: `id is not match` });
      return res.redirect("/categories");
    }

    const existedCategory = await models.category.findById(id);
    if (!existedCategory) {
      req.flash("errors", { msg: `Category ${id} is not found.` });
      return res.redirect("/categories");
    }

    await models.category.destroy({
      where: {
        id,
      },
    });

    res.redirect("/categories");
  }
}
