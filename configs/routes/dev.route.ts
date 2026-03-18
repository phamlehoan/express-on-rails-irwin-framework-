import { upload } from "@configs/fileAttachment";
import { DevController } from "@controllers";
import { action, RailsRoute, RestActions } from "@lib";

export class DevRoute extends RailsRoute {
  public draw() {
    this.resource(DevController, {
      except: [RestActions.Create],
    });
    this.post([upload.single("image"), action(DevController, "create")]);
  }
}
