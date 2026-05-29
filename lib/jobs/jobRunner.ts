import { RailsApplication } from "ts-rails";
import {
  markJobCompleted,
  markJobFailed,
} from "./jobStore";

type JobConstructor = new () => { perform: (...args: unknown[]) => Promise<void> };

function getJobRegistry(): Record<string, JobConstructor> {
  return (RailsApplication.jobClasses as JobConstructor[]).reduce(
    (acc, Klass) => {
      acc[Klass.name] = Klass;
      return acc;
    },
    {} as Record<string, JobConstructor>,
  );
}

export async function runJobByClass(
  jobClass: string,
  args: unknown[],
  recordId?: string,
): Promise<void> {
  const JobCtor = getJobRegistry()[jobClass];
  if (!JobCtor) {
    const err = new Error(`[Job] Unknown job class: ${jobClass}`);
    if (recordId) await markJobFailed(recordId, err);
    throw err;
  }

  try {
    await new JobCtor().perform(...args);
    if (recordId) await markJobCompleted(recordId);
  } catch (error) {
    if (recordId) await markJobFailed(recordId, error);
    throw error;
  }
}
