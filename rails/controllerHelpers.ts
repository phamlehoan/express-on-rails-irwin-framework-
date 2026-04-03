import { NextFunction, Request, RequestHandler, Response } from "express";
import {
  AfterActionConfig,
  AfterActionOptions,
  BeforeActionConfig,
  BeforeActionOptions,
} from "./railsController";

// Overload signatures
export function action(
  Klass: new (...args: any[]) => any,
  actionName: string,
): RequestHandler;
export function action(Klass: new (...args: any[]) => any): RequestHandler;

/**
 * Creates a request handler from a Controller or Middleware class.
 * - For a Controller: action(MyController, "index") -> new MyController().index
 * - For a Middleware: action(MyMiddleware) -> new MyMiddleware().execute(req, res, next)
 */
export function action(
  Klass: new (...args: any[]) => any,
  actionName = "execute",
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const instance = new Klass();
    (instance as any).req = req;
    (instance as any).res = res;

    try {
      // --- Rails-style before_action ---
      const beforeResult = await runFilters(
        Klass,
        instance,
        actionName,
        "beforeActions",
      );
      if (beforeResult === false) {
        return; // Halt chain
      }

      try {
        // --- Main action ---
        if (
          actionName === "execute" &&
          typeof instance.execute === "function" &&
          instance.execute.length >= 3 // Check for (req, res, next)
        ) {
          await instance.execute(req, res, next);
        } else {
          await (instance as any)[actionName]();
        }
      } finally {
        // --- Rails-style after_action ---
        // Runs even if the main action throws an error.
        await runFilters(Klass, instance, actionName, "afterActions");
      }
    } catch (error) {
      next(error);
    }
  };
}

async function runFilters(
  Klass: any,
  instance: any,
  actionName: string,
  filterType: "beforeActions" | "afterActions",
): Promise<boolean> {
  const filters: (BeforeActionConfig | AfterActionConfig)[] =
    Klass[filterType] || [];

  for (const filter of filters) {
    const handlerName = filter.handler;
    const options = filter.options as BeforeActionOptions | AfterActionOptions;
    const only = options?.only;
    const except = options?.except;

    const shouldRun =
      actionName !== "execute" &&
      ((!only && !except) ||
        (only && only.includes(actionName)) ||
        (except && !except.includes(actionName)));

    if (shouldRun) {
      if (typeof (instance as any)[handlerName] !== "function") {
        throw new Error(
          `Filter handler "${handlerName}" is not a valid method on ${Klass.name}`,
        );
      }
      const result = await (instance as any)[handlerName]();
      if (filterType === "beforeActions" && result === false) return false;
    }
  }
  return true;
}
