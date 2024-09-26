import { RestActions } from "@configs/enum";
import { upload } from "@configs/fileUpload";
import { DevController } from "@controllers";
import { Router } from "express";
import { Route } from ".";

export class DevRoute {
  private static path = Router();
  private static devController = new DevController();

  public static draw() {
    Route.resource(this.path, this.devController, {
      except: [RestActions.Create],
    });
    this.path.post(
      "/",
      upload.single("image"),
      this.devController.create
    );

    return this.path;
  }
}
