import { NotificationsController } from "@controllers/notifications.controller";
import { action, RailsRoute } from "ts-rails";

export class NotificationRoute extends RailsRoute {
  public draw() {
    this.get("/stream", action(NotificationsController, "stream"));
    this.get("/", action(NotificationsController, "index"));
    this.post("/read-all", action(NotificationsController, "readAll"));
    this.post("/:id/read", action(NotificationsController, "read"));
  }
}
