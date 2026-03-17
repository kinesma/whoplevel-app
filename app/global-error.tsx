"use client";

// ============================================
// Global Error Boundary
// ============================================
// Last-resort catch for any unhandled error
// anywhere in the app — ensures the user
// always sees a rendered page, not a blank crash.
// ============================================

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GamifyLevel] Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0F",
          color: "#E5E7EB",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 8,
              color: "#A78BFA",
            }}
          >
            GamifyLevel
          </h1>
          <p style={{ color: "#9CA3AF", marginBottom: 24, lineHeight: 1.6 }}>
            The app encountered an unexpected error. Please refresh to try again.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Reload App
          </button>
        </div>
      </body>
    </html>
  );
}
