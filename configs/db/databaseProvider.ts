import { readFileSync } from "node:fs";
import path from "node:path";

export type DatabaseProvider = "sqlite" | "postgresql";

export const MIGRATIONS_DIR = "configs/db/migrations";

const SCHEMA_PATH = path.resolve(process.cwd(), "app/models/schema.prisma");
const LOCK_PATH = path.resolve(process.cwd(), MIGRATIONS_DIR, "migration_lock.toml");

/** Đọc `provider = "sqlite" | "postgresql"` từ schema.prisma. */
export function readSchemaProvider(): DatabaseProvider {
  const content = readFileSync(SCHEMA_PATH, "utf8");
  const match = content.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  if (!match) {
    throw new Error(
      `[database] app/models/schema.prisma: datasource provider must be "sqlite" or "postgresql".`,
    );
  }
  return match[1] as DatabaseProvider;
}

/** Đọc provider từ `configs/db/migrations/migration_lock.toml`. */
export function readMigrationLockProvider(): DatabaseProvider {
  const content = readFileSync(LOCK_PATH, "utf8");
  const match = content.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  if (!match) {
    throw new Error(
      `[database] ${MIGRATIONS_DIR}/migration_lock.toml: provider must be "sqlite" or "postgresql".`,
    );
  }
  return match[1] as DatabaseProvider;
}

/**
 * Provider hiện tại: `DATABASE_PROVIDER` (nếu set) hoặc đọc từ schema.prisma.
 */
export function resolveDatabaseProvider(): DatabaseProvider {
  const fromEnv = process.env.DATABASE_PROVIDER?.trim().toLowerCase();
  if (fromEnv === "postgresql" || fromEnv === "postgres") return "postgresql";
  if (fromEnv === "sqlite") return "sqlite";
  return readSchemaProvider();
}

/** schema.prisma và migration_lock.toml phải cùng provider (dev chọn một DB). */
export function assertMigrationsConfig(): void {
  const schema = readSchemaProvider();
  const lock = readMigrationLockProvider();
  if (schema !== lock) {
    throw new Error(
      `[database] schema.prisma provider is "${schema}" but migration_lock.toml is "${lock}". ` +
        `Chọn một DB: sửa cả hai cho khớp, rồi \`pnpm db:migrate\` (xem docs/DATABASE.md).`,
    );
  }
  const resolved = resolveDatabaseProvider();
  if (resolved !== schema) {
    throw new Error(
      `[database] DATABASE_PROVIDER=${resolved} không khớp schema.prisma (${schema}).`,
    );
  }
}

export function migrationsDirectoryResolved(): string {
  return path.resolve(process.cwd(), MIGRATIONS_DIR);
}
