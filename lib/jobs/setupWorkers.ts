import env from "@configs/env";
import { setupDatabaseJobWorker } from "./databaseWorker";
import { setupBullMQWorker } from "./worker";

export function setupJobWorkers(): void {
  if (env.jobsUseRedis) {
    setupBullMQWorker();
    return;
  }
  setupDatabaseJobWorker();
}
