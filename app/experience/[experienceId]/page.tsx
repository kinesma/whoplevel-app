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

export default async function ExperiencePage({ params }: PageProps) {
  const { experienceId } = await params;
  const headersList = await headers();
  const user = await getCurrentUser(headersList);

  // ============================================
  // AUTH CHECK
  // ============================================
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
  // LOAD DATA
  // ============================================
  const userExperienceId = user.experienceId ?? experienceId;
  const companyId = user.companyId ?? "";

  // Get user profile from Whop
  const profile = await getWhopUserProfile(user.userId);

  // Get or create member record
  const member = await getOrCreateMember(
    user.userId,
    userExperienceId,
    companyId,
    profile.name,
    profile.avatarUrl ?? undefined
  );

  // Update streak
  await updateStreak(member.id);

  // Seed default badges if new community
  await seedDefaultBadges(userExperienceId);

  // Reload member after streak update
  const updatedMember = await db.member.findUnique({
    where: { id: member.id },
  });
  if (!updatedMember) throw new Error("Member not found");

  // Get recent activities
  const activities = await db.activity.findMany({
    where: { memberId: member.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Get leaderboard
  const leaderboardMembers = await db.member.findMany({
    where: { experienceId: userExperienceId },
    orderBy: { totalXp: "desc" },
    take: 20,
  });

  // Get badges
  const badges = await db.badge.findMany({
    where: { experienceId: userExperienceId },
    include: {
      memberBadges: { where: { memberId: member.id } },
    },
  });

  // Get rewards
  const rewards = await db.reward.findMany({
    where: { experienceId: userExperienceId, isActive: true },
    include: {
      claimedRewards: { where: { memberId: member.id } },
    },
  });

  // ============================================
  // PREPARE DATA FOR CLIENT
  // ============================================
  const rank = getRank(updatedMember.totalXp);
  const nextRank = getNextRank(updatedMember.totalXp);
  const rankProgress = getRankProgress(updatedMember.totalXp);

  const memberData = {
    id: updatedMember.id,
    userId: updatedMember.userId,
    displayName: updatedMember.displayName,
    avatarUrl: updatedMember.avatarUrl,
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
    isCurrentUser: m.userId === user.userId,
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
}
