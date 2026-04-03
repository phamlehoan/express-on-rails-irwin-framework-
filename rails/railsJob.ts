import { RailsApplication } from "./railsApplication";

/** Interface để ứng dụng có thể chọn công nghệ hàng đợi khác nhau (BullMQ, SQS, Kafka...) */
export interface JobAdapter {
  enqueue(jobName: string, args: any[]): Promise<void>;
}

/**
 * RailsJob - Lớp cơ sở cho background tasks.
 * Tương tự ActiveJob::Base trong Ruby on Rails.
 */
export abstract class RailsJob {
  /** Thực thi logic của job (Phải override ở class con) */
  abstract perform(...args: any[]): Promise<void>;

  static async performLater(...args: any[]): Promise<void> {
    if (!RailsApplication.jobAdapter) {
      console.warn(
        `[Job] No JobAdapter configured. Executing ${this.name} synchronously.`,
      );
      return new (this as any)().perform(...args);
    }

    await RailsApplication.jobAdapter.enqueue(this.name, args);
  }
}
