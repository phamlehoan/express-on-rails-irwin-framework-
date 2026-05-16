-- CreateTable
CREATE TABLE "app_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "data" TEXT,
    "read_at" DATETIME,
    CONSTRAINT "app_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "app_notifications_user_id_deleted_read_at_created_at_idx" ON "app_notifications"("user_id", "deleted", "read_at", "created_at");
