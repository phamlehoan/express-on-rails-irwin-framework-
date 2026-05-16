import type { Response } from "express";
import { logger } from "ts-rails";

type Client = { res: Response; heartbeat?: ReturnType<typeof setInterval> };

/** In-memory SSE subscribers per user (một process). */
const clientsByUser = new Map<string, Set<Client>>();

function writeSse(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function subscribeUserSse(userId: string, res: Response): void {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const client: Client = { res };
  client.heartbeat = setInterval(() => {
    try {
      writeSse(res, "ping", { t: Date.now() });
    } catch {
      unsubscribeUserSse(userId, res);
    }
  }, 25_000);

  let set = clientsByUser.get(userId);
  if (!set) {
    set = new Set();
    clientsByUser.set(userId, set);
  }
  set.add(client);

  res.on("close", () => unsubscribeUserSse(userId, res));
}

export function unsubscribeUserSse(userId: string, res: Response): void {
  const set = clientsByUser.get(userId);
  if (!set) return;
  for (const c of set) {
    if (c.res === res) {
      if (c.heartbeat) clearInterval(c.heartbeat);
      set.delete(c);
    }
  }
  if (set.size === 0) clientsByUser.delete(userId);
}

export function publishSseToUser(userId: string, event: string, data: unknown): number {
  const set = clientsByUser.get(userId);
  if (!set?.size) return 0;
  let n = 0;
  for (const c of [...set]) {
    try {
      writeSse(c.res, event, data);
      n++;
    } catch (e) {
      logger.warn({ userId, err: String(e) }, "[notifications] SSE write failed");
      unsubscribeUserSse(userId, c.res);
    }
  }
  return n;
}

export function sseConnectionCount(userId?: string): number {
  if (userId) return clientsByUser.get(userId)?.size ?? 0;
  let total = 0;
  for (const set of clientsByUser.values()) total += set.size;
  return total;
}
