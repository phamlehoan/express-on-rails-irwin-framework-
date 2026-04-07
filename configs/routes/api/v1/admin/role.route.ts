import { Feature } from "@configs/enum";
import { ApiV1AdminRoleController } from "@controllers/api";
import { RailsRoute, RestActions } from "ts-rails";

export class ApiV1AdminRoleRoute extends RailsRoute {
  public draw() {
    this.resource(ApiV1AdminRoleController, {
      document: { tags: ["Admin Role"] },
      setPermissionForAny: [
        Feature.AdministrationManagement,
        Feature.UserManagement,
      ],
      only: [RestActions.Index, RestActions.Show],
    });
  }
}
