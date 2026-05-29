import env from "@configs/env";
import { Queue } from "bullmq";
import {
  attachExternalId,
  createJobRecord,
  parseJobArgs,
} from "../jobs/jobStore";
import { JobQueue, JobSource } from "../jobs/types";

export interface JobAdapter {
  enqueue(jobName: string, args: unknown[]): Promise<void>;
}

export class BullMQJobAdapter implements JobAdapter {
  private queue: Queue | null = null;

  private getQueue(): Queue {
    if (!this.queue) {
      this.queue = new Queue("rails-jobs", {
        connection: {
          host: env.redisHost,
          port: env.redisPort,
          maxRetriesPerRequest: null,
        },
      });
    }
    return this.queue;
  }

  async enqueue(jobName: string, args: unknown[]): Promise<void> {
    const record = await createJobRecord({
      jobClass: jobName,
      args,
      queue: JobQueue.Bullmq,
      source: JobSource.Manual,
    });

    await this.enqueueRecord(record.id, jobName, args);
  }

  async enqueueRecord(
    recordId: string,
    jobName: string,
    args: unknown[],
  ): Promise<void> {
    const bullJob = await this.getQueue().add(
      jobName,
      { recordId, args },
      { removeOnComplete: true, attempts: 3 },
    );

    if (bullJob.id) {
      await attachExternalId(recordId, String(bullJob.id));
    }
  }
}

export class DatabaseJobAdapter implements JobAdapter {
  async enqueue(jobName: string, args: unknown[]): Promise<void> {
    await createJobRecord({
      jobClass: jobName,
      args,
      queue: JobQueue.Database,
      source: JobSource.Manual,
    });

    const { scheduleDatabaseJobProcessing } = await import(
      "../jobs/databaseWorker"
    );
    scheduleDatabaseJobProcessing();
  }
}

let jobAdapterInstance: JobAdapter;

export const getJobAdapter = (): JobAdapter => {
  if (!jobAdapterInstance) {
    jobAdapterInstance = env.jobsUseRedis
      ? new BullMQJobAdapter()
      : new DatabaseJobAdapter();
  }
  return jobAdapterInstance;
};

export { parseJobArgs };
