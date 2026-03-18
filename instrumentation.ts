// ============================================
// Next.js Instrumentation Hook
// ============================================
// Runs once at server startup (before any
// requests are handled).
//
// Schema is managed at deploy time via Prisma
// migrations / db push in CI. This file just
// logs a startup confirmation so we can verify
// the Node.js runtime is initialising correctly.
// ============================================

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
          if (!process.env.DATABASE_URL) {
                  console.warn(
                            "[GamifyLevel] DATABASE_URL is not set — database queries will fail."
                          );
          } else {
                  console.log("[GamifyLevel] Server starting up. DATABASE_URL is set.");
          }
    }
}
