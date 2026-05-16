import {
  countUnread,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushToken,
  sendNotification,
  unregisterPushToken,
} from "@lib/notifications";
import { ApiResponse } from "ts-rails";
import { ApiV1Controller } from "./apiV1.controller";

export class ApiV1NotificationsController extends ApiV1Controller {
  /** GET /api/v1/notifications */
  async index() {
    const userId = this.currentUser!.id;
    const unreadOnly = this.req.query.unread === "1" || this.req.query.unread === "true";
    const limit = parseInt(String(this.req.query.limit || "30"), 10);
    const items = await listNotifications(userId, { limit, unreadOnly });
    const unreadCount = await countUnread(userId);
    this.renderJson({ items, unreadCount });
  }

  /** GET /api/v1/notifications/unread-count */
  async unreadCount() {
    const n = await countUnread(this.currentUser!.id);
    this.renderJson({ unreadCount: n });
  }

  /** POST /api/v1/notifications/:id/read */
  async read() {
    const userId = this.currentUser!.id;
    const id = String(this.req.params.id || "");
    const row = await markNotificationRead(userId, id);
    if (!row) {
      return this.res.status(404).json(ApiResponse.error("Notification not found"));
    }
    const unreadCount = await countUnread(userId);
    this.renderJson({ notification: row, unreadCount });
  }

  /** POST /api/v1/notifications/read-all */
  async readAll() {
    const userId = this.currentUser!.id;
    await markAllNotificationsRead(userId);
    const unreadCount = await countUnread(userId);
    this.renderJson({ unreadCount });
  }

  /** PUT /api/v1/notifications/push-token */
  async registerPushToken() {
    const userId = this.currentUser!.id;
    const b = (this.req.body || {}) as Record<string, unknown>;
    const token = typeof b.token === "string" ? b.token : "";
    const platform =
      typeof b.platform === "string" ? b.platform.toUpperCase() : "WEB";
    if (!token) {
      return this.res.status(422).json(ApiResponse.error("token is required"));
    }
    if (!["ANDROID", "IOS", "WEB"].includes(platform)) {
      return this.res
        .status(422)
        .json(ApiResponse.error("platform must be ANDROID, IOS, or WEB"));
    }
    await registerPushToken({
      userId,
      token,
      platform: platform as "ANDROID" | "IOS" | "WEB",
      deviceId: typeof b.deviceId === "string" ? b.deviceId : undefined,
      appVersion: typeof b.appVersion === "string" ? b.appVersion : undefined,
    });
    this.renderJson({ ok: true });
  }

  /** DELETE /api/v1/notifications/push-token */
  async removePushToken() {
    const userId = this.currentUser!.id;
    const token =
      typeof this.req.body?.token === "string"
        ? this.req.body.token
        : String(this.req.query.token || "");
    if (!token) {
      return this.res.status(422).json(ApiResponse.error("token is required"));
    }
    await unregisterPushToken(userId, token);
    this.renderJson({ ok: true });
  }

  /**
   * POST /api/v1/notifications/send — gửi thử (chỉ tới chính user hoặc admin nội bộ).
   * Production: gọi `notifications.send()` từ service/job, không expose công khai.
   */
  async sendSelf() {
    const userId = this.currentUser!.id;
    const b = (this.req.body || {}) as Record<string, unknown>;
    const title = typeof b.title === "string" ? b.title : "Test notification";
    const message = typeof b.message === "string" ? b.message : undefined;
    const type = typeof b.type === "string" ? b.type : "info";
    const result = await sendNotification({
      userId,
      title,
      message,
      type: type as "info",
    });
    this.renderJson(result);
  }
}
