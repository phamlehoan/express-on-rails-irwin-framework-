import models from "@models";
import { RailsApplication } from "ts-rails";
import {
  findCronJobClass,
  getScheduledCronTasks,
  startAllCronJobsFromDatabase,
  startCronTask,
  stopCronTask,
  validateCronExpression,
  type CronJobClass,
} from "./cronRunner";

type JobClass = {
  name: string;
  cron?: string;
};

function registryClasses(): JobClass[] {
  return (RailsApplication.jobClasses ?? []) as JobClass[];
}

export function listRegisteredJobClassNames(): string[] {
  return registryClasses().map((k) => k.name).sort();
}

export function assertJobClassRegistered(jobClass: string): void {
  if (!findCronJobClass(jobClass, registryClasses())) {
    throw new Error(
      `Job class "${jobClass}" is not registered. Add a class under app/jobs/ and export it from app/jobs/index.ts.`,
    );
  }
}

/** Chỉ tạo schedule mặc định từ code nếu chưa có (không ghi đè cron admin đã sửa). */
export async function syncJobSchedulesFromRegistry(): Promise<void> {
  for (const Klass of registryClasses()) {
    if (!Klass.cron) continue;
    await models.jobSchedule.upsert({
      where: { jobClass: Klass.name },
      create: {
        jobClass: Klass.name,
        cron: Klass.cron,
        paused: false,
      },
      update: {},
    });
  }
}

export async function listJobSchedules() {
  return models.jobSchedule.findMany({
    orderBy: { jobClass: "asc" },
  });
}

export async function listJobSchedulesPaginated(params: {
  page: number;
  perPage: number;
}) {
  const { page, perPage } = params;
  const skip = (page - 1) * perPage;
  const [items, total] = await Promise.all([
    models.jobSchedule.findMany({
      orderBy: { jobClass: "asc" },
      skip,
      take: perPage,
    }),
    models.jobSchedule.count(),
  ]);
  return { items, total };
}

export async function reloadAllCronTasks(): Promise<void> {
  for (const jobClass of getScheduledCronTasks().keys()) {
    stopCronTask(jobClass);
  }
  const rows = await listJobSchedules();
  await startAllCronJobsFromDatabase(rows);
}

export async function getJobSchedule(jobClass: string) {
  return models.jobSchedule.findUnique({ where: { jobClass } });
}

export async function isJobSchedulePaused(jobClass: string): Promise<boolean> {
  const row = await models.jobSchedule.findUnique({ where: { jobClass } });
  return row?.paused ?? false;
}

export async function createJobSchedule(
  jobClass: string,
  cron: string,
  paused = false,
): Promise<void> {
  assertJobClassRegistered(jobClass);
  const expr = cron.trim();
  if (!validateCronExpression(expr)) {
    throw new Error(`Invalid cron expression: ${expr}`);
  }

  const existing = await models.jobSchedule.findUnique({ where: { jobClass } });
  if (existing) {
    throw new Error(`Schedule for "${jobClass}" already exists. Use edit instead.`);
  }

  await models.jobSchedule.create({
    data: { jobClass, cron: expr, paused },
  });

  if (!paused) {
    startCronTask(jobClass, expr);
  }
}

export async function updateJobSchedule(
  jobClass: string,
  cron: string,
  paused: boolean,
): Promise<void> {
  assertJobClassRegistered(jobClass);
  const expr = cron.trim();
  if (!validateCronExpression(expr)) {
    throw new Error(`Invalid cron expression: ${expr}`);
  }

  stopCronTask(jobClass);

  await models.jobSchedule.update({
    where: { jobClass },
    data: { cron: expr, paused },
  });

  if (!paused) {
    startCronTask(jobClass, expr);
  }
}

export async function deleteJobSchedule(jobClass: string): Promise<void> {
  stopCronTask(jobClass);
  await models.jobSchedule.delete({ where: { jobClass } });
}

export async function setJobSchedulePaused(
  jobClass: string,
  paused: boolean,
): Promise<void> {
  const row = await models.jobSchedule.findUnique({ where: { jobClass } });
  if (!row) {
    throw new Error(`No schedule for "${jobClass}". Create one in Admin → Jobs.`);
  }

  await models.jobSchedule.update({
    where: { jobClass },
    data: { paused },
  });

  if (paused) {
    stopCronTask(jobClass);
  } else {
    startCronTask(jobClass, row.cron);
  }
}

export function isCronTaskRunning(jobClass: string): boolean {
  return getScheduledCronTasks().has(jobClass);
}

export type RegisteredJobInfo = {
  name: string;
  codeCron: string | null;
  hasSchedule: boolean;
};

export async function listRegisteredJobsForAdmin(): Promise<RegisteredJobInfo[]> {
  const schedules = await listJobSchedules();
  const scheduleByClass = new Map(schedules.map((s) => [s.jobClass, s]));

  return registryClasses().map((k) => ({
    name: k.name,
    codeCron: k.cron ?? null,
    hasSchedule: scheduleByClass.has(k.name),
  }));
}
