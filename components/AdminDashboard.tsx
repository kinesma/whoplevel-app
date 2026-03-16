"use client";
// ============================================
// AdminDashboard - Client Component
// ============================================
// Admin panel for whop owners to configure
// point values, manage rewards, and view stats.
// ============================================

import { useState } from "react";
import type { AppSettingsData, AdminStats, RewardData } from "@/types";

interface Props {
  settings: AppSettingsData;
  stats: AdminStats;
  rewards: RewardData[];
}

function Card({ children, glow }: { children: React.ReactNode; glow?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20, padding: 24,
      boxShadow: glow ? `0 0 40px ${glow}15` : "0 4px 24px rgba(0,0,0,0.2)",
    }}>{children}</div>
  );
}

export function AdminDashboard({ settings: initialSettings, stats, rewards: initialRewards }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rewards] = useState(initialRewards);

  // New reward form
  const [showNewReward, setShowNewReward] = useState(false);
  const [newReward, setNewReward] = useState({ name: "", icon: "🎁", description: "", xpCost: 1000, totalSupply: -1 });
  const [creatingReward, setCreatingReward] = useState(false);

  // ============================================
  // Save settings to API
  // ============================================
  async function handleSaveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
    setSaving(false);
  }

  // ============================================
  // Create a new reward
  // ============================================
  async function handleCreateReward() {
    if (!newReward.name || !newReward.xpCost) return;
    setCreatingReward(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReward),
      });
      if (res.ok) {
        setShowNewReward(false);
        setNewReward({ name: "", icon: "🎁", description: "", xpCost: 1000, totalSupply: -1 });
        // Reload page to show new reward
        window.location.reload();
      }
    } catch (err) {
      console.error("Create reward error:", err);
    }
    setCreatingReward(false);
  }

  // ============================================
  // Point value adjuster
  // ============================================
  function PointRow({ label, field }: { label: string; field: keyof AppSettingsData }) {
    const val = settings[field] as number;
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderRadius: 12,
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ fontSize: 13, color: "#D1D5DB", fontWeight: 500, textTransform: "capitalize" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setSettings({ ...settings, [field]: Math.max(0, val - 5) })} style={{
            width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", color: "#9CA3AF", cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}>−</button>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#A78BFA", minWidth: 36, textAlign: "center" }}>{val}</span>
          <button onClick={() => setSettings({ ...settings, [field]: val + 5 })} style={{
            width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", color: "#9CA3AF", cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}>+</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0A0A0F 0%, #0F0A1A 40%, #0A0F15 100%)",
      color: "#E5E7EB", fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        position: "fixed", inset: 0, opacity: 0.4, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle at 20% 30%, rgba(139,92,246,0.06) 0%, transparent 50%)",
      }} />

      <div style={{ position: "relative", maxWidth: 720, margin: "0 auto", padding: "20px 16px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "white", boxShadow: "0 0 20px rgba(139,92,246,0.3)",
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em" }}>
              <span style={{ color: "#A78BFA" }}>Whop</span><span>Level</span>
              <span style={{ fontSize: 11, marginLeft: 8, color: "#6B7280", fontWeight: 600 }}>Admin</span>
            </div>
            <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>Community Settings</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Stats Overview */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Total Members", value: stats.totalMembers.toLocaleString(), color: "#34D399" },
              { label: "Active Today", value: stats.activeToday.toLocaleString(), color: "#A78BFA" },
              { label: "XP Today", value: stats.xpEarnedToday.toLocaleString(), color: "#FB923C" },
              { label: "Avg Streak", value: `${stats.avgStreak}d`, color: "#60A5FA" },
            ].map((s, i) => (
              <Card key={i}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{s.label}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Point Values Configuration */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>⚙️ Point Values</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>Configure XP earned per action</div>
              </div>
              <button onClick={handleSaveSettings} disabled={saving} style={{
                padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                background: saved ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg, #7C3AED, #8B5CF6)",
                color: saved ? "#34D399" : "white",
                transition: "all 0.2s ease",
              }}>
                {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <PointRow label="💬 Post in chat" field="xpPerPost" />
              <PointRow label="📖 Complete lesson" field="xpPerLesson" />
              <PointRow label="🔥 Daily login" field="xpPerLogin" />
              <PointRow label="👥 Refer a member" field="xpPerReferral" />
              <PointRow label="✅ Complete quiz" field="xpPerQuiz" />
              <PointRow label="🤝 Give feedback" field="xpPerFeedback" />
            </div>
          </Card>

          {/* Feature Toggles */}
          <Card>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🎛️ Feature Toggles</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([
                { label: "Leaderboard", field: "leaderboardEnabled" as const, icon: "🏆" },
                { label: "Badges", field: "badgesEnabled" as const, icon: "🏅" },
                { label: "Rewards Shop", field: "rewardsEnabled" as const, icon: "🎁" },
                { label: "Streaks", field: "streaksEnabled" as const, icon: "🔥" },
              ]).map(({ label, field, icon }) => (
                <button
                  key={field}
                  onClick={() => setSettings({ ...settings, [field]: !settings[field] })}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "14px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    background: settings[field] ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.02)",
                    borderWidth: 1, borderStyle: "solid",
                    borderColor: settings[field] ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.05)",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB" }}>{label}</div>
                  </div>
                  <div style={{
                    width: 40, height: 22, borderRadius: 11, position: "relative",
                    background: settings[field] ? "#34D399" : "rgba(255,255,255,0.1)",
                    transition: "background 0.2s ease",
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 9,
                      background: "white", position: "absolute", top: 2,
                      left: settings[field] ? 20 : 2,
                      transition: "left 0.2s ease",
                    }} />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Manage Rewards */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>🎁 Rewards</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>Create rewards members can claim with XP</div>
              </div>
              <button onClick={() => setShowNewReward(!showNewReward)} style={{
                padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "white",
              }}>+ New Reward</button>
            </div>

            {/* New Reward Form */}
            {showNewReward && (
              <div style={{
                padding: 16, borderRadius: 14, marginBottom: 16,
                background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, marginBottom: 12 }}>
                  <input
                    value={newReward.icon} onChange={(e) => setNewReward({ ...newReward, icon: e.target.value })}
                    placeholder="🎁" maxLength={2}
                    style={{
                      width: 52, height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)", color: "white", textAlign: "center", fontSize: 22,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  <input
                    value={newReward.name} onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                    placeholder="Reward name (e.g., Free Month)"
                    style={{
                      height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)", color: "white", padding: "0 14px", fontSize: 13,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
                <input
                  value={newReward.description} onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  placeholder="Description (optional)"
                  style={{
                    width: "100%", height: 40, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)", color: "white", padding: "0 14px", fontSize: 13,
                    marginBottom: 10, fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>XP Cost</div>
                    <input
                      type="number" value={newReward.xpCost}
                      onChange={(e) => setNewReward({ ...newReward, xpCost: parseInt(e.target.value) || 0 })}
                      style={{
                        width: "100%", height: 40, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)", color: "white", padding: "0 14px", fontSize: 13,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Supply (-1 = unlimited)</div>
                    <input
                      type="number" value={newReward.totalSupply}
                      onChange={(e) => setNewReward({ ...newReward, totalSupply: parseInt(e.target.value) || -1 })}
                      style={{
                        width: "100%", height: 40, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)", color: "white", padding: "0 14px", fontSize: 13,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    />
                  </div>
                </div>
                <button onClick={handleCreateReward} disabled={creatingReward || !newReward.name} style={{
                  width: "100%", padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "white",
                  opacity: newReward.name ? 1 : 0.5,
                }}>{creatingReward ? "Creating..." : "Create Reward"}</button>
              </div>
            )}

            {/* Existing Rewards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rewards.length === 0 && !showNewReward && (
                <div style={{ textAlign: "center", padding: 20, color: "#6B7280" }}>
                  No rewards yet. Click &quot;+ New Reward&quot; to create one.
                </div>
              )}
              {rewards.map((r) => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", padding: "12px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ fontSize: 24, marginRight: 12 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>⚡ {r.xpCost.toLocaleString()} XP · {r.claimed} claimed</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                    background: r.isActive ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
                    color: r.isActive ? "#34D399" : "#EF4444",
                  }}>{r.isActive ? "Active" : "Disabled"}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#4B5563" }}>
          WhopLevel v1.0 · Admin Dashboard
        </div>
      </div>
    </div>
  );
}
