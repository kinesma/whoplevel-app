import { PrismaClient } from "@prisma/client";

// ============================================
// Database Client (Prisma)
// ============================================
// Uses singleton pattern to prevent creating
// multiple database connections in development
// when Next.js hot-reloads the server.
//
// Handles missing DATABASE_URL gracefully so
// the app returns a useful error message
// instead of a cryptic server crash.
// ============================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "[GamifyLevel] DATABASE_URL is not configured. " +
        "Set this environment variable in your deployment. " +
        "See README.md for setup instructions."
    );
  }
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
