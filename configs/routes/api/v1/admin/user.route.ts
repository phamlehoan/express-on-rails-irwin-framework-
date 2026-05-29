import { Feature } from "@configs/enum";
import { ApiV1AdminUserController } from "@controllers/api";
import { Permission } from "@middlewares";
import {
  CreateUserValidator,
  PaginationValidator,
  UpdateUserValidator,
} from "@validators/admin.validator";
import { action, RailsRoute, RestActions } from "ts-rails";

export class ApiV1AdminUserRoute extends RailsRoute {
  public draw() {
    this.post(
      "/:id/send-password-reset",
      action(ApiV1AdminUserController, "sendPasswordReset"),
      {
        document: {
          summary: "Send password reset email (admin)",
          tags: ["Admin User"],
          auth: true,
        },
        setPermissionForAny: [`${Feature.UserManagement}::${Permission.Update}`],
      },
    );
    this.resource(ApiV1AdminUserController, {
      document: { tags: ["Admin User"], auth: true },
      documentByAction: {
        [RestActions.Index]: { params: PaginationValidator },
        [RestActions.Create]: { body: CreateUserValidator },
        [RestActions.Update]: { body: UpdateUserValidator },
      },
      setPermissionForAny: [Feature.UserManagement],
    });
  }
}
