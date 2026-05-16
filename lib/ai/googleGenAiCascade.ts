import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type Part,
} from "@google/generative-ai";
import env from "@configs/env";
import { DEFAULT_GOOGLE_AI_MODEL_FALLBACK } from "./defaultModelFallback";

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

/** Lỗi HTTP tạm thời / quota — retry cùng model rồi mới nhảy model sau. */
const TRANSIENT_HTTP = new Set([408, 429, 500, 502, 503, 504]);

const MAX_ATTEMPTS_SAME_MODEL = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Google 429 thường kèm "retry in Ns" — chờ giảm dồn TPM trước khi thử model khác. */
function parse429RetryDelayMs(err: unknown): number {
  const s = `${String(err)}`;
  const m = /retry in ([\d.]+)s/i.exec(s);
  if (m) {
    const sec = parseFloat(m[1]);
    if (Number.isFinite(sec) && sec > 0) {
      return Math.min(Math.round(sec * 1000) + 500, 55_000);
    }
  }
  const m2 = /"retryDelay"\s*:\s*"(\d+)s"/i.exec(s);
  if (m2) {
    const sec = parseInt(m2[1], 10);
    if (Number.isFinite(sec) && sec > 0) {
      return Math.min(sec * 1000 + 500, 55_000);
    }
  }
  return 14_000;
}

function modelOrder(explicitCandidates?: string[]): string[] {
  if (explicitCandidates && explicitCandidates.length > 0) {
    return explicitCandidates.map((s) => s.trim()).filter(Boolean);
  }
  if (env.googleAiModelFallback.length > 0) return env.googleAiModelFallback;
  return [...DEFAULT_GOOGLE_AI_MODEL_FALLBACK];
}

/** GoogleGenerativeAIFetchError gắn status từ response. */
function httpStatusFromGoogleError(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const v = (err as { status: unknown }).status;
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  }
  return undefined;
}

function isFatalAuthError(err: unknown): boolean {
  const st = httpStatusFromGoogleError(err);
  if (st === 401 || st === 403) return true;
  const s = `${String(err)}\n${JSON.stringify(err)}`;
  return /invalid api key|API key not valid|PERMISSION_DENIED/i.test(s);
}

function isJsonModeUnsupportedError(err: unknown): boolean {
  const s = `${String(err)}\n${JSON.stringify(err)}`;
  return /JSON mode is not enabled/i.test(s);
}

/** Sau khi hết retry cùng model: có nên thử model kế trong danh sách không. */
function shouldAdvanceToNextModel(err: unknown): boolean {
  if (isFatalAuthError(err)) return false;

  const st = httpStatusFromGoogleError(err);
  if (st === 404) return true;
  if (st !== undefined && TRANSIENT_HTTP.has(st)) return true;

  const s = `${String(err)}\n${JSON.stringify(err)}`;
  if (/invalid api key|API key not valid|PERMISSION_DENIED/i.test(s)) return false;
  return (
    /429|RESOURCE_EXHAUSTED|quota|rate limit|50[0-4]\b|UNAVAILABLE|overloaded|404|not found|NOT_FOUND|EAI_AGAIN|Internal error/i.test(
      s,
    )
  );
}

export type GenAiUserPart = { text?: string; inlineData?: { mimeType: string; data: string } };

/**
 * Gemma (và một số model) trên API không bật developer/system instruction — chỉ gộp vào prompt user.
 */
function inlineSystemInstruction(
  systemInstruction: string,
  userParts: GenAiUserPart[],
): GenAiUserPart[] {
  const sys = systemInstruction.trim();
  if (!sys) return [...userParts];

  const firstTextIdx = userParts.findIndex((p) => typeof p.text === "string");
  if (firstTextIdx === -1) {
    return [{ text: `${sys}\n\n` }, ...userParts];
  }
  const merged = [...userParts];
  const cur = merged[firstTextIdx]!;
  merged[firstTextIdx] = {
    ...cur,
    text: `${sys}\n\n---\n\n${cur.text ?? ""}`,
  };
  return merged;
}

export async function generateWithModelCascade(params: {
  systemInstruction: string;
  userParts: GenAiUserPart[];
  modelCandidates?: string[];
  responseMimeType?: "application/json" | "text/plain";
  temperature?: number;
  /** Cap output tokens (TPM); omitted when unset. */
  maxOutputTokens?: number;
}): Promise<{ text: string; modelUsed: string }> {
  const key = env.googleAiApiKey?.trim();
  if (!key) throw new Error("GOOGLE_AI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(key);
  const models = modelOrder(params.modelCandidates);
  let lastError: unknown;

  for (const modelName of models) {
    let disableJsonModeForModel = false;
    for (let sameModelAttempt = 0; sameModelAttempt < MAX_ATTEMPTS_SAME_MODEL; sameModelAttempt++) {
      try {
        const userParts = inlineSystemInstruction(params.systemInstruction, params.userParts);
        const useJsonMode =
          params.responseMimeType === "application/json" && !disableJsonModeForModel;

        const model = genAI.getGenerativeModel({
          model: modelName,
          safetySettings,
          generationConfig: {
            temperature: params.temperature ?? 0.25,
            ...(params.maxOutputTokens != null && params.maxOutputTokens > 0
              ? { maxOutputTokens: params.maxOutputTokens }
              : {}),
            ...(params.responseMimeType && useJsonMode
              ? { responseMimeType: params.responseMimeType }
              : {}),
          },
        });

        const parts: Part[] = userParts.map((p) => {
          if (p.inlineData) {
            return {
              inlineData: {
                mimeType: p.inlineData.mimeType,
                data: p.inlineData.data,
              },
            };
          }
          return { text: p.text ?? "" };
        });

        const res = await model.generateContent({
          contents: [{ role: "user", parts }],
        });
        const text = res.response.text();
        if (!text?.trim()) {
          lastError = new Error("Empty model response");
          if (sameModelAttempt < MAX_ATTEMPTS_SAME_MODEL - 1) {
            await sleep(250 * (sameModelAttempt + 1));
            continue;
          }
          break;
        }
        return { text: text.trim(), modelUsed: modelName };
      } catch (e) {
        lastError = e;
        if (isFatalAuthError(e)) throw e;
        if (
          params.responseMimeType === "application/json" &&
          isJsonModeUnsupportedError(e) &&
          !disableJsonModeForModel
        ) {
          disableJsonModeForModel = true;
          continue;
        }

        const st = httpStatusFromGoogleError(e);
        // 429 TPM/quota: avoid burning retries on the same model — advance cascade.
        const canRetrySame =
          sameModelAttempt < MAX_ATTEMPTS_SAME_MODEL - 1 &&
          st !== undefined &&
          TRANSIENT_HTTP.has(st) &&
          st !== 429;

        if (canRetrySame) {
          await sleep(400 + sameModelAttempt * 700);
          continue;
        }

        if (shouldAdvanceToNextModel(e)) {
          if (st === 429) {
            await sleep(parse429RetryDelayMs(e));
          }
          break;
        }
        throw e;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
