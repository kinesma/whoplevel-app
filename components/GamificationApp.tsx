"use client";
// ============================================
// GamificationApp - Main Client Component
// ============================================
// This receives server-loaded data as props and
// renders the interactive UI. API calls for
// actions like claiming rewards happen client-side.
// ============================================

import { useState } from "react";
import type { MemberData, ActivityData, LeaderboardEntry, BadgeData, RewardData } from "@/types";

interface Props {
  member: MemberData;
  activities: ActivityData[];
  leaderboard: LeaderboardEntry[];
  badges: BadgeData[];
  rewards: RewardData[];
  isAdmin: boolean;
}

// ============================================
// HELPER: Time ago string
// ============================================
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ============================================
// SUB-COMPONENTS
// ============================================

function Card({ children, glow, className = "" }: { children: React.ReactNode; glow?: string; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        padding: 24,
        boxShadow: glow ? `0 0 40px ${glow}15` : "0 4px 24px rgba(0,0,0,0.2)",
      }}
    >
      {children}
    </div>
  );
}

function TabButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 18px", borderRadius: 12, border: "none", cursor: "pointer",
      fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center", gap: 6,
      background: active ? "rgba(139,92,246,0.2)" : "transparent",
      color: active ? "#A78BFA" : "#9CA3AF",
      borderWidth: 1, borderStyle: "solid",
      borderColor: active ? "rgba(139,92,246,0.3)" : "transparent",
      transition: "all 0.2s ease", whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>{label}
    </button>
  );
}

