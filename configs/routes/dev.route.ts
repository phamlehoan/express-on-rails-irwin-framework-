import { DevController } from "@controllers";
import { fileUploader } from "@lib";
import { action, RailsRoute, RestActions } from "ts-rails";

export class DevRoute extends RailsRoute {
  public draw() {
    this.resource(DevController, {
      only: [RestActions.Index],
    });
    this.post([fileUploader.single("image"), action(DevController, "create")]);
  }
}
