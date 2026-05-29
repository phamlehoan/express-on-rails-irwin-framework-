import { spawnSync } from "node:child_process";
import { loadDotenv } from "../../loadDotenv";
import { assertMigrationsConfig, MIGRATIONS_DIR } from "../databaseProvider";
import { resolveAndValidateMigrationConfig } from "./resolveDatabaseUrl";

loadDotenv();

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main(): void {
  assertMigrationsConfig();
  const { backend } = resolveAndValidateMigrationConfig();
  console.log(`[db:deploy] migrations=${MIGRATIONS_DIR} backend=${backend}`);

  if (backend === "turso") {
    console.log("[db:deploy] Turso (SQLite): custom migrate runner.");
    run("pnpm", ["exec", "tsx", "configs/db/scripts/migrateTurso.ts"]);
    return;
  }

  if (backend === "postgres") {
    console.log("[db:deploy] PostgreSQL (Supabase): `prisma migrate deploy`.");
    run("pnpm", ["exec", "prisma", "migrate", "deploy"]);
    return;
  }

  console.log("[db:deploy] SQLite file: `prisma migrate deploy`.");
  run("pnpm", ["exec", "prisma", "migrate", "deploy"]);
}

main();
