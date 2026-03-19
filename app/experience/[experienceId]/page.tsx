// ============================================
// MEMBER VIEW: /experience/[experienceId]
// ============================================
// This is the main page that loads inside the
// Whop iframe when a member opens the app.
// It authenticates the user, loads their data,
// and renders the gamification dashboard.
// ============================================

import { headers } from "next/headers";
import { getCurrentUser, getWhopUserProfile } from "@/lib/whop-api";
import { getOrCreateMember, updateStreak, seedDefaultBadges, getRank, getNextRank, getRankProgress } from "@/lib/gamification";
import { db } from "@/lib/db";
import { GamificationApp } from "@/components/GamificationApp";

interface PageProps {
  params: Promise<{ experienceId: string }>;
}

// ============================================
// Error UI — shown if anything goes wrong
// ============================================
function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0A0A0F", color: "#E5E7EB",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "#A78BFA" }}>
          GamifyLevel
        </h1>
        <p style={{ color: "#9CA3AF", marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{
          padding: 16, borderRadius: 12,
          background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
          fontSize: 13, color: "#C4B5FD", lineHeight: 1.6,
        }}>
          Your XP, streaks, and leaderboard data will appear here once connected.
        </div>
      </div>
    </div>
  );
}

export default async function ExperiencePage({ params }: PageProps) {
  // ============================================
  // PARSE PARAMS
  // ============================================
  const { experienceId } = await params;

  // ============================================
  // AUTH CHECK
  // ============================================
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    const headersList = await headers();
    user = await getCurrentUser(headersList);
  } catch {
    // Token verification failed — treat as unauthenticated
  }

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0A0A0F", color: "#E5E7EB",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Authentication Required</h1>
          <p style={{ color: "#9CA3AF" }}>Please access this app from within your Whop community.</p>
        </div>
      </div>
    );
  }

  // ============================================
  // LOAD DATA (wrapped in try-catch so DB issues
  // never produce a blank crash page)
  // ============================================
  try {
    const userExperienceId = user.experienceId ?? experienceId;
    const companyId = user.companyId ?? "";

    // ROUND 1 (parallel): Whop profile + member upsert at the same time.
    // This hides the Neon cold-start latency behind the Whop API call.
    const [profile, member] = await Promise.all([
      getWhopUserProfile(user.userId),
      getOrCreateMember(user.userId, userExperienceId, companyId),
    ]);

    // ROUND 2 (parallel): streak update + badge seed + all 4 data reads.
    // Running these 6 ops concurrently keeps total latency well within
    // Vercel's 10-second function timeout even on Neon cold starts.
    const [streakMember, , activities, leaderboardMembers, badges, rewards] =
      await Promise.all([
        updateStreak(member.id),
        seedDefaultBadges(userExperienceId),
        db.activity.findMany({
          where: { memberId: member.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        db.member.findMany({
          where: { experienceId: userExperienceId },
          orderBy: { totalXp: "desc" },
          take: 20,
        }),
        db.badge.findMany({
          where: { experienceId: userExperienceId },
          include: {
            memberBadges: { where: { memberId: member.id } },
          },
        }),
        db.reward.findMany({
          where: { experienceId: userExperienceId, isActive: true },
          include: {
            claimedRewards: { where: { memberId: member.id } },
          },
        }),
      ]);

    // Use the post-streak member (or the original if no streak change today)
    const updatedMember = streakMember ?? member;
    if (!updatedMember) throw new Error("Member not found after upsert");

    // ============================================
    // PREPARE DATA FOR CLIENT
    // ============================================
    const rank = getRank(updatedMember.totalXp);
    const nextRank = getNextRank(updatedMember.totalXp);
    const rankProgress = getRankProgress(updatedMember.totalXp);

    const memberData = {
      id: updatedMember.id,
      userId: updatedMember.userId,
      // Use real Whop profile name/avatar when available; fall back to DB value
      displayName: (profile.name && profile.name !== "Member") ? profile.name : updatedMember.displayName,
      avatarUrl: profile.avatarUrl ?? updatedMember.avatarUrl,
      totalXp: updatedMember.totalXp,
      currentStreak: updatedMember.currentStreak,
      longestStreak: updatedMember.longestStreak,
      rank: { name: rank.name, minXP: rank.minXP, color: rank.color, icon: rank.icon },
      nextRank: nextRank ? { name: nextRank.name, minXP: nextRank.minXP, color: nextRank.color, icon: nextRank.icon } : null,
      rankProgress,
    };

    const activityData = activities.map((a) => ({
      id: a.id,
      action: a.action,
      description: a.description,
      xpEarned: a.xpEarned,
      icon: a.icon,
      createdAt: a.createdAt.toISOString(),
    }));

    const leaderboardData = leaderboardMembers.map((m, i) => ({
      rank: i + 1,
      id: m.id,
      userId: m.userId,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      totalXp: m.totalXp,
      currentStreak: m.currentStreak,
      isCurrentUser: m.userId === user!.userId,
    }));

    const badgeData = badges.map((b) => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      description: b.description,
      criteriaType: b.criteriaType,
      criteriaValue: b.criteriaValue,
      unlocked: b.memberBadges.length > 0,
      earnedAt: b.memberBadges[0]?.earnedAt?.toISOString(),
    }));

    const rewardData = rewards.map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      description: r.description,
      xpCost: r.xpCost,
      totalSupply: r.totalSupply,
      claimed: r.claimed,
      isActive: r.isActive,
      userClaimed: r.claimedRewards.length > 0,
    }));

    // ============================================
    // RENDER
    // ============================================
    return (
      <GamificationApp
        member={memberData}
        activities={activityData}
        leaderboard={leaderboardData}
        badges={badgeData}
        rewards={rewardData}
        isAdmin={user.isAdmin}
      />
    );
  } catch (error) {
    // Log the real error server-side for debugging
    console.error("[GamifyLevel] Experience page error:", error);

    // Determine a helpful user-facing message
    const errMsg = error instanceof Error ? error.message : String(error);
    const isDbError =
      errMsg.includes("database") ||
      errMsg.includes("prisma") ||
      errMsg.includes("connect") ||
      errMsg.includes("relation") ||
      errMsg.includes("does not exist");

    const displayMessage = isDbError
      ? "Database connection issue. The app is being set up — please try again shortly."
      : "Something went wrong loading your data. Please refresh or try again.";

    return <ErrorScreen message={displayMessage} />;
  }
}
