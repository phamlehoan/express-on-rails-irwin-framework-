import { ApiV1NotificationsController } from "@controllers/api/v1/notifications.controller";
import { action, RailsRoute } from "ts-rails";

export class ApiV1NotificationRoute extends RailsRoute {
  public draw() {
    this.get("/", action(ApiV1NotificationsController, "index"));
    this.get("/unread-count", action(ApiV1NotificationsController, "unreadCount"));
    this.post("/read-all", action(ApiV1NotificationsController, "readAll"));
    this.post("/send", action(ApiV1NotificationsController, "sendSelf"));
    this.put("/push-token", action(ApiV1NotificationsController, "registerPushToken"));
    this.delete("/push-token", action(ApiV1NotificationsController, "removePushToken"));
    this.post("/:id/read", action(ApiV1NotificationsController, "read"));
  }
}
