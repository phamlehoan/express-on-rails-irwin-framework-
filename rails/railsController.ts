import { Request, Response } from "express";
import { Server as SocketServer } from "socket.io";
import { ApiResponse } from "./response";
import { createParamsProxy } from "./strongParams";

export interface BeforeActionOptions {
  only?: string[];
  except?: string[];
}

export interface BeforeActionConfig {
  handler: string; // Method name
  options?: BeforeActionOptions;
}

export interface AfterActionOptions {
  only?: string[];
  except?: string[];
}

export interface AfterActionConfig {
  handler: string; // Method name
  options?: AfterActionOptions;
}

export class RailsController {
  public req!: Request;
  public res!: Response;

  /**
   * Socket.io instance.
   * Use this to emit events: this.io.emit('event', data)
   */
  protected get io(): SocketServer {
    return this.req.app.get("io");
  }

  /**
   * Helper t() cho i18n
   */
  protected get t(): (
    key: string,
    options?: Record<string, unknown>,
  ) => string {
    return (
      (this.res.locals?.t as (
        key: string,
        options?: Record<string, unknown>,
      ) => string) || ((k: string) => k)
    );
  }

  /**
   * Helper params giống Rails.
   * Merge params, query, body lại làm một.
   * @example await this.params(UserValidator).permit('email', 'password')
   */
  protected get params(): ReturnType<typeof createParamsProxy> {
    // Memoize params proxy trên request để tránh tạo lại nhiều lần trong cùng một action
    if (!(this.req as any)._irwinParamsProxy) {
      const data = { ...this.req.params, ...this.req.query, ...this.req.body };
      (this.req as any)._irwinParamsProxy = createParamsProxy(data);
    }
    return (this.req as any)._irwinParamsProxy;
  }

  /**
   * Render view với locals mặc định (bao gồm currentUser)
   */
  protected render(view: string, locals: Record<string, any> = {}) {
    this.res.render(view, {
      currentUser: this.req.user || null,
      ...this.res.locals,
      ...locals,
    });
  }

  /**
   * Render JSON response for APIs.
   */
  protected renderJson(data: any, status: number = 200) {
    this.res.status(status).json(ApiResponse.ok(data));
  }

  /**
   * Redirect to a given path.
   */
  protected redirect(path: string) {
    this.res.redirect(path);
  }
}
