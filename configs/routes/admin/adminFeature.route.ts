import { Feature } from "@configs/enum";
import { AdminFeatureController } from "@controllers";
import { Permission } from "@middlewares";
import { action, RailsRoute } from "ts-rails";

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
