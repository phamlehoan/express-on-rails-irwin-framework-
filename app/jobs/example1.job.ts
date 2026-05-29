import { ApplicationJob } from "./application.job";

/**
 * Ví dụ job theo lịch — tắt/bật tại Admin → Background Jobs → Scheduled jobs.
 */
export class ExampleJob1 extends ApplicationJob {
  static cron = "0 0 * * *";

  async perform(isPerformLater: boolean): Promise<void> {
    if (isPerformLater) {
      console.log(
        "[ExampleJob1] Xử lý perform Later ",
        new Date().toISOString(),
      );
    } else {
      console.log("[ExampleJob1] Xử lý perform ", new Date().toISOString());
    }
  }
}
