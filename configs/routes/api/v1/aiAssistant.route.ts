import { ApiV1AiAssistantController } from "@controllers/api/v1/aiAssistant.controller";
import { action, RailsRoute } from "ts-rails";

const AI_CHAT_REQUEST_BODY = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["messages"],
        properties: {
          messages: {
            type: "array",
            items: {
              type: "object",
              required: ["role", "content"],
              properties: {
                role: { type: "string", enum: ["user", "assistant"] },
                content: { type: "string" },
              },
            },
          },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                mimeType: { type: "string", example: "image/png" },
                dataBase64: { type: "string" },
              },
            },
          },
        },
      },
      example: {
        messages: [{ role: "user", content: "Hello" }],
      },
    },
  },
};

export class ApiV1AiAssistantRoute extends RailsRoute {
  public draw() {
    this.post(
      "/chat",
      action(ApiV1AiAssistantController, "chat"),
      {
        document: {
          summary: "AI assistant chat (Gemini)",
          tags: ["AI"],
          auth: true,
          requestBody: AI_CHAT_REQUEST_BODY,
          responses: {
            200: "OK — orchestrator result (reply, model, optional debug in dev)",
            422: "Invalid messages array",
            502: "Upstream AI error",
            503: "AI not configured (GOOGLE_AI_API_KEY)",
          },
        },
      },
    );
  }
}
