import { User } from "@prisma/client";
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
   * Lấy user hiện tại từ request (đã được middleware gán).
   */
  protected get currentUser(): (User & { permissions?: string[] }) | undefined {
    return this.req.user || undefined;
  }

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
  protected get params() {
    const data = { ...this.req.params, ...this.req.query, ...this.req.body };
    return createParamsProxy(data);
  }

  /**
   * Render view với locals mặc định (bao gồm currentUser)
   */
  protected render(view: string, locals: Record<string, any> = {}) {
    this.res.render(view, {
      currentUser: this.currentUser,
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