// ============================================
// DASHBOARD TAB
// ============================================
function DashboardTab({ member, activities }: { member: MemberData; activities: ActivityData[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Card glow={member.rank.color}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>{member.rank.icon}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>Rank</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: member.rank.color }}>{member.rank.name}</div>
          </div>
        </Card>
        <Card glow="#8B5CF6">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>⚡</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total XP</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#A78BFA" }}>{member.totalXp.toLocaleString()}</div>
          </div>
        </Card>
        <Card glow="#F97316">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>🔥</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>Streak</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#FB923C" }}>{member.currentStreak} days</div>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Level Progress</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: member.rank.color, fontWeight: 700 }}>{member.rank.icon} {member.rank.name}</span>
          {member.nextRank && <span style={{ color: "#9CA3AF" }}>{member.nextRank.icon} {member.nextRank.name} — {member.nextRank.minXP.toLocaleString()} XP</span>}
        </div>
        <div style={{ height: 12, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99, width: `${member.rankProgress}%`,
            background: `linear-gradient(90deg, ${member.rank.color}, ${member.nextRank?.color ?? member.rank.color})`,
            transition: "width 1.5s ease",
          }} />
        </div>
        <div style={{ textAlign: "right", marginTop: 4, fontSize: 11, color: "#6B7280" }}>{member.rankProgress}% to next rank</div>
      </Card>

      {/* Activity Feed */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Recent Activity</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activities.length === 0 && (
            <div style={{ textAlign: "center", padding: 20, color: "#6B7280" }}>
              No activity yet. Start engaging to earn XP!
            </div>
          )}
          {activities.map((a) => (
            <div key={a.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 12,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: "#D1D5DB", fontWeight: 500 }}>{a.description}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>{timeAgo(a.createdAt)}</div>
                </div>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 700, color: "#34D399",
                background: "rgba(52,211,153,0.1)", padding: "4px 10px", borderRadius: 8,
              }}>+{a.xpEarned} XP</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// LEADERBOARD TAB
// ============================================
function LeaderboardTab({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all-time">("all-time");

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const medals = ["🥇", "🥈", "🥉"];
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const heights = [120, 150, 100];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>🏆 Leaderboard</div>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
          {(["weekly", "monthly", "all-time"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 11,
              fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
              fontFamily: "'DM Sans', sans-serif",
              background: period === p ? "rgba(139,92,246,0.2)" : "transparent",
              color: period === p ? "#A78BFA" : "#6B7280",
            }}>{p}</button>
          ))}
        </div>
      </div>

      {top3.length >= 3 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, marginBottom: 28 }}>
          {podiumOrder.map((user, i) => (
            <div key={user.id} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{user.avatarUrl ? "👤" : "🧑"}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: user.isCurrentUser ? "#A78BFA" : "#E5E7EB" }}>
                {user.displayName}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>{user.totalXp.toLocaleString()} XP</div>
              <div style={{
                height: heights[i], borderRadius: "12px 12px 0 0",
                background: `rgba(139,92,246,${0.05 + (2 - i) * 0.05})`,
                border: "1px solid rgba(139,92,246,0.15)", borderBottom: "none",
                display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 12, fontSize: 28,
              }}>{medals[i === 0 ? 1 : i === 1 ? 0 : 2]}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rest.map((user) => (
          <div key={user.id} style={{
            display: "flex", alignItems: "center", padding: "12px 16px", borderRadius: 14,
            background: user.isCurrentUser ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
            border: user.isCurrentUser ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(255,255,255,0.03)",
          }}>
            <div style={{ width: 28, fontSize: 14, fontWeight: 800, color: user.isCurrentUser ? "#A78BFA" : "#6B7280" }}>#{user.rank}</div>
            <div style={{ fontSize: 22, marginRight: 12 }}>🧑</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: user.isCurrentUser ? "#A78BFA" : "#D1D5DB" }}>
                {user.displayName} {user.isCurrentUser && <span style={{ fontSize: 10, background: "rgba(139,92,246,0.2)", padding: "2px 8px", borderRadius: 6 }}>YOU</span>}
              </div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>🔥 {user.currentStreak}d streak</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{user.totalXp.toLocaleString()}</div>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <div style={{ textAlign: "center", padding: 30, color: "#6B7280" }}>
            No members yet. Be the first on the leaderboard!
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================
// BADGES TAB
// ============================================
function BadgesTab({ badges }: { badges: BadgeData[] }) {
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  return (
    <Card>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🏅 Badges</div>
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 20 }}>{unlockedCount} of {badges.length} unlocked</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {badges.map((badge) => (
          <div key={badge.id} style={{
            padding: "18px 16px", borderRadius: 16, textAlign: "center", position: "relative",
            background: badge.unlocked ? "rgba(139,92,246,0.06)" : "rgba(255,255,255,0.02)",
            border: badge.unlocked ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(255,255,255,0.04)",
            opacity: badge.unlocked ? 1 : 0.45,
          }}>
            <div style={{ fontSize: 36, marginBottom: 8, filter: badge.unlocked ? "none" : "grayscale(1)" }}>{badge.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: badge.unlocked ? "#E5E7EB" : "#6B7280" }}>{badge.name}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{badge.description}</div>
            {badge.unlocked && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 10, background: "rgba(52,211,153,0.15)", color: "#34D399", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>✓ Earned</div>}
            {!badge.unlocked && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 14 }}>🔒</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================
// REWARDS TAB
// ============================================
function RewardsTab({ rewards, userXp }: { rewards: RewardData[]; userXp: number }) {
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedLocal, setClaimedLocal] = useState<Set<string>>(new Set());

  async function handleClaim(rewardId: string) {
    setClaiming(rewardId);
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
      if (res.ok) {
        setClaimedLocal((prev) => new Set([...prev, rewardId]));
      }
    } catch (err) {
      console.error("Claim error:", err);
    }
    setClaiming(null);
  }

  return (
    <Card>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🎁 Rewards Shop</div>
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 20 }}>Spend your XP on exclusive rewards</div>
      <div style={{
        background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
        borderRadius: 14, padding: "14px 18px", marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 13, color: "#A78BFA", fontWeight: 600 }}>Your Balance</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#A78BFA" }}>⚡ {userXp.toLocaleString()} XP</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rewards.length === 0 && (
          <div style={{ textAlign: "center", padding: 30, color: "#6B7280" }}>
            No rewards available yet. Check back soon!
          </div>
        )}
        {rewards.map((r) => {
          const isClaimed = r.userClaimed || claimedLocal.has(r.id);
          const canAfford = userXp >= r.xpCost;
          return (
            <div key={r.id} style={{
              display: "flex", alignItems: "center", padding: "14px 18px", borderRadius: 14,
              background: isClaimed ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.02)",
              border: isClaimed ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(255,255,255,0.04)",
            }}>
              <span style={{ fontSize: 28, marginRight: 14 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>⚡ {r.xpCost.toLocaleString()} XP</div>
              </div>
              {isClaimed ? (
                <div style={{ fontSize: 12, fontWeight: 700, color: "#34D399", background: "rgba(52,211,153,0.1)", padding: "6px 14px", borderRadius: 8 }}>Claimed ✓</div>
              ) : (
                <button
                  disabled={!canAfford || claiming === r.id}
                  onClick={() => handleClaim(r.id)}
                  style={{
                    fontSize: 12, fontWeight: 700, border: "none", padding: "8px 18px", borderRadius: 10,
                    cursor: canAfford ? "pointer" : "default",
                    fontFamily: "'DM Sans', sans-serif",
                    background: canAfford ? "linear-gradient(135deg, #7C3AED, #8B5CF6)" : "rgba(255,255,255,0.06)",
                    color: canAfford ? "white" : "#4B5563",
                    opacity: canAfford ? 1 : 0.5,
                  }}
                >{claiming === r.id ? "Claiming..." : canAfford ? "Claim" : "Need more XP"}</button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================
// MAIN EXPORT
// ============================================
export function GamificationApp({ member, activities, leaderboard, badges, rewards, isAdmin }: Props) {
  const [tab, setTab] = useState("dashboard");

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0A0A0F 0%, #0F0A1A 40%, #0A0F15 100%)",
      color: "#E5E7EB",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.4, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle at 20% 30%, rgba(139,92,246,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(251,146,60,0.04) 0%, transparent 50%)",
      }} />

      <div style={{ position: "relative", maxWidth: 720, margin: "0 auto", padding: "20px 16px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: "white", boxShadow: "0 0 20px rgba(139,92,246,0.3)",
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em" }}>
                <span style={{ color: "#A78BFA" }}>Whop</span><span>Level</span>
              </div>
              <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>Gamification Engine</div>
            </div>
          </div>
          {/* Streak badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #7C2D12, #9A3412)",
            borderRadius: 16, padding: "10px 16px",
            border: "1px solid rgba(251,146,60,0.3)",
          }}>
            <span style={{ fontSize: 24 }}>🔥</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#FB923C" }}>{member.currentStreak}</div>
              <div style={{ fontSize: 9, color: "#FDBA74", textTransform: "uppercase", letterSpacing: "0.1em" }}>Day Streak</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          <TabButton label="Dashboard" icon="📊" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <TabButton label="Leaderboard" icon="🏆" active={tab === "leaderboard"} onClick={() => setTab("leaderboard")} />
          <TabButton label="Badges" icon="🏅" active={tab === "badges"} onClick={() => setTab("badges")} />
          <TabButton label="Rewards" icon="🎁" active={tab === "rewards"} onClick={() => setTab("rewards")} />
        </div>

        {/* Content */}
        {tab === "dashboard" && <DashboardTab member={member} activities={activities} />}
        {tab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} />}
        {tab === "badges" && <BadgesTab badges={badges} />}
        {tab === "rewards" && <RewardsTab rewards={rewards} userXp={member.totalXp} />}

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#4B5563" }}>
          WhopLevel v1.0 · Gamification Engine for Whop Communities
        </div>
      </div>
    </div>
  );
}
