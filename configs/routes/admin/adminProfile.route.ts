import { Feature } from "@configs/enum";
import { AdminProfileController } from "@controllers";
import { Permission } from "@middlewares";
import { action, RailsRoute } from "ts-rails";

export class AdminProfileRoute extends RailsRoute {
  public draw() {
    this.get(action(AdminProfileController, "show"), {
      setPermissionFor: `${Feature.UserManagement}::${Permission.Read}`,
    });
    this.put(action(AdminProfileController, "update"), {
      setPermissionFor: `${Feature.UserManagement}::${Permission.Update}`,
    });
  }
}
