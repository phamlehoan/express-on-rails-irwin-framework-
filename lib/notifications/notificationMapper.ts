import type { AppNotification } from "@db";
import type { NotificationData, NotificationDto, NotificationType } from "./types";

const TYPES = new Set<NotificationType>(["info", "success", "warning", "error", "system"]);

export function parseNotificationData(raw: string | null | undefined): NotificationData | null {
  if (!raw?.trim()) return null;
  try {
    const o = JSON.parse(raw) as NotificationData;
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
}

export function stringifyNotificationData(data: NotificationData | null | undefined): string | null {
  if (!data || typeof data !== "object") return null;
  if (Object.keys(data).length === 0) return null;
  return JSON.stringify(data);
}

export function toNotificationDto(row: AppNotification): NotificationDto {
  const type = TYPES.has(row.type as NotificationType)
    ? (row.type as NotificationType)
    : "info";
  return {
    id: row.id,
    userId: row.userId,
    type,
    title: row.title,
    message: row.message,
    data: parseNotificationData(row.data),
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
