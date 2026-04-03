import * as jobs from "@jobs";
import { execSync } from "child_process";
import serverless from "serverless-http";
import application from "./configs/application";

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    await application.initialize();

    // Hỗ trợ trigger từ EventBridge (CloudWatch Events)
    if (
      event.source === "aws.events" ||
      event["detail-type"] === "Scheduled Event"
    ) {
      const jobClassName = event.job || event.detail?.job;
      const Klass = (jobs as any)[jobClassName];
      if (Klass) {
        return await new Klass().perform(...(event.args || []));
      }
    }

    // Cấu hình serverless-http để Express có thể hiểu được event từ Gateway
    cachedHandler = serverless(application.app, {
      binary: ["image/*", "font/*", "application/pdf"], // Hỗ trợ trả về file binary nếu cần
    });
  }

  // Ngăn Lambda kết thúc trước khi các async tasks trong event loop hoàn tất (nếu có)
  context.callbackWaitsForEmptyEventLoop = false;

  return cachedHandler(event, context);
};

/**
 * Handler dành riêng cho việc chạy migration.
 * Anh có thể gọi handler này thủ công từ AWS Console hoặc qua CI/CD.
 */
export const migrate = async () => {
  try {
    console.log("Starting database migration...");
    // Prisma migrate deploy là lệnh an toàn cho production (không làm mất dữ liệu)
    const output = execSync("npx prisma migrate deploy");
    console.log(output.toString());
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Migration successful",
        output: output.toString(),
      }),
    };
  } catch (error: any) {
    console.error("Migration failed:", error);
    throw error;
  }
};

/**
 * Handler để xử lý lỗi khi migration bị kẹt (Failed state).
 * Tham số 'migrationName' là tên thư mục migration bị lỗi.
 */
export const resolveMigration = async (event: { migrationName: string }) => {
  try {
    console.log(`Marking migration ${event.migrationName} as rolled back...`);
    const output = execSync(
      `npx prisma migrate resolve --rolled-back ${event.migrationName}`,
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Migration resolved successfully",
        output: output.toString(),
      }),
    };
  } catch (error: any) {
    console.error("Resolve failed:", error);
    throw error;
  }
};
