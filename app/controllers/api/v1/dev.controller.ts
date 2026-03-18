import {
  BadRequestError,
  buildPaginatedResponse,
  NotFoundError,
  parsePagination,
} from "@lib";
import {
  CreateItemValidator,
  EchoValidator,
  PaginationValidator,
  UpdateItemValidator,
} from "@validators/dev.validator";
import { ApiV1Controller } from ".";

/**
 * Dev API Controller - ví dụ REST + custom actions (Rails-style).
 * 7 REST actions: index, show, new, create, edit, update, destroy
 */
export class ApiV1DevController extends ApiV1Controller {
  // --- REST actions ---
  async index() {
    const permitted = await this.params(PaginationValidator).permit(
      "page",
      "perPage",
    );
    const { page, perPage, skip } = parsePagination(permitted as any);
    const allItems = Array.from({ length: 50 }, (_, i) => ({
      id: String(i + 1),
      name: `Item ${i + 1}`,
    }));
    const data = allItems.slice(skip, skip + perPage);
    const result = buildPaginatedResponse(data, allItems.length, {
      page,
      perPage,
    });
    this.renderJson(result);
  }

  async show() {
    const id = this.req.params.id;
    const item = {
      id,
      name: `Item ${id}`,
      createdAt: new Date().toISOString(),
    };
    this.renderJson(item);
  }

  async create() {
    const payload = await this.params(CreateItemValidator).permit(
      "name",
      "description",
    );
    const item = {
      id: String(Date.now()),
      ...payload,
      createdAt: new Date().toISOString(),
    };
    this.renderJson(item, 201);
  }

  async update() {
    const id = this.req.params.id;
    const payload = await this.params(UpdateItemValidator).permit(
      "name",
      "description",
    );
    const item = {
      id,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.renderJson(item);
  }

  async destroy() {
    this.renderJson({ deleted: true });
  }

  // --- Custom actions (ví dụ) ---
  async echo() {
    const { message, delay } = await this.params(EchoValidator).permit(
      "message",
      "delay",
    );
    if ((delay ?? 0) > 0) await new Promise((r) => setTimeout(r, delay ?? 0));
    this.renderJson({ message, echoedAt: new Date().toISOString() });
  }

  async health() {
    this.renderJson({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  async me() {
    this.renderJson({
      user: this.req.user,
      requestId: (this.req as any).requestId,
    });
  }

  async upload() {
    const { validateFileUpload } = await import("@lib");
    validateFileUpload(this.req.file);
    this.renderJson({
      filename: this.req.file!.originalname,
      size: this.req.file!.size,
      mimetype: this.req.file!.mimetype,
    });
  }

  async errorNotFound() {
    throw new NotFoundError("Resource not found");
  }

  async errorBadRequest() {
    throw new BadRequestError("Invalid request");
  }
}
