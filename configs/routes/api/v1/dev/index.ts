/**
 * Dev routes - REST + custom actions (Rails-style).
 */
import { upload } from "@configs/fileAttachment";
import { ApiV1DevController } from "@controllers/api";
import { action } from "@lib/controllerHelpers";
import { route, doc } from "@routes/helpers";
import {
  CreateItemValidator,
  EchoValidator,
  PaginationValidator,
  UpdateItemValidator,
} from "@validators/dev.validator";
import { Router } from "express";

export class DevRoute {
  private static path = Router();

  public static draw() {
    const r = this.path;
    const C = ApiV1DevController;

    // Custom routes trước (tránh /:id match "health", "echo"...)
    route(r, "get", "/health", doc("dev/health", {
      summary: "Health check",
      tags: ["Dev"],
      responses: { 200: "OK" },
    }), action(C, "health"));

    route(r, "get", "/echo", doc("dev/echo", {
      summary: "Echo (params.permit)",
      tags: ["Dev"],
      params: EchoValidator,
      responses: { 200: "OK" },
    }), action(C, "echo"));

    route(r, "get", "/me", doc("dev/me", {
      summary: "Current user",
      tags: ["Dev"],
      auth: true,
      responses: { 200: "OK", 403: "Unauthorized" },
    }), action(C, "me"));

    route(r, "post", "/upload", doc("dev/upload", {
      summary: "File upload",
      tags: ["Dev"],
      file: true,
      responses: { 200: "OK" },
    }), upload.single("file"), action(C, "upload"));

    route(r, "get", "/errors/not-found", doc("dev/errors/not-found", {
      summary: "Example NotFoundError",
      tags: ["Dev"],
      responses: { 404: "Not Found" },
    }), action(C, "errorNotFound"));

    route(r, "get", "/errors/bad-request", doc("dev/errors/bad-request", {
      summary: "Example BadRequestError",
      tags: ["Dev"],
      responses: { 400: "Bad Request" },
    }), action(C, "errorBadRequest"));

    // REST
    route(r, "get", "/", doc("dev/", {
      summary: "List items (index)",
      tags: ["Dev"],
      params: PaginationValidator,
      responses: { 200: "OK" },
    }), action(C, "index"));

    route(r, "get", "/:id", doc("dev/:id", {
      summary: "Show item",
      tags: ["Dev"],
      responses: { 200: "OK" },
    }), action(C, "show"));

    route(r, "post", "/", doc("dev/create", {
      summary: "Create item",
      tags: ["Dev"],
      body: CreateItemValidator,
      responses: { 201: "Created", 422: "Validation failed" },
    }), action(C, "create"));

    route(r, "put", "/:id", doc("dev/:id/update", {
      summary: "Update item",
      tags: ["Dev"],
      body: UpdateItemValidator,
      responses: { 200: "OK" },
    }), action(C, "update"));

    route(r, "delete", "/:id", doc("dev/:id/destroy", {
      summary: "Destroy item",
      tags: ["Dev"],
      responses: { 200: "OK" },
    }), action(C, "destroy"));

    return r;
  }
}
