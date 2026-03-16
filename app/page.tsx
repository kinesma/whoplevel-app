// ============================================
// Root Page: /
// ============================================
// This is shown if someone visits the app
// directly (not from within a Whop iframe).
// It displays a landing/info page.
// ============================================

export default function HomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #0A0A0F 0%, #0F0A1A 40%, #0A0F15 100%)",
      color: "#E5E7EB", fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24, margin: "0 auto 24px",
          background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, boxShadow: "0 0 60px rgba(139,92,246,0.3)",
        }}>⚡</div>

        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8 }}>
          <span style={{ color: "#A78BFA" }}>Whop</span>Level
        </h1>

        <p style={{ fontSize: 16, color: "#9CA3AF", marginBottom: 32, lineHeight: 1.6 }}>
          The gamification engine for Whop communities.
          Points, streaks, badges, leaderboards & rewards
          that keep your members engaged and coming back.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <a href="https://whop.com/apps" target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px", borderRadius: 14,
            background: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
            color: "white", fontSize: 15, fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
          }}>
            Install on Your Whop →
          </a>
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            Free to install · 3% Whop transaction fee only
          </span>
        </div>

        <div style={{
          marginTop: 48, padding: 24, borderRadius: 16,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          textAlign: "left",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>What you get:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "⚡", text: "XP points system — reward every action" },
              { icon: "🔥", text: "Daily streaks — keep members coming back" },
              { icon: "🏆", text: "Live leaderboard — drive friendly competition" },
              { icon: "🏅", text: "Achievement badges — celebrate milestones" },
              { icon: "🎁", text: "Rewards shop — members spend XP on perks" },
              { icon: "⚙️", text: "Admin dashboard — full control over settings" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: "#D1D5DB" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
