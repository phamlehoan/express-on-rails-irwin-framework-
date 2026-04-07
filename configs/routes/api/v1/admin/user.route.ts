import { Feature } from "@configs/enum";
import { ApiV1AdminUserController } from "@controllers/api";
import { RailsRoute } from "ts-rails";

export class ApiV1AdminUserRoute extends RailsRoute {
  public draw() {
    this.resource(ApiV1AdminUserController, {
      document: { tags: ["Admin User"] },
      setPermissionForAny: [
        Feature.AdministrationManagement,
        Feature.UserManagement,
      ],
    });
  }
}
