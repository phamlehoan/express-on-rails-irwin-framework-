import { loadDotenv } from "../../loadDotenv";
import {
  assertMigrationsConfig,
  MIGRATIONS_DIR,
  readMigrationLockProvider,
  readSchemaProvider,
  resolveDatabaseProvider,
} from "../databaseProvider";
import { resolveAndValidateMigrationConfig } from "./resolveDatabaseUrl";

loadDotenv();

function main(): void {
  assertMigrationsConfig();
  const fromSchema = readSchemaProvider();
  const fromLock = readMigrationLockProvider();
  const provider = resolveDatabaseProvider();
  const { url, backend } = resolveAndValidateMigrationConfig();

  console.log("[db:check] OK");
  console.log(`  schema provider: ${fromSchema}`);
  console.log(`  migration_lock: ${fromLock}`);
  if (provider !== fromSchema) {
    console.log(`  effective provider (DATABASE_PROVIDER): ${provider}`);
  }
  console.log(`  URL backend: ${backend}`);
  console.log(`  migrations: ${MIGRATIONS_DIR}`);
  console.log(`  URL: ${url.replace(/:[^:@/]+@/, ":****@")}`);
}

main();
