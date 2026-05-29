import env from "@configs/env";
import {
  runAiAssistantOrchestrator,
  type ChatImage,
  type ChatMessage,
} from "@lib/ai/aiAssistantOrchestrator";
import { ApiResponse } from "ts-rails";
import { ApiV1Controller } from "./apiV1.controller";

function asMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatMessage[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const role = o.role === "assistant" ? "assistant" : o.role === "user" ? "user" : null;
    const content = typeof o.content === "string" ? o.content : null;
    if (!role || content === null) return null;
    out.push({ role, content });
  }
  return out.length ? out : null;
}

function asImages(raw: unknown): ChatImage[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: ChatImage[] = [];
  for (const row of raw.slice(0, 4)) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const mimeType = typeof o.mimeType === "string" ? o.mimeType : "image/png";
    const dataBase64 =
      typeof o.dataBase64 === "string"
        ? o.dataBase64
        : typeof o.base64 === "string"
          ? o.base64
          : "";
    if (!dataBase64) continue;
    out.push({ mimeType, dataBase64 });
  }
  return out.length ? out : undefined;
}

export class ApiV1AiAssistantController extends ApiV1Controller {
  /** POST /ai/chat */
  async chat() {
    if (!env.googleAiApiKey?.trim()) {
      return this.res
        .status(503)
        .json(ApiResponse.error("AI assistant is not configured (GOOGLE_AI_API_KEY)."));
    }

    const b = (this.req.body || {}) as Record<string, unknown>;
    const messages = asMessages(b.messages);
    if (!messages) {
      return this.res.status(422).json(ApiResponse.error("Invalid or empty messages array."));
    }

    const images = asImages(b.images);
    const user = this.currentUser;

    try {
      const result = await runAiAssistantOrchestrator({
        messages,
        images,
        userContext: {
          userId: user?.id,
          email: user?.email,
        },
        requestId: this.req.requestId,
      });

      if (env.appEnv !== "development") {
        delete result.debug;
      }

      this.renderJson(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return this.res.status(502).json(ApiResponse.error(msg));
    }
  }
}
