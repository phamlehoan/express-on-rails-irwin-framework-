import { FlashType } from "@configs/enum";
import { AfterAction, RailsController } from "@lib";

/**
 * Base controller - tương tự ApplicationController trong Rails.
 * Kế thừa các helper methods từ RailsController và là nơi để thêm
 * các before_action hoặc helper chung cho toàn bộ ứng dụng.
 */
@AfterAction("logActionCompletion")
export class ApplicationController extends RailsController {
  /**
   * Set a flash message.
   * @param type - The type of the flash message (e.g., "errors", "success").
   * @param msg - The message content.
   */
  protected flash(type: string, msg: Record<string, string> | string) {
    this.req.flash(type, typeof msg === "string" ? { msg } : msg);
  }

  /**
   * A before_action to ensure a user is logged in.
   * Halts the request chain by returning `false` if the user is not authenticated.
   */
  protected requireLogin(): boolean {
    if (!this.currentUser) {
      const isApi = this.req.originalUrl.includes("/api");
      if (isApi) {
        // For APIs, it's better to throw an error that the global handler can catch.
        // This keeps the response format consistent.
        this.res
          .status(401)
          .json({ success: false, error: this.t("flash.login_first") });
      } else {
        this.flash(FlashType.Errors, { msg: this.t("flash.login_first") });
        this.redirect("/auth");
      }
      return false; // Stop the action chain
    }
    return true; // Continue
  }

  /**
   * An example after_action to log when an action completes.
   */
  protected logActionCompletion() {
    const { logger } = require("@lib/logger");
    logger.debug(`Action completed for request: ${this.req.requestId}`);
  }
}
