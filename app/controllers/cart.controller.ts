import models from "@models";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { ApplicationController } from ".";

export class CartController extends ApplicationController {
  public async index(req: Request, res: Response) {
    const userId = req.user.id;
    const carts = await models.cart.findAll({
      where: {
        userId: {
          [Op.eq]: userId,
        },
      },
      include: [{ model: models.product }],
    });

    res.render("cart.view/index", { carts: carts });
  }

  public async create(req: Request, res: Response) {
    const { productId } = req.body;
    const userId = req.user.id;

    await models.cart.create({
      productId,
      userId,
      quantity: 0,
    });

    req.flash("success", { msg: `Created cart` });
    res.redirect("/carts");
  }

  public async updateQuantity(req: Request, res: Response) {
    console.log(req.body);
  }

  public async destroy(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      req.flash("errors", { msg: `id is not match` });
      return res.redirect("/carts");
    }

    const existedCart = await models.cart.findById(id);
    if (!existedCart) {
      req.flash("errors", { msg: `cart ${id} is not found.` });
      return res.redirect("/carts");
    }

    await models.cart.destroy({
      where: {
        id,
      },
    });

    res.redirect("/carts");
  }
}
