import { Feature } from "@configs/enum";
import { ApiV1AdminFeatureController } from "@controllers/api";
import { RailsRoute, RestActions } from "@lib";

export class ApiV1AdminFeatureRoute extends RailsRoute {
  public draw() {
    this.resource(ApiV1AdminFeatureController, {
      document: {
        path: "/admin/features",
        tags: ["Admin"],
      },
      setPermissionForAny: [
        Feature.AdministrationManagement,
        Feature.UserManagement,
      ],
      only: [RestActions.Index, RestActions.Show],
    });
  }
}
