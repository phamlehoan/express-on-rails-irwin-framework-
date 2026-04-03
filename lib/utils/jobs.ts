import env from "@configs/env";
import { Queue } from "bullmq";

export interface JobAdapter {
  enqueue(jobName: string, args: any[]): Promise<void>;
}

export class BullMQJobAdapter implements JobAdapter {
  private queue: Queue | null = null;

  private getQueue(): Queue {
    if (!this.queue) {
      // Singleton: Chỉ khởi tạo Queue một lần duy nhất
      this.queue = new Queue("rails-jobs", {
        connection: {
          host: env.redisHost,
          port: env.redisPort,
          // Tránh tạo quá nhiều kết nối Redis
          maxRetriesPerRequest: null,
        },
      });
    }
    return this.queue;
  }

  async enqueue(jobName: string, args: any[]) {
    await this.getQueue().add(jobName, args, { removeOnComplete: true });
  }
}

let jobAdapterInstance: JobAdapter;

export const getJobAdapter = (): JobAdapter => {
  if (!jobAdapterInstance) {
    jobAdapterInstance = new BullMQJobAdapter();
  }
  return jobAdapterInstance;
};
