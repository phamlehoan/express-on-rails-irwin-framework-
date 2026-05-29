import env from "@configs/env";
import { BullMQJobAdapter, getJobAdapter } from "@lib/utils/jobs";
import { RailsApplication } from "ts-rails";
import { scheduleDatabaseJobProcessing } from "./databaseWorker";
import { createJobRecord } from "./jobStore";

export type EnqueueJobOptions = {
  /** Mặc định: chạy ngay. Dev có thể đặt tương lai để thấy trong Active queue. */
  runAt?: Date;
};

function resolveAdapter() {
  const adapter = RailsApplication.jobAdapter ?? getJobAdapter();
  RailsApplication.jobAdapter = adapter;
  return adapter;
}

export async function enqueueJobClass(
  jobClass: string,
  args: unknown[] = [],
  options?: EnqueueJobOptions,
): Promise<{ id: string }> {
  const runAt = options?.runAt ?? new Date();
  const adapter = resolveAdapter();

  if (env.jobsUseRedis && adapter instanceof BullMQJobAdapter) {
    await adapter.enqueue(jobClass, args);
    return { id: "" };
  }

  const record = await createJobRecord({
    jobClass,
    args,
    runAt,
  });
  scheduleDatabaseJobProcessing();
  return { id: record.id };
}

export async function enqueueJob(
  JobCtor: new () => { perform: (...args: unknown[]) => Promise<void> },
  args: unknown[] = [],
  options?: EnqueueJobOptions,
): Promise<{ id: string }> {
  return enqueueJobClass(JobCtor.name, args, options);
}
