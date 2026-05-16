import { randomBytes } from "crypto";
import { logger } from "ts-rails";

export function newAiRunId(): string {
  return randomBytes(4).toString("hex");
}

export function truncStr(s: string, max = 6000): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…[+${s.length - max} chars]`;
}

type AiLogBase = {
  component: "ai-assistant";
  runId: string;
  requestId?: string;
};

function base(runId: string, requestId?: string): AiLogBase {
  return { component: "ai-assistant", runId, ...(requestId ? { requestId } : {}) };
}

export function logAiDebug(
  runId: string,
  msg: string,
  fields: Record<string, unknown>,
  requestId?: string,
): void {
  logger.debug({ ...base(runId, requestId), ...fields }, `[ai-assistant] ${msg}`);
}

export function logAiInfo(
  runId: string,
  msg: string,
  fields?: Record<string, unknown>,
  requestId?: string,
): void {
  logger.info({ ...base(runId, requestId), ...(fields ?? {}) }, `[ai-assistant] ${msg}`);
}

export function logAiWarn(
  runId: string,
  msg: string,
  fields: Record<string, unknown>,
  requestId?: string,
): void {
  logger.warn({ ...base(runId, requestId), ...fields }, `[ai-assistant] ${msg}`);
}

export function logAiError(
  runId: string,
  msg: string,
  fields: Record<string, unknown>,
  requestId?: string,
): void {
  logger.error({ ...base(runId, requestId), ...fields }, `[ai-assistant] ${msg}`);
}
