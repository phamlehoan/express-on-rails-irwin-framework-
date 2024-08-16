import { CategoryController } from "@controllers";
import { Router } from "express";
import { Route } from ".";
import { RestActions } from "../enum";
import { upload } from "../fileUpload";

export class CategoryRoute {
  private static path = Router();
  private static categoryController = new CategoryController();

  public static draw() {
    this.path.post(
      "/",
      upload.single("categoryImage"),
      this.categoryController.create
    );
    Route.resource(this.path, this.categoryController, {
      only: [RestActions.Index, RestActions.New, RestActions.Destroy],
    });

    return this.path;
  }
}
