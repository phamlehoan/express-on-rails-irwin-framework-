import { Feature } from "@configs/enum";
import { AdminProfileController } from "@controllers";
import { action, RailsRoute } from "@lib";
import { Permission } from "@middlewares";

export class AdminProfileRoute extends RailsRoute {
  public draw() {
    this.get(action(AdminProfileController, "show"), {
      setPermissionForAny: [
        `${Feature.AdministrationManagement}::${Permission.Read}`,
        `${Feature.UserManagement}::${Permission.Read}`,
      ],
    });
    this.put(action(AdminProfileController, "update"), {
      setPermissionForAny: [
        `${Feature.AdministrationManagement}::${Permission.Update}`,
        `${Feature.UserManagement}::${Permission.Update}`,
      ],
    });
  }
}
