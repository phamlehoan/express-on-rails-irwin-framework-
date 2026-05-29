import models from "@models";
import {
  ACTIVE_JOB_STATUSES,
  JobQueue,
  JobSource,
  JobStatus,
  type JobStatusValue,
} from "./types";

export type CreateJobRecordInput = {
  jobClass: string;
  args?: unknown[];
  queue?: string;
  source?: string;
  runAt?: Date;
  maxAttempts?: number;
  externalId?: string;
};

export function serializeJobArgs(args: unknown[]): string | null {
  if (!args.length) return null;
  return JSON.stringify(args);
}

export function parseJobArgs(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export async function createJobRecord(input: CreateJobRecordInput) {
  return models.backgroundJob.create({
    data: {
      jobClass: input.jobClass,
      args: serializeJobArgs(input.args ?? []),
      queue: input.queue ?? JobQueue.Database,
      source: input.source ?? JobSource.Manual,
      status: JobStatus.Pending,
      runAt: input.runAt ?? new Date(),
      maxAttempts: input.maxAttempts ?? 3,
      externalId: input.externalId ?? null,
    },
  });
}

export async function markJobProcessing(id: string) {
  return models.backgroundJob.update({
    where: { id },
    data: {
      status: JobStatus.Processing,
      startedAt: new Date(),
      attempts: { increment: 1 },
    },
  });
}

export async function markJobCompleted(id: string) {
  return models.backgroundJob.delete({ where: { id } });
}

/** Remove legacy/history rows (completed + old cron audit). */
export async function purgeCompletedBackgroundJobs() {
  const result = await models.backgroundJob.deleteMany({
    where: {
      OR: [
        { status: JobStatus.Completed },
        { source: "cron" },
      ],
    },
  });
  return result.count;
}

export async function markJobFailed(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const job = await models.backgroundJob.findUnique({ where: { id } });
  if (!job) return null;

  const shouldRetry = job.attempts < job.maxAttempts;
  return models.backgroundJob.update({
    where: { id },
    data: {
      status: shouldRetry ? JobStatus.Pending : JobStatus.Failed,
      failedAt: shouldRetry ? job.failedAt : new Date(),
      lastError: message,
      runAt: shouldRetry ? new Date(Date.now() + 30_000) : job.runAt,
    },
  });
}

export async function claimPendingDatabaseJobs(limit = 5) {
  const now = new Date();
  const pending = await models.backgroundJob.findMany({
    where: {
      queue: JobQueue.Database,
      status: JobStatus.Pending,
      runAt: { lte: now },
      source: JobSource.Manual,
    },
    orderBy: [{ runAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  const claimed = [];
  for (const job of pending) {
    const updated = await models.backgroundJob.updateMany({
      where: { id: job.id, status: JobStatus.Pending },
      data: {
        status: JobStatus.Processing,
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    if (updated.count === 1) claimed.push(job);
  }
  return claimed;
}

export async function resetStuckProcessingJobs(olderThanMs = 5 * 60_000) {
  const cutoff = new Date(Date.now() - olderThanMs);
  return models.backgroundJob.updateMany({
    where: {
      status: JobStatus.Processing,
      startedAt: { lt: cutoff },
    },
    data: {
      status: JobStatus.Pending,
      startedAt: null,
    },
  });
}

export async function retryFailedJob(id: string) {
  return models.backgroundJob.update({
    where: { id, status: JobStatus.Failed },
    data: {
      status: JobStatus.Pending,
      runAt: new Date(),
      startedAt: null,
      completedAt: null,
      failedAt: null,
      lastError: null,
      attempts: 0,
      externalId: null,
    },
  });
}

export async function attachExternalId(id: string, externalId: string) {
  return models.backgroundJob.update({
    where: { id },
    data: { externalId },
  });
}

export async function pauseQueueJob(id: string) {
  return models.backgroundJob.updateMany({
    where: {
      id,
      status: { in: [JobStatus.Pending, JobStatus.Failed] },
    },
    data: { status: JobStatus.Paused },
  });
}

export async function resumeQueueJob(id: string) {
  return models.backgroundJob.updateMany({
    where: { id, status: JobStatus.Paused },
    data: {
      status: JobStatus.Pending,
      runAt: new Date(),
    },
  });
}

export async function cancelQueueJob(id: string) {
  return models.backgroundJob.deleteMany({
    where: {
      id,
      status: {
        in: [JobStatus.Pending, JobStatus.Paused, JobStatus.Failed],
      },
    },
  });
}

export async function runQueueJobNow(id: string) {
  const updated = await models.backgroundJob.updateMany({
    where: {
      id,
      status: { in: [JobStatus.Pending, JobStatus.Paused, JobStatus.Failed] },
    },
    data: {
      status: JobStatus.Pending,
      runAt: new Date(),
      startedAt: null,
      failedAt: null,
      lastError: null,
    },
  });
  return updated.count;
}

export async function listActiveJobs(params: {
  page: number;
  perPage: number;
  status?: JobStatusValue | "";
  search?: string;
  queue?: string;
}) {
  const where: {
    status?: string | { in: string[] };
    queue?: string;
    OR?: Array<{ jobClass: { contains: string } } | { lastError: { contains: string } }>;
  } = {
    status: params.status
      ? params.status
      : { in: [...ACTIVE_JOB_STATUSES] },
  };

  if (params.queue) where.queue = params.queue;
  if (params.search) {
    where.OR = [
      { jobClass: { contains: params.search } },
      { lastError: { contains: params.search } },
    ];
  }

  const [items, total] = await Promise.all([
    models.backgroundJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
    }),
    models.backgroundJob.count({ where }),
  ]);

  return { items, total };
}

/** @deprecated Use listActiveJobs — kept for compatibility. */
export const listJobs = listActiveJobs;
