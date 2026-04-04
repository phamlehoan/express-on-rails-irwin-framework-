import env from "@configs/env";
import * as jobs from "@jobs";
import { getJobAdapter } from "@lib";
import cron from "node-cron";
import { RailsApplication } from "ts-rails";

let isCronStarted = false;

/**
 * Khởi chạy các tác vụ định kỳ (Cron Jobs)
 */
async function startCronJobs() {
  if (isCronStarted) return;
  if (env.nodeEnv !== "development" && env.nodeEnv !== "production") return;

  // 1. Quét các Job định nghĩa cứng trong Code (Convention)
  RailsApplication.jobClasses.forEach((Klass: any) => {
    if (Klass.cron) {
      cron.schedule(Klass.cron, () => new Klass().perform());
    }
  });

  // // 2. Quét các Job cấu hình trong Database (Dynamic)
  // try {
  //   // Giả sử anh có table CronJob: { id, jobClassName, schedule, active }
  //   const dynamicJobs = await (models as any).cronJob.findMany({
  //     where: { active: true },
  //   });

  //   dynamicJobs.forEach((config: any) => {
  //     const Klass = (jobs as any)[config.jobClassName];
  //     if (Klass) {
  //       cron.schedule(config.schedule, () => {
  //         RailsApplication.loggerAdapter?.info(
  //           `[Dynamic Cron] Running ${config.jobClassName}`,
  //         );
  //         new Klass().perform();
  //       });
  //     }
  //   });
  // } catch (e) {
  //   // Bỏ qua nếu chưa chạy migration hoặc không dùng DB cron
  // }

  isCronStarted = true;
  RailsApplication.loggerAdapter?.info("Cron jobs started via auto-discovery");
}

export function initializeJobs() {
  // Register all job classes for BullMQ
  RailsApplication.jobClasses = Object.values(jobs) as any;

  // Triển khai Adapter
  (RailsApplication as any).jobAdapter = getJobAdapter();

  // Tự động chạy Cron Jobs nếu không phải môi trường serverless hoặc console
  if (
    !process.env.LAMBDA_TASK_ROOT &&
    !process.env.VERCEL &&
    !process.env.IS_OFFLINE &&
    !process.env.IRWIN_CONSOLE
  ) {
    startCronJobs().catch(console.error);
  }
}
