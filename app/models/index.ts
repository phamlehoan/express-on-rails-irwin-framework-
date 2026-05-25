import env from "@configs/env";
import { isServerlessDeployedBundle } from "@configs/env";
import { getPackageRootSync, resolveBundledScriptDir } from "@configs/loadDotenv";
import { PrismaClient } from "@db";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const modelsModuleDir = resolveBundledScriptDir("app/models");

/** Serverless bundle: Turso only via TURSO_DATABASE_URL; full server may use DATABASE_URL=libsql://... */
function tursoDatabaseUrlRuntime(): string {
  const turso = stripQuotes(process.env.TURSO_DATABASE_URL || "");
  if (turso) return turso;
  if (isServerlessDeployedBundle()) return "";
  const db = stripQuotes(process.env.DATABASE_URL || "");
  return db.startsWith("libsql:") ? db : "";
}

function useTursoRuntime(): boolean {
  return Boolean(tursoDatabaseUrlRuntime());
}

function stripQuotes(s: string): string {
  return s
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^['"]|['"]$/g, "");
}

function sqlitePathForLocalAdapter(databaseUrl: string): string {
  const unquoted = stripQuotes(databaseUrl);
  if (/^file:\/\//i.test(unquoted)) {
    return path.normalize(fileURLToPath(new URL(unquoted)));
  }
  if (!/^file:/i.test(unquoted)) {
    if (path.isAbsolute(unquoted)) {
      return path.normalize(unquoted);
    }
    return path.normalize(
      path.resolve(getPackageRootSync(modelsModuleDir), unquoted),
    );
  }
  const raw = unquoted.replace(/^file:/i, "").trim();
  if (path.isAbsolute(raw)) {
    return path.normalize(raw);
  }
  return path.normalize(
    path.resolve(getPackageRootSync(modelsModuleDir), raw),
  );
}

function readTursoAuthToken(): string {
  return stripQuotes(process.env.TURSO_AUTH_TOKEN || "");
}

function prismaClientSingleton() {
  const logLevels =
    env.appEnv === "development" ? (["query", "error", "warn"] as const) : (["error"] as const);

  if (useTursoRuntime()) {
    const url = tursoDatabaseUrlRuntime();
    if (!url.startsWith("libsql:")) {
      throw new Error(
        "[prisma] Turso: set TURSO_DATABASE_URL=libsql://... (from Turso dashboard / `turso db show --url`).",
      );
    }
    const authToken = readTursoAuthToken();
    if (!authToken) {
      throw new Error(
        "[prisma] Turso: set TURSO_AUTH_TOKEN. " +
          "If the value contains `#`, wrap the whole token in quotes in .env. " +
          "Remove a blank `TURSO_AUTH_TOKEN=` line so a token from another .env can apply.",
      );
    }
    const adapter = new PrismaLibSql({
      url,
      authToken,
    });
    return new PrismaClient({
      adapter,
      log: [...logLevels],
    });
  }

  // On serverless, `env.databaseUrl` is intentionally empty (no file DB). Check this before `!fileUrl`
  // or every deploy hits the wrong branch while the real issue is missing TURSO_* in process.env.
  if (isServerlessDeployedBundle()) {
    throw new Error(
      "[prisma] Serverless: TURSO_DATABASE_URL (libsql://...) and TURSO_AUTH_TOKEN are required. " +
        "They were not found in process.env when Prisma initialized. " +
        "Confirm Netlify build env includes them, netlify/.runtime-secrets.json is produced, and loadDotenv runs before this module loads.",
    );
  }

  const fileUrl = env.databaseUrl.trim();
  if (/^postgres(?:ql)?:/i.test(fileUrl)) {
    const adapter = new PrismaPg({ connectionString: fileUrl });
    return new PrismaClient({
      adapter,
      log: [...logLevels],
    });
  }
  if (!fileUrl) {
    throw new Error(
      "[prisma] SQLite: set DATABASE_URL=file:./database/app.db for a full server, or use Turso with TURSO_*.",
    );
  }
  const dbPath = sqlitePathForLocalAdapter(fileUrl);
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const adapter = new PrismaBetterSqlite3({
    url: dbPath,
  });

  return new PrismaClient({
    adapter,
    log: [...logLevels],
  });
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const models: PrismaClientSingleton = prismaClientSingleton();

export default models;

export * from "./enums";
