import { User } from "@db";
import models from "@models";
import { AfterAction, RailsController } from "ts-rails";
import { Authenticatable } from "./concerns/authenticatable";
import { Rescuable } from "./concerns/rescuable";

/**
 * Base controller - tương tự ApplicationController trong Rails.
 * Kế thừa các helper methods từ RailsController và là nơi để thêm
 * các before_action hoặc helper chung cho toàn bộ ứng dụng.
 */
type AuthenticatableMethods = typeof Authenticatable;
type RescuableMethods = typeof Rescuable;

export interface ApplicationController
  extends AuthenticatableMethods, RescuableMethods {}

@AfterAction("logActionCompletion")
export class ApplicationController extends RailsController {
  protected get models() {
    return models;
  }

  /**
   * Set a flash message.
   * @param type - The type of the flash message (e.g., "errors", "success").
   * @param msg - The message content.
   */
  protected flash(type: string, msg: Record<string, string> | string) {
    this.req.flash(type, typeof msg === "string" ? { msg } : msg);
  }

  /**
   * Lấy user hiện tại từ request (đã được middleware gán).
   */
  protected get currentUser(): (User & { permissions?: string[] }) | undefined {
    return this.req.user || undefined;
  }

  /**
   * A before_action to ensure a user is logged in.
   * Halts the request chain by returning `false` if the user is not authenticated.
   */
  protected requireLogin(): boolean {
    // Bây giờ TypeScript đã nhận diện được authenticateUser nhờ Declaration Merging
    return this.authenticateUser();
  }

  /**
   * An example after_action to log when an action completes.
   */
  protected logActionCompletion() {
    const { logger } = require("ts-rails");
    logger.debug(`Action completed for request: ${this.req.requestId}`);
  }
}
