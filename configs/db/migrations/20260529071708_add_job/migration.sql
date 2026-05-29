-- CreateTable
CREATE TABLE "background_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "job_class" TEXT NOT NULL,
    "args" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "queue" TEXT NOT NULL DEFAULT 'database',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "external_id" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "run_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "failed_at" DATETIME,
    "last_error" TEXT
);

-- CreateIndex
CREATE INDEX "background_jobs_status_run_at_idx" ON "background_jobs"("status", "run_at");

-- CreateIndex
CREATE INDEX "background_jobs_job_class_created_at_idx" ON "background_jobs"("job_class", "created_at");
