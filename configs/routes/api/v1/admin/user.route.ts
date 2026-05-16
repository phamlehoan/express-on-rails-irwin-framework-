import { Feature } from "@configs/enum";
import { ApiV1AdminUserController } from "@controllers/api";
import { Permission } from "@middlewares";
import { action, RailsRoute } from "ts-rails";

export class ApiV1AdminUserRoute extends RailsRoute {
  public draw() {
    this.post(
      "/:id/send-password-reset",
      action(ApiV1AdminUserController, "sendPasswordReset"),
      {
        document: {
          summary: "Send password reset email (admin)",
          tags: ["Admin User"],
        },
        setPermissionForAny: [`${Feature.UserManagement}::${Permission.Update}`],
      },
    );
    this.resource(ApiV1AdminUserController, {
      document: { tags: ["Admin User"] },
      setPermissionForAny: [Feature.UserManagement],
    });
  }
}
