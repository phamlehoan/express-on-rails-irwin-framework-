import {
  broadcastNotificationsCenter,
  countUnread,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeUserSse,
} from "@lib/notifications";
import { BeforeAction } from "ts-rails";
import { ApplicationController } from "./application.controller";

@BeforeAction("requireLogin")
export class NotificationsController extends ApplicationController {
  /** GET /notifications/stream — SSE (session cookie). */
  async stream() {
    const userId = this.currentUser!.id;
    subscribeUserSse(userId, this.res);
    await broadcastNotificationsCenter(userId);
    return false;
  }

  /** GET /notifications */
  async index() {
    const userId = this.currentUser!.id;
    const alerts = await listNotifications(userId, { limit: 50 });
    this.render("notifications.view/index", {
      title: this.t("notifications.page_title"),
      notifications: alerts,
    });
  }

  /** POST /notifications/:id/read */
  async read() {
    const userId = this.currentUser!.id;
    const id = String(this.req.params.id || "");
    const row = await markNotificationRead(userId, id);
    if (!row) {
      return this.res.status(404).json({ success: false, error: "Not found" });
    }
    const unreadCount = await countUnread(userId);
    return this.res.json({ success: true, notification: row, unreadCount });
  }

  /** POST /notifications/read-all */
  async readAll() {
    const userId = this.currentUser!.id;
    await markAllNotificationsRead(userId);
    const unreadCount = await countUnread(userId);
    return this.res.json({ success: true, unreadCount });
  }
}
