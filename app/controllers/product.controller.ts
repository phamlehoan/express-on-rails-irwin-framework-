import { convertFileToBase64 } from "@configs/fileUpload";
import models from "@models";
import { Request, Response } from "express";
import { ApplicationController } from ".";

export class ProductController extends ApplicationController {
  public async index(req: Request, res: Response) {
    const products = await models.product.findAll();
    res.render("product.view/index", { products: products });
  }

  public async show(req: Request, res: Response) {}

  public async new(req: Request, res: Response) {
    res.render("product.view/new");
  }

  public async create(req: Request, res: Response) {
    const { name, description, price, categoryId } = req.body;
    const file = req.file ? convertFileToBase64(req.file) : null;

    await models.product.create({
      name,
      description,
      price,
      categoryId,
      image: file,
    });

    req.flash("success", { msg: `Created product ${name}` });
    res.redirect("/products");
  }

  public async edit(req: Request, res: Response) {}

  public async update(req: Request, res: Response) {}

  public async destroy(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      req.flash("errors", { msg: `id is not match` });
      return res.redirect("/products");
    }

    const existedproduct = await models.product.findById(id);
    if (!existedproduct) {
      req.flash("errors", { msg: `product ${id} is not found.` });
      return res.redirect("/products");
    }

    await models.product.destroy({
      where: {
        id,
      },
    });

    res.redirect("/products");
  }
}
