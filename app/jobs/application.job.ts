/**
 * Base class cho jobs - tương tự ActiveJob trong Rails.
 * Dùng node-cron cho scheduled tasks.
 */

export abstract class ApplicationJob {
  abstract perform(...args: unknown[]): Promise<void>;

  async performLater(...args: unknown[]): Promise<void> {
    setImmediate(() => this.perform(...args));
  }
}
