/**
 * Base class cho jobs - tương tự ActiveJob trong Rails.
 * `static cron` → node-cron (không ghi DB; pause/run trong Admin → Jobs).
 * `performLater()` → hàng đợi tạm (xóa khỏi DB khi xong).
 */
import { enqueueJobClass } from "@lib/jobs/enqueueJob";

export abstract class ApplicationJob {
  static cron?: string;

  abstract perform(...args: unknown[]): Promise<void>;

  async performLater(...args: unknown[]): Promise<void> {
    const jobClass = (this.constructor as { name: string }).name;
    await enqueueJobClass(jobClass, args);
  }
}
