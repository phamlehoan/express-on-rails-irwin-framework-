import env from "@configs/env";
import { Worker } from "bullmq";
import { RailsApplication } from "ts-rails";
import { runJobByClass } from "./jobRunner";
import { markJobProcessing } from "./jobStore";

/**
 * BullMQ worker — only started when `JOBS_USE_REDIS=true`.
 */
export function setupBullMQWorker() {
  const connection = { host: env.redisHost, port: env.redisPort };

  const worker = new Worker(
    "rails-jobs",
    async (job) => {
      const payload = job.data as { recordId?: string; args?: unknown[] };
      const args = Array.isArray(payload?.args) ? payload.args : [];
      const recordId = payload?.recordId;

      if (recordId) await markJobProcessing(recordId);
      await runJobByClass(job.name, args, recordId);
    },
    { connection },
  );

  let isRedisDown = false;

  worker.on("error", (err: NodeJS.ErrnoException) => {
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

  worker.on("failed", (job, err) =>
    RailsApplication.loggerAdapter?.error(
      `[Job Failed] ${job?.id}: ${err.message}`,
    ),
  );

  RailsApplication.loggerAdapter?.info(
    "[Jobs] BullMQ worker started (JOBS_USE_REDIS=true)",
  );

  return worker;
}
