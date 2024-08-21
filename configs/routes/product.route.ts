import { ProductController } from "@controllers";
import { Router } from "express";
import { Route } from ".";
import { RestActions } from "../enum";
import { upload } from "../fileUpload";

export class ProductRoute {
  private static path = Router();
  private static productController = new ProductController();

  public static draw() {
    this.path.post(
      "/",
      upload.single("productImage"),
      this.productController.create
    );
    Route.resource(this.path, this.productController, {
      except: [RestActions.Create],
    });

    return this.path;
  }
}
