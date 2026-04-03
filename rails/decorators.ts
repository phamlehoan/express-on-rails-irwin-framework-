import { AfterActionOptions, BeforeActionOptions } from "./railsController";

/**
 * Class decorator factory to add a before_action to a controller.
 * @example @beforeAction('requireLogin', { only: ['show'] })
 */
export function BeforeAction(handler: string, options?: BeforeActionOptions) {
  return function (constructor: Function) {
    const target = constructor as any;
    if (!Object.prototype.hasOwnProperty.call(target, "beforeActions")) {
      // Create a new array for this class, inheriting from parent if exists
      target.beforeActions = [...(target.beforeActions || [])];
    }
    target.beforeActions.push({ handler, options });
  };
}

/**
 * Class decorator factory to add an after_action to a controller.
 * @example @afterAction('logRequest')
 */
export function AfterAction(handler: string, options?: AfterActionOptions) {
  return function (constructor: Function) {
    const target = constructor as any;
    if (!Object.prototype.hasOwnProperty.call(target, "afterActions")) {
      // Create a new array for this class, inheriting from parent if exists
      target.afterActions = [...(target.afterActions || [])];
    }
    target.afterActions.push({ handler, options });
  };
}
