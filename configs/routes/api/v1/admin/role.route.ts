import { Feature } from "@configs/enum";
import { ApiV1AdminRoleController } from "@controllers/api";
import { RailsRoute, RestActions } from "@rails";

export class ApiV1AdminRoleRoute extends RailsRoute {
  public draw() {
    this.resource(ApiV1AdminRoleController, {
      document: { path: "/admin/roles", tags: ["Admin"] },
      setPermissionForAny: [
        Feature.AdministrationManagement,
        Feature.UserManagement,
      ],
      only: [RestActions.Index, RestActions.Show],
    });
  }
}
