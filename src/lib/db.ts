import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let prismaInstance: PrismaClient;

// Select client based on presence of a PostgreSQL environment variable
const isPostgres = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.startsWith("postgres://") || 
  process.env.DATABASE_URL.startsWith("postgresql://")
);

if (isPostgres) {
  if (process.env.NODE_ENV === "production") {
    prismaInstance = new PrismaClient();
  } else {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient();
    }
    prismaInstance = globalForPrisma.prisma;
  }
} else {
  if (process.env.NODE_ENV === "production") {
    const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
    prismaInstance = new PrismaClient({ adapter });
  } else {
    if (!globalForPrisma.prisma) {
      const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    prismaInstance = globalForPrisma.prisma;
  }
}

export const prisma = prismaInstance;
export * from "@prisma/client";
export { UserRole } from "@prisma/client";
