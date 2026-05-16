import { ApiV1AiAssistantController } from "@controllers/api/v1/aiAssistant.controller";
import { action, RailsRoute } from "ts-rails";

export class ApiV1AiAssistantRoute extends RailsRoute {
  public draw() {
    this.post(
      "/assistant/chat",
      action(ApiV1AiAssistantController, "chat"),
    );
  }
}
