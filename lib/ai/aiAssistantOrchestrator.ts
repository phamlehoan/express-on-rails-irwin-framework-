import fs from "fs";
import path from "path";
import models from "@models";
import { generateWithModelCascade } from "./googleGenAiCascade";
import {
  logAiDebug,
  logAiError,
  logAiInfo,
  logAiWarn,
  newAiRunId,
  truncStr,
} from "./aiAssistantLog";
import { formatSqlTableDirectoryFromSchema } from "./prismaSchemaSqlHints";
import { sqlReferencesBlockedTable, stripSensitiveModelsFromSchema } from "./sqlReadGuard";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatImage = { mimeType: string; dataBase64: string };

export type AiAssistantRequest = {
  messages: ChatMessage[];
  images?: ChatImage[];
  userContext?: { userId?: string; email?: string };
  requestId?: string;
};

export type AiAssistantResponse = {
  replyMarkdown: string;
  debug?: { modelUsed?: string[]; runId?: string; requestId?: string };
};

let schemaCache: string | null = null;

function loadPrismaSchema(): string {
  if (schemaCache) return schemaCache;
  const p = path.join(process.cwd(), "app", "models", "schema.prisma");
  schemaCache = fs.readFileSync(p, "utf8");
  return schemaCache;
}

function compactPrismaSchemaForSqlPrompt(raw: string, maxChars: number): string {
  const kept: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("//") || t.startsWith("///")) continue;
    kept.push(line);
  }
  let s = kept.join("\n");
  if (s.length > maxChars) {
    s = `${s.slice(0, maxChars)}\n// ... truncated`;
  }
  return s;
}

function trimHistory(msgs: ChatMessage[], max = 8): ChatMessage[] {
  return msgs.slice(-max);
}

function conversationBlock(msgs: ChatMessage[]): string {
  return trimHistory(msgs, 8)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");
}

function stripDataUrl(data: string): { mime: string; b64: string } {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(data.trim());
  if (m) return { mime: m[1], b64: m[2].replace(/\s/g, "") };
  return { mime: "image/png", b64: data.replace(/\s/g, "") };
}

function normalizeImages(images: ChatImage[] | undefined): ChatImage[] {
  if (!images?.length) return [];
  const out: ChatImage[] = [];
  for (const img of images.slice(0, 4)) {
    const raw = String(img.dataBase64 || "");
    const { mime, b64 } = stripDataUrl(raw);
    if (b64.length > 4_500_000) continue;
    const mt = /^image\/(png|jpeg|jpg|webp|gif)$/i.test(img.mimeType || mime)
      ? img.mimeType || mime
      : "image/png";
    out.push({ mimeType: mt.toLowerCase().replace("jpg", "jpeg"), dataBase64: b64 });
  }
  return out;
}

function extractJsonObject<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

