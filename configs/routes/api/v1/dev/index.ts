/**
 * Dev routes - REST + custom actions (Rails-style).
 */
import { ApiV1DevController } from "@controllers/api";
import { fileUploader } from "@lib";
import {
  CreateItemValidator,
  EchoValidator,
  PaginationValidator,
  UpdateItemValidator,
} from "@validators/dev.validator";
import { action, RailsRoute, RestActions } from "ts-rails";

export class ApiV1DevRoute extends RailsRoute {
  public draw() {
    this.get("/echo", action(ApiV1DevController, "echo"), {
      document: {
        summary: "Echo (params.permit)",
        tags: ["Dev System"],
        params: EchoValidator,
      },
    });

    this.get("/me", action(ApiV1DevController, "me"), {
      document: {
        summary: "Current user",
        tags: ["Dev System"],
        auth: true,
        responses: { 200: "OK", 403: "Unauthorized" },
      },
    });

    this.post(
      "/upload",
      [fileUploader.single("file"), action(ApiV1DevController, "upload")],
      {
        document: {
          summary: "File upload",
          tags: ["Dev"],
          file: true,
        },
      },
    );

    this.get("/errors/not-found", action(ApiV1DevController, "errorNotFound"), {
      document: {
        summary: "Example NotFoundError",
        tags: ["Dev System"],
        responses: { 404: "Not Found" },
      },
    });

    this.get(
      "/errors/bad-request",
      action(ApiV1DevController, "errorBadRequest"),
      {
        document: {
          summary: "Example BadRequestError",
          tags: ["Dev System"],
          responses: { 400: "Bad Request" },
        },
      },
    );

    // REST
    this.get(action(ApiV1DevController, "index"), {
      document: {
        summary: "List items (index)",
        tags: ["Dev"],
        params: PaginationValidator,
      },
    });

    this.post(action(ApiV1DevController, "create"), {
      document: {
        summary: "Create item",
        tags: ["Dev"],
        body: CreateItemValidator,
        responses: { 201: "Created", 422: "Validation failed" },
      },
    });

    this.put("/:id", action(ApiV1DevController, "update"), {
      document: {
        summary: "Update item",
        tags: ["Dev"],
        body: UpdateItemValidator,
      },
    });

    this.resource(ApiV1DevController, {
      document: {
        tags: ["Dev"],
      },
      only: [RestActions.Show, RestActions.Destroy],
    });
  }
}
