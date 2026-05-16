/**
 * Module thông báo dùng chung — persist DB, realtime SSE (web), FCM (API/mobile).
 *
 * @example
 * import { notifications } from "@lib/notifications";
 *
 * await notifications.send({
 *   userId: admin.id,
 *   title: "User created",
 *   message: "A new account was added.",
 *   type: "success",
 *   data: { link: "/admin/users/..." },
 * });
 */
import {
  broadcastNotificationsCenter,
  buildSseConnectedPayload,
  countUnread,
  listNotifications,
  loadNotificationsCenterPayload,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushToken,
  sendNotification,
  sendNotificationSafe,
  sendNotificationToMany,
  softDeleteNotification,
  unregisterPushToken,
} from "./notificationService";
import { isFcmEnabled } from "./fcmPush";
import { publishSseToUser, subscribeUserSse, unsubscribeUserSse } from "./sseHub";

export type {
  NotificationData,
  NotificationDto,
  NotificationType,
  RegisterPushTokenInput,
  SendNotificationInput,
  SendNotificationResult,
} from "./types";

export {
  broadcastNotificationsCenter,
  buildSseConnectedPayload,
  countUnread,
  isFcmEnabled,
  listNotifications,
  loadNotificationsCenterPayload,
  markAllNotificationsRead,
  markNotificationRead,
  publishSseToUser,
  registerPushToken,
  sendNotification,
  sendNotificationSafe,
  sendNotificationToMany,
  softDeleteNotification,
  subscribeUserSse,
  unregisterPushToken,
  unsubscribeUserSse,
};

export type { NotificationsCenterPayload } from "./notificationService";

/** Facade gọn — gọi từ service/controller/job bất kỳ. */
export const notifications = {
  send: sendNotification,
  sendSafe: sendNotificationSafe,
  sendMany: sendNotificationToMany,
  list: listNotifications,
  unreadCount: countUnread,
  markRead: markNotificationRead,
  markAllRead: markAllNotificationsRead,
  registerPushToken,
  unregisterPushToken,
  delete: softDeleteNotification,
  sse: {
    subscribe: subscribeUserSse,
    unsubscribe: unsubscribeUserSse,
    publish: publishSseToUser,
    connectedPayload: buildSseConnectedPayload,
    broadcastCenter: broadcastNotificationsCenter,
  },
  fcm: { isEnabled: isFcmEnabled },
};
