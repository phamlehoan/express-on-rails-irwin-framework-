import { RestActions } from "@configs/enum";
import { upload } from "@configs/fileAttachment";
import { DevController } from "@controllers";
import { action } from "@lib/controllerHelpers";
import { Router } from "express";
import { Route } from ".";

export class DevRoute {
  private static path = Router();

  public static draw() {
    Route.resource(this.path, DevController, {
      except: [RestActions.Create],
    });
    this.path.post("/", upload.single("image"), action(DevController, "create"));

    return this.path;
  }
}
