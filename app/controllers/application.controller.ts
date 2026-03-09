import { Request, Response } from "express";
import { createParamsProxy, type ParamsWithModel, type ValidatorClass } from "@lib/strongParams";
import { ApiResponse } from "@lib/response";
import { FlashType } from "@configs/enum";

type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Base controller - tương tự ApplicationController trong Rails.
 * 7 REST actions: index, show, new, create, edit, update, destroy
 */
export class ApplicationController {
  declare req: Request;
  declare res: Response;

  /** I18n translate - uses res.locals.t from i18n middleware */
  protected get t(): TFunction {
    return (this.res?.locals?.t as TFunction) || ((k: string) => k);
  }

  /**
   * params - Rails style: params(Model).permit('field1', 'field2')
   * Model: class-validator class (Prisma-generated hoặc custom Validator).
   */
  get params(): (<M extends ValidatorClass>(Model: M) => ParamsWithModel<M>) {
    const data = {
      ...(this.req?.query || {}),
      ...(this.req?.body || {}),
    };
    return createParamsProxy(data as Record<string, unknown>);
  }

  /** render json: - API */
  protected render(json: any, status: number = 200) {
    this.res!.status(status).json(ApiResponse.ok(json));
  }

  /** render view - Web (tương tự Rails render) */
  protected renderView(view: string, locals?: Record<string, any>) {
    this.res!.render(view, locals);
  }

  /** redirect - tương tự Rails redirect_to */
  protected redirect(path: string) {
    this.res!.redirect(path);
  }

  /** flash - tương tự Rails flash */
  protected flash(type: FlashType, msg: Record<string, string> | string) {
    this.req!.flash(type, typeof msg === "string" ? { msg } : msg);
  }

}
