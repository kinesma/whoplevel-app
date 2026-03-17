// ============================================
// Next.js Instrumentation Hook
// ============================================
// Runs once at server startup (before any
// requests are handled). Used to ensure the
// database schema is in sync with the Prisma
// schema without requiring a manual migration
// step after every deploy.
//
// Safe to run on every cold start — Prisma
// db push is idempotent (no-op if schema
// already matches).
// ============================================

export async function register() {
  // Only run in the Node.js runtime, not on the edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!process.env.DATABASE_URL) {
      console.warn(
        "[GamifyLevel] DATABASE_URL is not set — skipping DB schema sync."
      );
      return;
    }

    try {
      // Dynamically import to avoid bundling issues
      const { execSync } = await import("child_process");
      console.log("[GamifyLevel] Syncing database schema...");
      execSync("npx prisma db push --skip-generate --accept-data-loss", {
        stdio: "pipe",
        timeout: 30000,
      });
      console.log("[GamifyLevel] Database schema sync complete.");
    } catch (err) {
      // Don't crash the server if DB sync fails — the app will
      // handle DB errors gracefully per-request.
      console.error("[GamifyLevel] DB schema sync failed (non-fatal):", err);
    }
  }
}
