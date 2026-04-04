import env from "@configs/env";
import { Worker } from "bullmq";
import { RailsApplication } from "ts-rails";

/**
 * Logic thực thi Worker cho BullMQ
 */
export function setupBullMQWorker() {
  const connection = { host: env.redisHost, port: env.redisPort };

  const registry = RailsApplication.jobClasses.reduce((acc, Klass) => {
    acc[Klass.name] = Klass;
    return acc;
  }, {} as any);

  const worker = new Worker(
    "rails-jobs",
    async (job: any) => {
      const JobClass = registry[job.name];
      if (JobClass) await new JobClass().perform(...job.data);
    },
    { connection },
  );

  let isRedisDown = false;

  worker.on("error", (err: any) => {
    if (err.code === "ECONNREFUSED" && !isRedisDown) {
      RailsApplication.loggerAdapter?.error(
        "[BullMQ] Redis connection failed.",
      );
      isRedisDown = true;
    }
  });

  worker.on("ready", () => {
    if (isRedisDown) {
      RailsApplication.loggerAdapter?.info(
        "[BullMQ] Redis connection restored.",
      );
      isRedisDown = false;
    }
  });

  worker.on("failed", (job: any, err: Error) =>
    RailsApplication.loggerAdapter?.error(
      `[Job Failed] ${job?.id}: ${err.message}`,
    ),
  );

  return worker;
}
