import { CartController } from "@controllers";
import { Router } from "express";
import { Route } from ".";
import { RestActions } from "../enum";

export class CartRoute {
  private static path = Router();
  private static cartController = new CartController();

  public static draw() {
    this.path.use(this.cartController.validateUserLogin);
    this.path
      .route("/updateQuantity")
      .patch(this.cartController.updateQuantity);
    Route.resource(this.path, this.cartController, {
      only: [RestActions.Index, RestActions.Create, RestActions.Destroy],
    });

    return this.path;
  }
}
