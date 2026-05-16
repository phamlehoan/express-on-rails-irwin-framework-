/** Prisma models excluded from AI SQL prompts and execution. Extend per project. */
export const AI_SENSITIVE_MODELS = new Set(["Password", "UserPushToken"]);

/** SQLite table names (@@map) matching {@link AI_SENSITIVE_MODELS}. */
export const AI_SENSITIVE_TABLES = new Set(["passwords", "user_push_tokens"]);

export function isAiSensitiveModel(modelName: string): boolean {
  return AI_SENSITIVE_MODELS.has(modelName.trim());
}

export function sqlReferencesBlockedTable(sql: string, blocked = AI_SENSITIVE_TABLES): boolean {
  const normalized = sql.trim();
  if (!normalized || blocked.size === 0) return false;
  for (const table of blocked) {
    const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `\\b(?:from|join)\\s+["\`']?${escaped}["\`']?\\b|\\b${escaped}\\s*\\.`,
      "i",
    );
    if (re.test(normalized)) return true;
  }
  return false;
}

/** Remove sensitive `model` blocks from schema text shown to the LLM. */
export function stripSensitiveModelsFromSchema(
  schemaText: string,
  blocked = AI_SENSITIVE_MODELS,
): string {
  if (blocked.size === 0) return schemaText;
  return schemaText.replace(/model\s+(\w+)\s*\{[\s\S]*?\n\}/g, (block, modelName: string) => {
    if (!blocked.has(modelName)) return block;
    return `// [excluded from AI queries] model ${modelName} { ... }\n`;
  });
}
