import env from "@configs/env";
import { formatPrismaUrl } from "@lib/utils/prisma";
import { PrismaClient } from "@prisma/client";

/**
 * Singleton cho Prisma Client để tối ưu kết nối trong Serverless.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: formatPrismaUrl(env.databaseUrl, env.dbMaxConnections),
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
