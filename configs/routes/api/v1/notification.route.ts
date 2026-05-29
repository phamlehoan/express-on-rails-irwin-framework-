import { ApiV1NotificationsController } from "@controllers/api/v1/notifications.controller";
import {
  NotificationListQueryValidator,
  PushTokenValidator,
  SendNotificationValidator,
} from "@validators/notification.validator";
import { action, RailsRoute } from "ts-rails";

export class ApiV1NotificationRoute extends RailsRoute {
  public draw() {
    this.get("/", action(ApiV1NotificationsController, "index"), {
      document: {
        summary: "List notifications",
        tags: ["Notifications"],
        auth: true,
        params: NotificationListQueryValidator,
      },
    });
    this.get("/unread-count", action(ApiV1NotificationsController, "unreadCount"), {
      document: {
        summary: "Unread notification count",
        tags: ["Notifications"],
        auth: true,
      },
    });
    this.post("/read-all", action(ApiV1NotificationsController, "readAll"), {
      document: {
        summary: "Mark all notifications read",
        tags: ["Notifications"],
        auth: true,
      },
    });
    this.post("/send", action(ApiV1NotificationsController, "sendSelf"), {
      document: {
        summary: "Send test notification to self",
        tags: ["Notifications"],
        auth: true,
        body: SendNotificationValidator,
      },
    });
    this.put("/push-token", action(ApiV1NotificationsController, "registerPushToken"), {
      document: {
        summary: "Register FCM push token",
        tags: ["Notifications"],
        auth: true,
        body: PushTokenValidator,
      },
    });
    this.delete("/push-token", action(ApiV1NotificationsController, "removePushToken"), {
      document: {
        summary: "Remove FCM push token",
        tags: ["Notifications"],
        auth: true,
        body: PushTokenValidator,
      },
    });
    this.post("/:id/read", action(ApiV1NotificationsController, "read"), {
      document: {
        summary: "Mark one notification read",
        tags: ["Notifications"],
        auth: true,
      },
    });
  }
}
