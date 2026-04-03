/**
 * Logger - tương tự Rails.logger.
 */
import { RailsApplication } from "./railsApplication";

/** Interface cho Logger Adapter. */
export interface LoggerAdapter {
  info(obj: object, msg?: string): void;
  info(msg: string, ...args: any[]): void;
  warn(obj: object, msg?: string): void;
  warn(msg: string, ...args: any[]): void;
  error(obj: object, msg?: string): void;
  error(msg: string, ...args: any[]): void;
  debug(obj: object, msg?: string): void;
  debug(msg: string, ...args: any[]): void;
}

/**
 * Logger instance mà các thành phần của framework sẽ sử dụng.
 * Nó sẽ ủy quyền cho LoggerAdapter đã được cấu hình trong RailsApplication.
 */
export const logger: LoggerAdapter = {
  info: (...args: any[]) =>
    (RailsApplication.loggerAdapter?.info as any)?.apply(
      RailsApplication.loggerAdapter,
      args,
    ),
  warn: (...args: any[]) =>
    (RailsApplication.loggerAdapter?.warn as any)?.apply(
      RailsApplication.loggerAdapter,
      args,
    ),
  error: (...args: any[]) =>
    (RailsApplication.loggerAdapter?.error as any)?.apply(
      RailsApplication.loggerAdapter,
      args,
    ),
  debug: (...args: any[]) =>
    (RailsApplication.loggerAdapter?.debug as any)?.apply(
      RailsApplication.loggerAdapter,
      args,
    ),
};
