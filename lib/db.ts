import { PrismaClient } from "@prisma/client";

// ============================================
// Database Client (Prisma)
// ============================================
// Uses singleton pattern to prevent creating
// multiple database connections in development
// when Next.js hot-reloads the server.
// ============================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
