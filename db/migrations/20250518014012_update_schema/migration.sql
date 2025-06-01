/*
  Warnings:

  - You are about to drop the column `score` on the `task_activities` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `task_activities` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `task_types` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `tasks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `task_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_id` to the `task_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_id` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "task_types" DROP CONSTRAINT "task_types_created_by_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_created_by_fkey";

-- AlterTable
ALTER TABLE "task_activities" DROP COLUMN "score",
DROP COLUMN "status",
ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "task_types" DROP COLUMN "created_by",
ADD COLUMN     "created_by_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "created_by",
ADD COLUMN     "cost" DOUBLE PRECISION,
ADD COLUMN     "created_by_id" TEXT NOT NULL,
ADD COLUMN     "difficulty" INTEGER,
ADD COLUMN     "priority" INTEGER,
ADD COLUMN     "score" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_id" TEXT;

-- CreateTable
CREATE TABLE "task_to_task" (
    "previous_task_id" TEXT NOT NULL,
    "next_task_id" TEXT NOT NULL,

    CONSTRAINT "task_to_task_pkey" PRIMARY KEY ("previous_task_id","next_task_id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "request_type" TEXT NOT NULL,
    "json_parameters" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- AddForeignKey
ALTER TABLE "task_types" ADD CONSTRAINT "task_types_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_to_task" ADD CONSTRAINT "task_to_task_previous_task_id_fkey" FOREIGN KEY ("previous_task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_to_task" ADD CONSTRAINT "task_to_task_next_task_id_fkey" FOREIGN KEY ("next_task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
