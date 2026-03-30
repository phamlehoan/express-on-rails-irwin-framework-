import env from "@configs/env";
import { PrismaClient } from "@prisma/client";

/**
 * Singleton cho Prisma Client để tối ưu kết nối trong Serverless.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        // Đảm bảo connection string có tham số connection_limit
        url: env.databaseUrl.includes("connection_limit")
          ? env.databaseUrl
          : `${env.databaseUrl}${env.databaseUrl.includes("?") ? "&" : "?"}connection_limit=${env.dbMaxConnections}`,
      },
    },
    log: env.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const models = globalForPrisma.prisma ?? prismaClientSingleton();

export default models;

if (env.nodeEnv !== "production") globalForPrisma.prisma = models;
