/**
 * Cron jobs - tương tự Rails lib/tasks/scheduler.rake hoặc whenever gem.
 * Đăng ký các job chạy theo lịch.
 */
import { ExampleJob } from "@jobs/example.job";
import cron from "node-cron";
import env from "../env";

let isStarted = false;

export function startCronJobs() {
  if (isStarted) return;
  if (env.nodeEnv !== "development" && env.nodeEnv !== "production") return;

  // Mỗi phút - ví dụ
  cron.schedule("* * * * *", () => {
    new ExampleJob().perform();
  });

  // Có thể thêm: cleanup, report, sync...
  // cron.schedule("0 0 * * *", () => new DailyReportJob().perform());

  isStarted = true;
  const { logger } = require("@lib/logger");
  logger.info("Cron jobs started");
}
