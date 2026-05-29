import { Feature as FeatEnum } from "@configs/enum";
import { ApiV1AdminFeatureController } from "@controllers/api";
import { Permission } from "@middlewares/enums/permissions";
import {
  FeatureCreateValidator,
  FeatureUpdateValidator,
} from "@validators/admin.validator";
import { action, RailsRoute, RestActions } from "ts-rails";

const updatePerms = [`${FeatEnum.UserManagement}::${Permission.Update}`];

export class ApiV1AdminFeatureRoute extends RailsRoute {
  public draw() {
    this.resource(ApiV1AdminFeatureController, {
      document: {
        tags: ["Admin Feature"],
        auth: true,
      },
      documentByAction: {
        [RestActions.Create]: { body: FeatureCreateValidator },
        [RestActions.Update]: { body: FeatureUpdateValidator },
      },
    });
    this.post(
      "/reorder",
      action(ApiV1AdminFeatureController, "reorder"),
      {
        document: {
          summary: "Reorder features tree",
          tags: ["Admin Feature"],
          auth: true,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["items"],
                  properties: {
                    items: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                        properties: {
                          parentId: { type: "string", nullable: true },
                          sortOrder: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        setPermissionForAny: updatePerms,
      },
    );
  }
}
