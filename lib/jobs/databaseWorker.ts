import { RailsApplication } from "ts-rails";
import { runJobByClass } from "./jobRunner";
import {
  claimPendingDatabaseJobs,
  parseJobArgs,
  resetStuckProcessingJobs,
} from "./jobStore";

let pollTimer: ReturnType<typeof setInterval> | null = null;
let processing = false;

async function processDatabaseJobs(): Promise<void> {
  if (processing) return;
  processing = true;

  try {
    await resetStuckProcessingJobs();

    const jobs = await claimPendingDatabaseJobs(5);
    for (const job of jobs) {
      try {
        await runJobByClass(job.jobClass, parseJobArgs(job.args), job.id);
      } catch (error) {
        RailsApplication.loggerAdapter?.error(
          `[Job Failed] ${job.jobClass} (${job.id}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  } finally {
    processing = false;
  }
}

export function scheduleDatabaseJobProcessing(): void {
  void processDatabaseJobs();
}

/**
 * Database-backed queue worker — default when `JOBS_USE_REDIS` is not set.
 */
export function setupDatabaseJobWorker(): void {
  if (pollTimer) return;

  void processDatabaseJobs();
  pollTimer = setInterval(() => {
    void processDatabaseJobs();
  }, 2_000);

  RailsApplication.loggerAdapter?.info(
    "[Jobs] Database queue worker started (JOBS_USE_REDIS=false)",
  );
}

export function stopDatabaseJobWorker(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
