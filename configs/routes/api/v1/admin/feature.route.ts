import { Feature as FeatEnum } from "@configs/enum";
import { ApiV1AdminFeatureController } from "@controllers/api";
import { Permission } from "@middlewares/enums/permissions";
import { action, RailsRoute } from "ts-rails";

const updatePerms = [`${FeatEnum.UserManagement}::${Permission.Update}`];

export class ApiV1AdminFeatureRoute extends RailsRoute {
  public draw() {
    this.resource(ApiV1AdminFeatureController, {
      document: {
        tags: ["Admin Feature"],
      },
    });
    this.post(
      "/reorder",
      action(ApiV1AdminFeatureController, "reorder"),
      { setPermissionForAny: updatePerms },
    );
  }
}
