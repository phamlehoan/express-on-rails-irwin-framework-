import env from "@configs/env";
import { PrismaClient } from "@db";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prismaClientSingleton = () => {
  const dbPath = env.databaseUrl.replace("file:", "");
  const adapter = new PrismaBetterSqlite3({
    url: dbPath,
  });

  return new PrismaClient({
    adapter,
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
