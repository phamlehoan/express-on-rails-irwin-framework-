-- CreateTable
CREATE TABLE "job_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_class" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "job_schedules_job_class_key" ON "job_schedules"("job_class");
