import * as jobs from "@jobs";
import {
  startAllCronJobsFromDatabase,
  type CronJobClass,
} from "@lib/jobs/cronRunner";
import {
  listJobSchedules,
  syncJobSchedulesFromRegistry,
} from "@lib/jobs/jobSchedule";
import { purgeCompletedBackgroundJobs } from "@lib/jobs/jobStore";
import { getJobAdapter } from "@lib";
import { RailsApplication } from "ts-rails";

let isCronStarted = false;

export function getJobClasses(): CronJobClass[] {
  return Object.values(jobs) as CronJobClass[];
}

async function startCronJobs() {
  if (isCronStarted) return;

  await syncJobSchedulesFromRegistry();
  const rows = await listJobSchedules();
  await startAllCronJobsFromDatabase(rows);

  isCronStarted = true;
  RailsApplication.loggerAdapter?.info("[Jobs] Cron schedules started (from database)");
}

export function initializeJobs() {
  RailsApplication.jobClasses = getJobClasses() as never[];
  RailsApplication.jobAdapter = getJobAdapter();

  if (
    !process.env.LAMBDA_TASK_ROOT &&
    !process.env.VERCEL &&
    !process.env.IS_OFFLINE &&
    !process.env.IRWIN_CONSOLE
  ) {
    void (async () => {
      await purgeCompletedBackgroundJobs();
      await startCronJobs();
    })();
  }
}
