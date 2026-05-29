import { ApplicationJob } from "./application.job";

/**
 * Ví dụ job theo lịch — tắt/bật tại Admin → Background Jobs → Scheduled jobs.
 */
export class ExampleJob extends ApplicationJob {
  static cron = "*/5 * * * *";

  async perform(...args: unknown[]): Promise<void> {
    const fromQueue = args.length > 0;
    if (fromQueue) {
      console.log(
        "[ExampleJob] Perform Later Running at",
        new Date().toISOString(),
        args,
      );
    } else {
      console.log("[ExampleJob] Running at", new Date().toISOString());
    }
  }
}
