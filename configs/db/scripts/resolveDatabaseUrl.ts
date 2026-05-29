import {
  type DatabaseProvider,
  resolveDatabaseProvider,
} from "../databaseProvider";

/**
 * Resolve DB URL for migrate scripts (same precedence as prisma.config.ts).
 */
export type DatabaseBackend = "turso" | "postgres" | "sqlite";

export function resolveMigrationDatabaseUrl(): string {
  const explicit = process.env.PRISMA_DATABASE_URL?.trim();
  if (explicit) return explicit;

  const turso = process.env.TURSO_DATABASE_URL?.trim();
  if (turso) return turso;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) return databaseUrl;

  throw new Error(
    "Missing DB URL. Set TURSO_DATABASE_URL, DATABASE_URL, or PRISMA_DATABASE_URL.",
  );
}

export function classifyDatabaseUrl(url: string): DatabaseBackend {
  const u = url.trim();
  if (/^postgres(?:ql)?:/i.test(u)) return "postgres";
  if (/^libsql:/i.test(u) || /^https?:/i.test(u) || /^wss?:/i.test(u)) {
    return "turso";
  }
  return "sqlite";
}

/** Đảm bảo `schema.prisma` provider khớp URL (Turso = sqlite, Supabase = postgresql). */
export function assertProviderMatchesUrl(
  provider: DatabaseProvider,
  url: string,
): void {
  const backend = classifyDatabaseUrl(url);
  if (provider === "postgresql" && backend !== "postgres") {
    throw new Error(
      `[database] schema provider is postgresql but URL is not postgresql://. ` +
        `Set DATABASE_URL from Supabase (Project Settings → Database → Connection string).`,
    );
  }
  if (provider === "sqlite" && backend === "postgres") {
    throw new Error(
      `[database] schema provider is sqlite but DATABASE_URL is PostgreSQL. ` +
        `Change datasource provider to "postgresql" in app/models/schema.prisma ` +
        `and set migration_lock.toml to postgresql (see docs/DATABASE.md).`,
    );
  }
  if (provider === "sqlite" && backend === "turso") {
    return;
  }
  if (provider === "sqlite" && backend === "sqlite") {
    return;
  }
}

export function resolveAndValidateMigrationConfig(): {
  provider: DatabaseProvider;
  url: string;
  backend: DatabaseBackend;
} {
  const provider = resolveDatabaseProvider();
  const url = resolveMigrationDatabaseUrl();
  assertProviderMatchesUrl(provider, url);
  return { provider, url, backend: classifyDatabaseUrl(url) };
}
