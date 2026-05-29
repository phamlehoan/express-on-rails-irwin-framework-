export const JobStatus = {
  Pending: "pending",
  Processing: "processing",
  Completed: "completed",
  Failed: "failed",
  Paused: "paused",
} as const;

/** Statuses shown in admin “active queue” (no history). */
export const ACTIVE_JOB_STATUSES = [
  JobStatus.Pending,
  JobStatus.Processing,
  JobStatus.Failed,
  JobStatus.Paused,
] as const;

export type JobStatusValue = (typeof JobStatus)[keyof typeof JobStatus];

export const JobQueue = {
  Database: "database",
  Bullmq: "bullmq",
} as const;

export const JobSource = {
  Manual: "manual",
  Cron: "cron",
} as const;
