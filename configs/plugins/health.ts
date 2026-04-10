/**
 * Health & Readiness - tương tự Rails /up, /ready.
 */
import models from "@models";
import { Cache } from "ts-rails";

export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  checks?: Record<string, { status: string; message?: string }>;
}

export async function checkReadiness(): Promise<HealthStatus> {
  const checks: Record<string, { status: string; message?: string }> = {};
  let overall: "ok" | "degraded" | "error" = "ok";

  // Database
  try {
    await models.$connect();
    checks.database = { status: "ok" };
  } catch (e) {
    checks.database = {
      status: "error",
      message: (e as Error).message,
    };
    overall = "error";
  }

  // Cache (in-memory luôn ok, nếu dùng Redis thì check connection)
  try {
    Cache.set("_health_check", "1", 5);
    const v = Cache.get("_health_check");
    checks.cache = { status: v === "1" ? "ok" : "degraded" };
  } catch (e) {
    checks.cache = { status: "error", message: (e as Error).message };
    if (overall === "ok") overall = "degraded";
  }

  return {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };
}
