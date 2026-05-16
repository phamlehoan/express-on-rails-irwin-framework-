export type NotificationType = "info" | "success" | "warning" | "error" | "system";

/** Payload tùy chọn (lưu JSON trong DB, gửi kèm FCM data). */
export type NotificationData = {
  link?: string;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
};

export type NotificationDto = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: NotificationData | null;
  readAt: string | null;
  createdAt: string;
};

export type SendNotificationInput = {
  userId: string;
  type?: NotificationType;
  title: string;
  message?: string;
  data?: NotificationData | null;
  /** Gửi FCM tới thiết bị (mặc định true nếu FCM đã cấu hình). */
  push?: boolean;
  /** Đẩy realtime qua SSE (mặc định true). */
  realtime?: boolean;
};

export type SendNotificationResult = {
  notification: NotificationDto;
  pushedFcm: number;
  sseDelivered: boolean;
};

export type RegisterPushTokenInput = {
  userId: string;
  token: string;
  platform: "ANDROID" | "IOS" | "WEB";
  deviceId?: string;
  appVersion?: string;
};
