import env from "@configs/env";
import { runJobByClass } from "./jobRunner";
import { isJobSchedulePaused } from "./jobSchedule";
import cron, { type ScheduledTask } from "node-cron";
import { RailsApplication } from "ts-rails";

export type CronJobClass = {
  name: string;
  cron?: string;
};

const scheduledTasks = new Map<string, ScheduledTask>();

export function getScheduledCronTasks(): ReadonlyMap<string, ScheduledTask> {
  return scheduledTasks;
}

export function validateCronExpression(expression: string): boolean {
  return cron.validate(expression.trim());
}

export function scheduleCronJob(jobClass: string, cronExpression: string): void {
  stopCronTask(jobClass);

  const expr = cronExpression.trim();
  if (!validateCronExpression(expr)) {
    throw new Error(`Invalid cron expression: ${expr}`);
  }

  const task = cron.schedule(expr, () => {
    void (async () => {
      if (await isJobSchedulePaused(jobClass)) return;

      try {
        await runJobByClass(jobClass, []);
      } catch (error) {
        RailsApplication.loggerAdapter?.error(
          `[Cron Job Failed] ${jobClass}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    })();
  });

  scheduledTasks.set(jobClass, task);
  RailsApplication.loggerAdapter?.info(
    `[Cron] Scheduled ${jobClass} (${expr})`,
  );
}

export function stopCronTask(jobClass: string): void {
  const task = scheduledTasks.get(jobClass);
  if (task) {
    task.stop();
    scheduledTasks.delete(jobClass);
    RailsApplication.loggerAdapter?.info(`[Cron] Stopped schedule: ${jobClass}`);
  }
}

export function startCronTask(jobClass: string, cronExpression: string): void {
  if (env.appEnv !== "development" && env.appEnv !== "production") return;
  scheduleCronJob(jobClass, cronExpression);
}

export async function startAllCronJobsFromDatabase(
  rows: { jobClass: string; cron: string; paused: boolean }[],
): Promise<void> {
  if (env.appEnv !== "development" && env.appEnv !== "production") return;

  for (const row of rows) {
    if (row.paused) continue;
    scheduleCronJob(row.jobClass, row.cron);
  }
}

export function findCronJobClass(
  jobClass: string,
  classes: CronJobClass[],
): CronJobClass | undefined {
  return classes.find((k) => k.name === jobClass);
}
