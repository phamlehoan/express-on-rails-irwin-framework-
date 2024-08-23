import sequelize from "@configs/database";
import models from "@models";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { ApplicationController } from ".";
import { OrderInstance, OrderStatus } from "../models/order";
import { ProductInstance } from "../models/product";

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

  public async saveOrOrder(req: Request, res: Response) {
    const { type, selected, address, phoneNumber, receiverName, ...restBody } =
      req.body;
    const t = await sequelize.transaction();

    try {
      await models.cart.destroy({
        where: {
          userId: req.user.id,
        },
      });

      const bodyToCreate = Object.keys(restBody).map((productId) => {
        if (type !== "Order" || !selected.includes(productId))
          return {
            userId: req.user.id,
            productId: +productId,
            quantity: +restBody[productId],
          };
      });

      if (type === "Order") {
        const products = (await models.product.findAll({
          where: {
            id: selected.map(Number),
          },
        })) as ProductInstance[];

        const pricesByProductId: {
          [key: number]: number;
        } = {};
        products.forEach((product) => {
          pricesByProductId[product.id] = product.price;
        });

        const order = (await models.order.create({
          userId: req.user.id,
          address,
          phoneNumber,
          receiverName,
          status: OrderStatus.PENDING,
        })) as OrderInstance;

        await models.productOrder.bulkCreate(
          selected.map((productId: string) => ({
            productId: +productId,
            orderId: order.id,
            quantity: pricesByProductId[+productId] ? +restBody[productId] : 0,
            currentPrice: pricesByProductId[+productId] || 0,
          }))
        );
      }

      await models.cart.bulkCreate(bodyToCreate);

      // TODO: Gửi email cho user đang đăng nhập sau khi order

      t.commit();
      req.flash("success", { msg: `Updated!` });
      res.redirect("/carts");
    } catch (e) {
      t.rollback();
      req.flash("errors", { msg: `Action to database failed. Message: ${e}` });
      res.redirect("/carts");
    }
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
