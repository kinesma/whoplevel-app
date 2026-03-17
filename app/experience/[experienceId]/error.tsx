"use client";

// ============================================
// Route Error Boundary
// ============================================
// Catches any unhandled client-side errors
// inside the /experience/[experienceId] route
// and shows a friendly UI instead of crashing.
// ============================================

import { useEffect } from "react";

export default function ExperienceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GamifyLevel] Client error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0F",
        color: "#E5E7EB",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
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
        <p
          style={{
            color: "#9CA3AF",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Something went wrong loading the app. Please try again.
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
          Try Again
        </button>
      </div>
    </div>
  );
}
