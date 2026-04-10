import { ApplicationJob } from "./application.job";

/**
 * Ví dụ job - chạy theo cron schedule.
 * Đăng ký trong configs/cron.ts
 */
export class ExampleJob extends ApplicationJob {
  // Tối ưu: Định nghĩa lịch chạy ngay tại đây (Convention)
  static cron = "* * * * *";

  async perform(): Promise<void> {
    console.log("[ExampleJob] Running at", new Date().toISOString());
  }
}
