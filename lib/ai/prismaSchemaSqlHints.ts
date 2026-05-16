import { isAiSensitiveModel } from "./sqlReadGuard";

/** Extract `model X { ... @@map("table")` from Prisma schema for SQLite table names. */
export function extractPrismaModelTableMappings(schemaText: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /model\s+(\w+)\s*\{[\s\S]*?@@map\("([^"]+)"\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(schemaText)) !== null) {
    if (!isAiSensitiveModel(m[1])) {
      map.set(m[1], m[2]);
    }
  }
  return map;
}

/** Short markdown list for SQL prompts (sorted by model name). */
export function formatSqlTableDirectoryFromSchema(schemaText: string): string {
  const entries = [...extractPrismaModelTableMappings(schemaText).entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  return entries
    .map(([model, table]) => `- Prisma \`${model}\` → SQLite \`${table}\``)
    .join("\n");
}
