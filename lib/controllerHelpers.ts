import { Request, Response, NextFunction } from "express";

/**
 * action - dispatch tới controller action, tự động rescue (catch → next).
 * Tương tự Rails: def index; end + rescue_from ở class level.
 *
 * Route: action(controller, "index") - mỗi request dùng controller instance riêng.
 * Nếu dùng singleton controller, cần đảm bảo không concurrent (hoặc dùng factory).
 */
export function action(controller: any, actionName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ctrl = typeof controller === "function" ? new controller() : controller;
    ctrl.req = req;
    ctrl.res = res;
    const fn = ctrl[actionName];
    if (typeof fn !== "function") {
      return next(new Error(`Action ${actionName} not found`));
    }
    Promise.resolve(fn.call(ctrl)).catch(next);
  };
}
