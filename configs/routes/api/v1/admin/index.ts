/**
 * Admin API routes - yêu cầu AM permission.
 * Dùng Route.resource + @ApiDoc trên controller - gọn như Rails.
 */
import { Feature, RestActions } from "@configs/enum";
import {
    ApiV1AdminFeatureController,
    ApiV1AdminRoleController,
    ApiV1AdminUserController,
} from "@controllers/api";
import { Route } from "@routes";
import { Router } from "express";

export class ApiV1AdminRoute {
  private static path = Router();

  public static draw() {
    const userRouter = Router();
    Route.resource(userRouter, ApiV1AdminUserController, {
      api: { swaggerPath: "/admin/users", tags: ["Admin"] },
      setPermissionForAny: [Feature.AdministrationManagement, Feature.UserManagement],
    });
    this.path.use("/users", userRouter);

    const roleRouter = Router();
    Route.resource(roleRouter, ApiV1AdminRoleController, {
      api: { swaggerPath: "/admin/roles", tags: ["Admin"] },
      setPermissionForAny: [Feature.AdministrationManagement, Feature.UserManagement],
      only: [RestActions.Index, RestActions.Show],
    });
    this.path.use("/roles", roleRouter);

    const featureRouter = Router();
    Route.resource(featureRouter, ApiV1AdminFeatureController, {
      api: { swaggerPath: "/admin/features", tags: ["Admin"] },
      setPermissionForAny: [Feature.AdministrationManagement, Feature.UserManagement],
      only: [RestActions.Index, RestActions.Show],
    });
    this.path.use("/features", featureRouter);

    return this.path;
  }
}
