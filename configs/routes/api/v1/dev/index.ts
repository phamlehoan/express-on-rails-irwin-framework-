/**
 * Dev routes - REST + custom actions (Rails-style).
 */
import { upload } from "@configs/fileAttachment";
import { ApiV1DevController } from "@controllers/api";
import { action, RailsRoute } from "@lib";
import {
  CreateItemValidator,
  EchoValidator,
  PaginationValidator,
  UpdateItemValidator,
} from "@validators/dev.validator";

export class ApiV1DevRoute extends RailsRoute {
  public draw() {
    // Custom routes trước (tránh /:id match "health", "echo"...)
    this.get("/health", action(ApiV1DevController, "health"), {
      document: {
        summary: "Health check",
        tags: ["Dev"],
      },
    });

    this.get("/echo", action(ApiV1DevController, "echo"), {
      document: {
        summary: "Echo (params.permit)",
        tags: ["Dev"],
        params: EchoValidator,
      },
    });

    this.get("/me", action(ApiV1DevController, "me"), {
      document: {
        summary: "Current user",
        tags: ["Dev"],
        auth: true,
        responses: { 200: "OK", 403: "Unauthorized" },
      },
    });

    this.post(
      "/upload",
      [upload.single("file"), action(ApiV1DevController, "upload")],
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
        tags: ["Dev"],
        responses: { 404: "Not Found" },
      },
    });

    this.get(
      "/errors/bad-request",
      action(ApiV1DevController, "errorBadRequest"),
      {
        document: {
          summary: "Example BadRequestError",
          tags: ["Dev"],
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

    this.get("/:id", action(ApiV1DevController, "show"), {
      document: {
        summary: "Show item",
        tags: ["Dev"],
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

    this.delete("/:id", action(ApiV1DevController, "destroy"), {
      document: {
        summary: "Destroy item",
        tags: ["Dev"],
      },
    });
  }
}