function truncateForPrompt(obj: unknown, maxLen = 8000): string {
  let s = JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}\n/* truncated */`;
}

function tailByChars(s: string, max: number): string {
  if (s.length <= max) return s;
  return `…\n${s.slice(s.length - max)}`;
}

const NARRATOR_MAX_ROWS = 150;
const NARRATOR_JSON_CHAR_CAP = 5000;
const SQL_SCHEMA_PROMPT_MAX_CHARS = 6600;
const NARRATOR_CELL_MAX = 64;
const NARRATOR_SQL_CHARS = 420;
const NARRATOR_MAX_KEYS = 6;
const NARRATOR_FULL_ROWS_WHEN_SHORT = 60;

function shrinkNarratorCell(v: unknown): unknown {
  if (typeof v === "string" && v.length > NARRATOR_CELL_MAX) {
    return `${v.slice(0, NARRATOR_CELL_MAX)}…`;
  }
  if (typeof v === "bigint") return v.toString();
  return v;
}

function preferredIdKey(keys: string[]): string | null {
  const prefers = ["code", "name", "slug", "email", "id"];
  for (const p of prefers) {
    const k = keys.find((x) => x.toLowerCase() === p);
    if (k) return k;
  }
  return null;
}

function pickNarratorKeys(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0] || {});
  if (keys.length <= NARRATOR_MAX_KEYS) return keys;

  const distinctCount = new Map<string, number>();
  for (const k of keys) {
    const s = new Set<string>();
    for (const r of rows.slice(0, 400)) {
      s.add(String(r[k] ?? ""));
      if (s.size >= 8) break;
    }
    distinctCount.set(k, s.size);
  }

  const selected: string[] = [];
  const idKey = preferredIdKey(keys);
  if (idKey) selected.push(idKey);

  const varying = keys
    .filter((k) => (distinctCount.get(k) ?? 0) > 1 && !selected.includes(k))
    .sort((a, b) => (distinctCount.get(b) ?? 0) - (distinctCount.get(a) ?? 0));
  for (const k of varying) {
    if (selected.length >= NARRATOR_MAX_KEYS) break;
    selected.push(k);
  }

  if (selected.length === 0) return keys.slice(0, NARRATOR_MAX_KEYS);
  return selected.slice(0, NARRATOR_MAX_KEYS);
}

function compactRowsForNarrator(rows: unknown[]): unknown[] {
  const sliced = rows.slice(0, Math.max(NARRATOR_MAX_ROWS * 8, 120));
  const objRows = sliced.filter((r): r is Record<string, unknown> => !!r && typeof r === "object");
  if (objRows.length === 0) {
    return sliced.slice(0, NARRATOR_MAX_ROWS).map((r) => shrinkNarratorCell(r));
  }

  const keys = pickNarratorKeys(objRows);
  const projected = objRows.map((o) => {
    const out: Record<string, unknown> = {};
    for (const k of keys) out[k] = shrinkNarratorCell(o[k]);
    return out;
  });

  const uniq: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const r of projected) {
    const key = JSON.stringify(r);
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(r);
    if (uniq.length >= NARRATOR_MAX_ROWS) break;
  }

  return uniq.length > 0 ? uniq : projected.slice(0, NARRATOR_MAX_ROWS);
}

function fullRowsForNarrator(rows: unknown[]): unknown[] {
  return rows.slice(0, NARRATOR_MAX_ROWS).map((row) => {
    if (!row || typeof row !== "object") return shrinkNarratorCell(row);
    const o = row as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      out[k] = shrinkNarratorCell(v);
    }
    return out;
  });
}

function compactNarratorPayload(data: unknown): string {
  if (!Array.isArray(data)) {
    return truncateForPrompt(data, NARRATOR_JSON_CHAR_CAP);
  }
  const full = fullRowsForNarrator(data);
  let sFull = JSON.stringify(full, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  const tailNote = data.length > NARRATOR_MAX_ROWS ? ` [+${data.length - NARRATOR_MAX_ROWS} rows]` : "";
  if (data.length <= NARRATOR_FULL_ROWS_WHEN_SHORT && sFull.length + tailNote.length <= NARRATOR_JSON_CHAR_CAP) {
    return sFull + tailNote;
  }

  const compact = compactRowsForNarrator(data);
  let s = JSON.stringify(compact, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  if (s.length + tailNote.length > NARRATOR_JSON_CHAR_CAP) {
    s = `${s.slice(0, Math.max(400, NARRATOR_JSON_CHAR_CAP - tailNote.length - 4))}…`;
  }
  return s + tailNote;
}

const GREETING_ONLY =
  /^(hi|hello|hey|thanks?|thank\s*you|ok|okay)\b/i;

const DATA_QUESTION_HEURISTIC =
  /\b(how\s*many|count|total|sum|avg|average|list|show|find|search|query|lookup|report|filter|where|top\s*\d+|records?|rows?)\b/i;

function looksLikeDataQuestion(lastUser: string, convo: string): boolean {
  const t = lastUser.trim();
  if (t.length < 4) return false;
  if (GREETING_ONLY.test(t) && t.length < 40) return false;
  if (DATA_QUESTION_HEURISTIC.test(t)) return true;
  if (/\bCOUNT\s*\(|\bcount\s*\(|\[\s*\{\s*"/i.test(convo) && t.length < 200) return true;
  return false;
}

function looksLikeJsonOrCodeFenceAnswer(s: string): boolean {
  const x = s.trim();
  if (/```(?:json)?\s*[\s\S]*```/i.test(x)) return true;
  if (/^\s*[\[{][\s\S]*"COUNT/i.test(x) && x.length < 4000) return true;
  if (x.length < 800 && /^\s*\{[^\n]+\}\s*$/.test(x) && /:/.test(x)) return true;
  return false;
}

function summarizeRowsForUser(data: unknown): string | null {
  if (!Array.isArray(data)) return null;
  if (data.length === 0) return "No records matched the query.";

  const row0 = data[0];
  if (!row0 || typeof row0 !== "object") return null;
  const r0 = row0 as Record<string, unknown>;
  const keys = Object.keys(r0);

  const labelKey = preferredIdKey(keys);
  if (labelKey) {
    const labels = data
      .map((row) => String((row as Record<string, unknown>)[labelKey] ?? ""))
      .filter(Boolean)
      .slice(0, 40);
    if (!labels.length) return null;
    const more =
      data.length > labels.length
        ? ` (${data.length - labels.length} more not listed — capped at 40.)`
        : "";
    return `**${data.length}** record(s). **${labelKey}**: ${labels.join(", ")}${more}`;
  }

  if (keys.length === 1) {
    const k = keys[0];
    const v = r0[k];
    if (/count|cnt|total/i.test(k)) {
      return `Result: **${String(v)}** (\`${k}\`).`;
    }
  }

  if (data.length === 1) {
    const parts = keys.slice(0, 6).map((k) => `**${k}**: ${String(r0[k])}`);
    return parts.join("; ");
  }

  return `**${data.length}** row(s) returned. Ask for a narrower filter if you need more detail.`;
}

