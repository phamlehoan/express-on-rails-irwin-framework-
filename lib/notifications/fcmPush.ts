import env from "@configs/env";
import models from "@models";
import { logger } from "ts-rails";
import type { NotificationData, NotificationDto } from "./types";

let messaging: import("firebase-admin/messaging").Messaging | null | undefined;

function fcmConfigured(): boolean {
  return Boolean(env.fcmProjectId && env.fcmClientEmail && env.fcmPrivateKey);
}

async function getMessaging(): Promise<import("firebase-admin/messaging").Messaging | null> {
  if (messaging !== undefined) return messaging;
  if (!fcmConfigured()) {
    messaging = null;
    return null;
  }
  try {
    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.fcmProjectId,
          clientEmail: env.fcmClientEmail,
          privateKey: env.fcmPrivateKey,
        }),
      });
    }
    messaging = admin.messaging();
  } catch (e) {
    logger.error({ err: String(e) }, "[notifications] FCM init failed");
    messaging = null;
  }
  return messaging;
}

function dataPayload(dto: NotificationDto): Record<string, string> {
  const out: Record<string, string> = {
    notificationId: dto.id,
    type: dto.type,
    title: dto.title,
  };
  if (dto.message) out.body = dto.message;
  if (dto.data) {
    try {
      out.dataJson = JSON.stringify(dto.data);
      if (dto.data.link) out.link = String(dto.data.link);
    } catch {
      /* ignore */
    }
  }
  return out;
}

/** Gửi FCM tới mọi token active của user; trả số token gửi thành công. */
export async function pushFcmToUser(
  userId: string,
  dto: NotificationDto,
): Promise<number> {
  const msg = await getMessaging();
  if (!msg) return 0;

  const tokens = await models.userPushToken.findMany({
    where: { userId, isActive: true },
    select: { id: true, token: true },
  });
  if (!tokens.length) return 0;

  let ok = 0;
  const data = dataPayload(dto);

  for (const row of tokens) {
    try {
      await msg.send({
        token: row.token,
        notification: {
          title: dto.title,
          body: dto.message ?? undefined,
        },
        data,
      });
      ok++;
      await models.userPushToken.update({
        where: { id: row.id },
        data: { lastError: null },
      });
    } catch (e) {
      const errText = e instanceof Error ? e.message : String(e);
      logger.warn({ userId, token: row.token.slice(0, 12), err: errText }, "[notifications] FCM send failed");
      const invalid =
        /not-registered|invalid-registration|registration-token-not-registered/i.test(errText);
      await models.userPushToken.update({
        where: { id: row.id },
        data: {
          isActive: !invalid,
          lastError: errText.slice(0, 500),
        },
      });
    }
  }
  return ok;
}

export function isFcmEnabled(): boolean {
  return fcmConfigured();
}
