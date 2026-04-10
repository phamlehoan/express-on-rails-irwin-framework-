import { ProfileController } from "@controllers";
import { action, RailsRoute } from "ts-rails";

export class ProfileRoute extends RailsRoute {
  public draw() {
    this.get("/", action(ProfileController, "show"));
    this.put("/", action(ProfileController, "update"));
  }
}