function tryStripBareJsonCount(text: string): string | null {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!/^\{[\s\S]*\}$/.test(t)) return null;
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    for (const [k, v] of Object.entries(o)) {
      if (/count/i.test(k)) {
        return `Count: **${String(v)}** (\`${k}\`).`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function looksTooTechnicalAnswer(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  const techSignals = ["select ", " where ", " from ", "join ", "group by", "sql", "```"];
  let hits = 0;
  for (const k of techSignals) {
    if (t.includes(k)) hits++;
    if (hits >= 2) return true;
  }
  return false;
}

function forceUserFriendlyReply(data: unknown, modelText: string): string {
  if (looksTooTechnicalAnswer(modelText)) {
    const fromRows = summarizeRowsForUser(data);
    if (fromRows) return fromRows;
  }
  if (!looksLikeJsonOrCodeFenceAnswer(modelText)) return modelText.trim();
  const fromRows = summarizeRowsForUser(data);
  if (fromRows) return fromRows;
  const fromBare = tryStripBareJsonCount(modelText);
  if (fromBare) return fromBare;
  return modelText.trim();
}

type ClassifyJson = {
  type?: "EASY" | "HARD";
  target_model?: string;
  reason?: string;
};

const ROUTER_MODELS = ["gemma-3-12b-it", "gemma-3-4b-it"];
const SQL_MODELS = ["gemma-3-12b-it", "gemma-3-4b-it", "gemma-3-1b-it"];
const FINAL_MODELS = ["gemma-3-4b-it", "gemma-3-1b-it"];
const EASY_OUTPUT_MODELS = ["gemma-3-4b-it", "gemma-3-1b-it"];

function dedupeModelOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const t = id.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function sqlModelCandidates(routerTarget: string): string[] {
  const t = String(routerTarget || "").trim();
  const head = SQL_MODELS.includes(t) ? t : SQL_MODELS[0]!;
  return dedupeModelOrder([head, ...SQL_MODELS]);
}

const SQL_BLOCKLIST_RE =
  /\b(insert|update|delete|drop|alter|create|replace|truncate|attach|detach|pragma|vacuum|reindex|begin|commit|rollback)\b/i;

type SqlJson = {
  sql?: string;
  sqls?: string[];
  reason?: string;
};

function buildRouterSystem(tableDirectory: string): string {
  const tablesBrief = tableDirectory
    .split("\n")
    .slice(0, 12)
    .map((l) => l.replace(/^- Prisma `(\w+)` → SQLite `(\w+)`/, "$1→$2"))
    .join("; ");
  return `JSON only (no markdown): {"type":"EASY"|"HARD","target_model":"gemma-3-4b-it|gemma-3-12b-it","reason":"short"}
Tables: ${tablesBrief || "(see schema)"}
HARD: needs DB (count/list/lookup/report/filter). EASY: greeting/thanks/small talk/no DB. When unsure → HARD.
EASY→gemma-3-4b-it, HARD→gemma-3-12b-it.`;
}

const EASY_ANSWER_SYSTEM = `Helpful assistant. Short markdown (max 3 sentences). Match the user's language. No filler.`;

const SQL_SYSTEM = (schema: string, tableDirectory: string) => `Return valid JSON in one of two shapes:
{"sql":"SELECT...","reason":"short"}
or {"sqls":["SELECT...","SELECT..."],"reason":"short"}
Rules:
- Max 3 SQL statements; each must be a single SELECT or CTE-SELECT.
- SELECT/WITH SELECT only. No INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/PRAGMA.
- Use only columns and tables from the schema below; do not invent fields.
- The **last user message** (PRIMARY) drives the query. Prior chat is context only when the user refers back explicitly.
- Use SQLite table names from the directory, not Prisma model names.
- For fuzzy text search: OR across relevant text/identifier columns; do not LIKE on PK/uuid/boolean/timestamps unless the user asks about time.
- For multi-part questions (e.g. count + list): prefer \`sqls\` with separate queries.
- Never query credential/token tables (passwords, push tokens, secrets).
SQLite tables:
${tableDirectory}
Columns: use @map snake_case from schema.
---
${schema}
---`;

const FINAL_SYSTEM = `Answer in the user's language. Markdown, concise (under ~800 chars when possible). No JSON, no code fences.
Explain query results in plain language. Use tables or bullet lists when helpful. Do not expose raw SQL or internal column jargon unless the user asked for technical detail.`;

function sanitizeSql(raw: string): string {
  let sql = raw.trim();
  sql = sql.replace(/^```\w*\s*/i, "").replace(/\s*```$/i, "").trim();
  sql = sql.replace(/;+\s*$/, "").trim();
  return sql;
}

function isSafeReadSql(sql: string): boolean {
  const normalized = sql.trim();
  if (!normalized) return false;
  const statements = normalized
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  if (statements.length !== 1) return false;
  if (!/^(select|with)\b/i.test(normalized)) return false;
  if (SQL_BLOCKLIST_RE.test(normalized)) return false;
  if (sqlReferencesBlockedTable(normalized)) return false;
  return true;
}

function sqlColumnHintFromError(errText: string): string {
  const m = /no such column:\s*([A-Za-z0-9_.]+)/i.exec(errText);
  if (!m?.[1]) return "";
  return `Hint: column \`${m[1]}\` is not in the schema — use @map names from schema.prisma.`;
}

function normalizeSqlList(parsed: SqlJson | null): string[] {
  const raw = [
    ...(Array.isArray(parsed?.sqls) ? parsed!.sqls : []),
    ...(parsed?.sql ? [parsed.sql] : []),
  ];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const s = sanitizeSql(String(r || ""));
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 3) break;
  }
  return out;
}

