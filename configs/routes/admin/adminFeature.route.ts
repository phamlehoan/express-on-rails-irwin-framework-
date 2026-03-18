import { Feature } from "@configs/enum";
import { AdminFeatureController } from "@controllers";
import { action, RailsRoute } from "@lib";
import { Permission } from "@middlewares";

export class AdminFeatureRoute extends RailsRoute {
  public draw() {
    this.resource(AdminFeatureController, {
      setPermissionForAny: [Feature.AdministrationManagement],
    });
    this.post("/reorder", action(AdminFeatureController, "reorder"), {
      setPermissionForAny: [
        `${Feature.AdministrationManagement}::${Permission.Update}`,
        `${Feature.UserManagement}::${Permission.Update}`,
      ],
    });
  }
}