function pickBestDataForFriendlySummary(results: unknown[]): unknown {
  for (const d of results) {
    if (Array.isArray(d) && d.length > 0) return d;
  }
  return results[0] ?? [];
}

function compactMultiQueryResults(sqls: string[], dataList: unknown[]): string {
  const entries = sqls.map((sql, i) => ({
    query: i + 1,
    sql: sql.length > 180 ? `${sql.slice(0, 180)}...` : sql,
    rows: Array.isArray(dataList[i]) ? compactRowsForNarrator(dataList[i] as unknown[]) : dataList[i],
  }));
  return truncateForPrompt(entries, NARRATOR_JSON_CHAR_CAP);
}

async function executeReadSql(sql: string): Promise<unknown> {
  if (!isSafeReadSql(sql)) {
    throw new Error("Unsafe SQL. Only a single SELECT/CTE-SELECT is allowed.");
  }
  const prisma = models as unknown as { $queryRawUnsafe: (q: string) => Promise<unknown> };
  return prisma.$queryRawUnsafe(sql);
}

export async function runAiAssistantOrchestrator(
  req: AiAssistantRequest,
): Promise<AiAssistantResponse> {
  const runId = newAiRunId();
  const requestId = req.requestId;
  const modelsUsed: string[] = [];
  const messages = Array.isArray(req.messages) ? req.messages : [];
  if (!messages.length) {
    return { replyMarkdown: "_No messages._" };
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return { replyMarkdown: "_Empty message._" };
  }

  const images = normalizeImages(req.images);
  const userCtx = JSON.stringify(req.userContext ?? {}, null, 0);
  const convo = conversationBlock(messages);
  const convoApi = tailByChars(convo, 1200);

  logAiInfo(
    runId,
    "chat.start",
    {
      userId: req.userContext?.userId,
      messageCount: messages.length,
      imageCount: images.length,
      lastUserPreview: truncStr(lastUser.content, 500),
    },
    requestId,
  );

  const imageParts = images.map((im) => ({
    inlineData: { mimeType: im.mimeType, data: im.dataBase64 },
  }));

  const schemaRaw = loadPrismaSchema();
  const schemaFull = stripSensitiveModelsFromSchema(schemaRaw);
  const tableDirectory = formatSqlTableDirectoryFromSchema(schemaRaw);
  const routerSystem = buildRouterSystem(tableDirectory);

  const classifyParts = [
    { text: `Ctx:${userCtx}\nChat:\n${convoApi}\nLast:\n${lastUser.content}` },
    ...imageParts,
  ];

  const c1 = await generateWithModelCascade({
    systemInstruction: routerSystem,
    userParts: classifyParts,
    responseMimeType: "application/json",
    temperature: 0.1,
    maxOutputTokens: 180,
    modelCandidates: ROUTER_MODELS,
  });
  modelsUsed.push(c1.modelUsed);

  const classified = extractJsonObject<ClassifyJson>(c1.text) ?? {};
  const routerSays = classified.type === "HARD" ? "HARD" : "EASY";
  const routerTarget = String(classified.target_model || "").trim();

  let effectiveType: "EASY" | "HARD" = routerSays;
  if (effectiveType === "EASY" && looksLikeDataQuestion(lastUser.content, convo)) {
    effectiveType = "HARD";
    logAiInfo(
      runId,
      "router.upgrade_hard",
      { routerWas: routerSays, lastUserPreview: truncStr(lastUser.content, 300) },
      requestId,
    );
  }

  logAiDebug(
    runId,
    "router.done",
    {
      routerModel: c1.modelUsed,
      rawRouterText: truncStr(c1.text, 4000),
      parsedType: routerSays,
      effectiveType,
      parsedTarget: routerTarget,
      parsedReason: classified.reason,
    },
    requestId,
  );

  if (effectiveType === "EASY") {
    try {
      const easyRes = await generateWithModelCascade({
        systemInstruction: EASY_ANSWER_SYSTEM,
        userParts: [{ text: `Chat:\n${convoApi}\n\nReply to the last user turn.` }, ...imageParts],
        temperature: 0.35,
        maxOutputTokens: 200,
        modelCandidates: EASY_OUTPUT_MODELS,
      });
      modelsUsed.push(easyRes.modelUsed);
      return {
        replyMarkdown: easyRes.text.trim(),
        debug: { modelUsed: modelsUsed, runId, requestId },
      };
    } catch (e) {
      logAiWarn(runId, "easy.model_error", { err: truncStr(String(e), 800) }, requestId);
      return {
        replyMarkdown:
          "The assistant is temporarily unavailable (quota or API error). Please try again with a shorter message.",
        debug: { modelUsed: modelsUsed, runId, requestId },
      };
    }
  }

  const schemaForSql = compactPrismaSchemaForSqlPrompt(schemaFull, SQL_SCHEMA_PROMPT_MAX_CHARS);
  const sqlSystem = SQL_SYSTEM(schemaForSql, tableDirectory);

  const sqlUserTextBase = `Ctx:${userCtx}

PRIMARY (SQL only for this message — ignore prior topics unless the user refers back):
"""${lastUser.content}"""

Context (reference only if PRIMARY uses pronouns or "same as before"):
${convoApi}

Write 1 SQLite SELECT, or multiple in \`sqls\` if PRIMARY has distinct intents.`;

  let lastExecError = "";

  for (let attempt = 0; attempt < 10; attempt++) {
    const correction =
      attempt === 0
        ? ""
        : `\n\nPrevious SQL failed:\n${lastExecError}\n${sqlColumnHintFromError(lastExecError)}\nReturn corrected JSON SQL aligned with the schema.`;

    const sqlRes = await generateWithModelCascade({
      systemInstruction: sqlSystem,
      userParts: [{ text: sqlUserTextBase + correction }, ...imageParts],
      responseMimeType: "application/json",
      temperature: 0.08 + attempt * 0.02,
      maxOutputTokens: 1400,
      modelCandidates: sqlModelCandidates(routerTarget),
    });
    modelsUsed.push(sqlRes.modelUsed);

    const parsed = extractJsonObject<SqlJson>(sqlRes.text);
    const sqls = normalizeSqlList(parsed);

    logAiDebug(
      runId,
      "sql.gen",
      {
        attempt,
        sqlModel: sqlRes.modelUsed,
        sqlSanitized: sqls.map((s) => truncStr(s, 3000)),
        isSafeReadSql: sqls.every((s) => isSafeReadSql(s)),
      },
      requestId,
    );

    if (!sqls.length) {
      lastExecError = String(parsed?.reason || "Model did not return sql.");
      logAiWarn(runId, "sql.empty", { attempt, lastExecError }, requestId);
      continue;
    }
    if (!sqls.every((s) => isSafeReadSql(s))) {
      const blocked = sqls.some((s) => sqlReferencesBlockedTable(s));
      lastExecError = blocked
        ? "Query references a protected table (credentials/tokens)."
        : `Invalid or unsafe SQL: ${sqls.map((s) => s.slice(0, 220)).join(" | ")}`;
      logAiWarn(runId, "sql.rejected_unsafe", { attempt, lastExecError }, requestId);
      continue;
    }

    try {
      const settled = await Promise.allSettled(sqls.map((sql) => executeReadSql(sql)));
      const failures = settled
        .map((r, idx) => ({ r, idx }))
        .filter((x): x is { r: PromiseRejectedResult; idx: number } => x.r.status === "rejected");
      if (failures.length > 0) {
        lastExecError = failures.map((f) => `Q${f.idx + 1}: ${String(f.r.reason)}`).join("\n");
        logAiWarn(
          runId,
          "sql.exec.partial_failed",
          { attempt, error: truncStr(lastExecError, 6000) },
          requestId,
        );
        continue;
      }

      const dataList = settled.map((r) => (r as PromiseFulfilledResult<unknown>).value);
      const summaryData = pickBestDataForFriendlySummary(dataList);
      const qBrief =
        lastUser.content.length > 480 ? `${lastUser.content.slice(0, 480)}…` : lastUser.content;
      const sqlBrief = sqls
        .map((s, idx) => {
          const s1 = s.length > NARRATOR_SQL_CHARS ? `${s.slice(0, NARRATOR_SQL_CHARS)}…` : s;
          return `Q${idx + 1}: ${s1}`;
        })
        .join("\n");
      const rowsBrief =
        dataList.length === 1
          ? compactNarratorPayload(dataList[0])
          : compactMultiQueryResults(sqls, dataList);
      const narrUser = `Q:${qBrief}\nSQL:\n${sqlBrief}\nRows(JSON):${rowsBrief}`;

      let replyMarkdown: string;
      try {
        const nRes = await generateWithModelCascade({
          systemInstruction: FINAL_SYSTEM,
          userParts: [{ text: narrUser }],
          temperature: 0.35,
          maxOutputTokens: 512,
          modelCandidates: FINAL_MODELS,
        });
        modelsUsed.push(nRes.modelUsed);
        replyMarkdown = nRes.text.trim();
        if (looksLikeJsonOrCodeFenceAnswer(replyMarkdown)) {
          replyMarkdown = forceUserFriendlyReply(summaryData, replyMarkdown);
        }
      } catch (ne) {
        logAiWarn(runId, "narrator.fallback", { err: truncStr(String(ne), 800) }, requestId);
        replyMarkdown =
          summarizeRowsForUser(summaryData) ??
          "Could not reach the narration model (API quota). The query may still have succeeded.";
      }
      replyMarkdown = forceUserFriendlyReply(summaryData, replyMarkdown);

      logAiInfo(
        runId,
        "chat.success",
        {
          finalModel: modelsUsed[modelsUsed.length - 1],
          resultRows: Array.isArray(summaryData) ? summaryData.length : null,
        },
        requestId,
      );

      return {
        replyMarkdown,
        debug: { modelUsed: modelsUsed, runId, requestId },
      };
    } catch (e) {
      lastExecError = e instanceof Error ? e.message : String(e);
      logAiWarn(runId, "sql.exec.error", { attempt, error: lastExecError }, requestId);
    }
  }

  logAiError(runId, "chat.sql_giveup", { attempts: 10, lastExecError, modelsUsed }, requestId);

  return {
    replyMarkdown: `Could not run a valid query after 10 attempts. Last error: \`${lastExecError}\`\n\nTry rephrasing with clearer filters or a simpler question.`,
    debug: { modelUsed: modelsUsed, runId, requestId },
  };
}
