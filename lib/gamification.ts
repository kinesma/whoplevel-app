// ============================================
// WhopLevel Gamification Engine
// ============================================
// All the core logic for:
// - Adding XP to members
// - Tracking streaks
// - Checking & awarding badges
// - Building leaderboards
// - Managing rewards
// ============================================

import { db } from "./db";

// ============================================
// RANK DEFINITIONS
// ============================================
export const RANKS = [
  { name: "Rookie", minXP: 0, color: "#6B7280", icon: "🌱" },
  { name: "Bronze", minXP: 500, color: "#CD7F32", icon: "🥉" },
  { name: "Silver", minXP: 1500, color: "#C0C0C0", icon: "🥈" },
  { name: "Gold", minXP: 3500, color: "#FFD700", icon: "🥇" },
  { name: "Platinum", minXP: 7000, color: "#E5E4E2", icon: "💎" },
  { name: "Diamond", minXP: 15000, color: "#B9F2FF", icon: "👑" },
] as const;

export function getRank(xp: number) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXP) current = rank;
  }
  return current;
}

export function getNextRank(xp: number) {
  for (const rank of RANKS) {
    if (xp < rank.minXP) return rank;
  }
  return null;
}

export function getRankProgress(xp: number) {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return Math.round((progress / range) * 100);
}

// ============================================
// GET OR CREATE MEMBER
// ============================================
export async function getOrCreateMember(
  userId: string,
  experienceId: string,
  companyId: string,
  displayName?: string,
  avatarUrl?: string
) {
  return db.member.upsert({
    where: {
      userId_experienceId: { userId, experienceId },
    },
    update: {
      lastActiveAt: new Date(),
      ...(displayName && { displayName }),
      ...(avatarUrl && { avatarUrl }),
    },
    create: {
      userId,
      experienceId,
      companyId,
      displayName: displayName ?? "Member",
      avatarUrl,
    },
    include: {
      memberBadges: { include: { badge: true } },
    },
  });
}

// ============================================
// ADD XP TO A MEMBER
// ============================================
export async function addXP(
  memberId: string,
  action: string,
  description: string,
  xpAmount: number,
  icon: string = "⚡"
) {
  // Create the activity record and update member XP in a transaction
  const [activity, member] = await db.$transaction([
    db.activity.create({
      data: {
        memberId,
        action,
        description,
        xpEarned: xpAmount,
        icon,
      },
    }),
    db.member.update({
      where: { id: memberId },
      data: {
        totalXp: { increment: xpAmount },
        lastActiveAt: new Date(),
      },
    }),
  ]);

  // Check for new badge unlocks after XP gain
  await checkBadgeUnlocks(memberId, member.experienceId);

  return { activity, member };
}

// ============================================
// UPDATE STREAK
// ============================================
export async function updateStreak(memberId: string) {
  const member = await db.member.findUnique({ where: { id: memberId } });
  if (!member) return null;

  const now = new Date();
  const lastActive = new Date(member.lastActiveAt);

  // Calculate days since last activity
  const diffMs = now.getTime() - lastActive.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let newStreak = member.currentStreak;

  if (diffDays === 0) {
    // Same day — no change
    return member;
  } else if (diffDays === 1) {
    // Consecutive day — increment streak!
    newStreak = member.currentStreak + 1;
  } else {
    // Missed a day — reset streak
    newStreak = 1;
  }

  const longestStreak = Math.max(member.longestStreak, newStreak);

  return db.member.update({
    where: { id: memberId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastActiveAt: now,
    },
  });
}

// ============================================
// GET LEADERBOARD
// ============================================
export async function getLeaderboard(
  experienceId: string,
  limit: number = 20,
  period: "weekly" | "monthly" | "all-time" = "all-time"
) {
  if (period === "all-time") {
    // Simple: just sort by total XP
    return db.member.findMany({
      where: { experienceId },
      orderBy: { totalXp: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        displayName: true,
        avatarUrl: true,
        totalXp: true,
        currentStreak: true,
      },
    });
  }

  // For weekly/monthly: sum XP earned in that period
  const now = new Date();
  const startDate = new Date();
  if (period === "weekly") {
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate.setMonth(now.getMonth() - 1);
  }

  // Get members with their recent XP
  const members = await db.member.findMany({
    where: { experienceId },
    include: {
      activities: {
        where: { createdAt: { gte: startDate } },
        select: { xpEarned: true },
      },
    },
  });

  // Calculate period XP and sort
  const ranked = members
    .map((m) => ({
      id: m.id,
      userId: m.userId,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      totalXp: m.activities.reduce((sum, a) => sum + a.xpEarned, 0),
      currentStreak: m.currentStreak,
    }))
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, limit);

  return ranked;
}

// ============================================
// CHECK & AWARD BADGE UNLOCKS
// ============================================
export async function checkBadgeUnlocks(memberId: string, experienceId: string) {
  const member = await db.member.findUnique({
    where: { id: memberId },
    include: { memberBadges: true, activities: true },
  });
  if (!member) return [];

  const badges = await db.badge.findMany({ where: { experienceId } });
  const earnedBadgeIds = new Set(member.memberBadges.map((mb) => mb.badgeId));
  const newBadges: string[] = [];

  for (const badge of badges) {
    if (earnedBadgeIds.has(badge.id)) continue; // Already earned

    let earned = false;

    switch (badge.criteriaType) {
      case "xp":
        earned = member.totalXp >= badge.criteriaValue;
        break;
      case "streak":
        earned = member.currentStreak >= badge.criteriaValue;
        break;
      case "activity_count":
        earned = member.activities.length >= badge.criteriaValue;
        break;
      // "manual" badges are awarded by admin only
    }

    if (earned) {
      await db.memberBadge.create({
        data: { memberId, badgeId: badge.id },
      });
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

// ============================================
// CLAIM A REWARD
// ============================================
export async function claimReward(memberId: string, rewardId: string) {
  const member = await db.member.findUnique({ where: { id: memberId } });
  const reward = await db.reward.findUnique({ where: { id: rewardId } });

  if (!member || !reward) {
    return { success: false, error: "Member or reward not found" };
  }

  if (!reward.isActive) {
    return { success: false, error: "Reward is no longer available" };
  }

  if (member.totalXp < reward.xpCost) {
    return { success: false, error: "Not enough XP" };
  }

  if (reward.totalSupply !== -1 && reward.claimed >= reward.totalSupply) {
    return { success: false, error: "Reward is sold out" };
  }

  // Check if already claimed
  const existing = await db.claimedReward.findUnique({
    where: { memberId_rewardId: { memberId, rewardId } },
  });
  if (existing) {
    return { success: false, error: "Already claimed" };
  }

  // Deduct XP and create claim in a transaction
  await db.$transaction([
    db.member.update({
      where: { id: memberId },
      data: { totalXp: { decrement: reward.xpCost } },
    }),
    db.reward.update({
      where: { id: rewardId },
      data: { claimed: { increment: 1 } },
    }),
    db.claimedReward.create({
      data: { memberId, rewardId },
    }),
  ]);

  return { success: true };
}

// ============================================
// GET OR CREATE APP SETTINGS
// ============================================
export async function getOrCreateSettings(experienceId: string, companyId: string) {
  return db.appSettings.upsert({
    where: { experienceId },
    update: {},
    create: { experienceId, companyId },
  });
}

// ============================================
// UPDATE APP SETTINGS (admin only)
// ============================================
export async function updateSettings(
  experienceId: string,
  settings: {
    xpPerPost?: number;
    xpPerLesson?: number;
    xpPerLogin?: number;
    xpPerReferral?: number;
    xpPerQuiz?: number;
    xpPerFeedback?: number;
    leaderboardEnabled?: boolean;
    badgesEnabled?: boolean;
    rewardsEnabled?: boolean;
    streaksEnabled?: boolean;
  }
) {
  return db.appSettings.update({
    where: { experienceId },
    data: settings,
  });
}

// ============================================
// SEED DEFAULT BADGES for a new community
// ============================================
export async function seedDefaultBadges(experienceId: string) {
  const existingCount = await db.badge.count({ where: { experienceId } });
  if (existingCount > 0) return; // Already seeded

  const defaultBadges = [
    { name: "First Post", icon: "✍️", description: "Made your first post", criteriaType: "activity_count", criteriaValue: 1 },
    { name: "7-Day Streak", icon: "🔥", description: "7 consecutive days active", criteriaType: "streak", criteriaValue: 7 },
    { name: "Helpful", icon: "🤝", description: "Completed 10 activities", criteriaType: "activity_count", criteriaValue: 10 },
    { name: "30-Day Streak", icon: "⚡", description: "30 consecutive days active", criteriaType: "streak", criteriaValue: 30 },
    { name: "XP Hunter", icon: "🎯", description: "Earned 1,000 XP", criteriaType: "xp", criteriaValue: 1000 },
    { name: "Rising Star", icon: "⭐", description: "Earned 5,000 XP", criteriaType: "xp", criteriaValue: 5000 },
    { name: "Legend", icon: "🏆", description: "Earned 10,000 XP", criteriaType: "xp", criteriaValue: 10000 },
    { name: "Diamond", icon: "💎", description: "Earned 15,000 XP", criteriaType: "xp", criteriaValue: 15000 },
  ];

  await db.badge.createMany({
    data: defaultBadges.map((b) => ({ ...b, experienceId })),
  });
}

// ============================================
// GET ADMIN DASHBOARD STATS
// ============================================
export async function getAdminStats(experienceId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalMembers, activeToday, xpToday, avgStreak] = await Promise.all([
    db.member.count({ where: { experienceId } }),
    db.member.count({
      where: { experienceId, lastActiveAt: { gte: todayStart } },
    }),
    db.activity.aggregate({
      where: {
        member: { experienceId },
        createdAt: { gte: todayStart },
      },
      _sum: { xpEarned: true },
    }),
    db.member.aggregate({
      where: { experienceId },
      _avg: { currentStreak: true },
    }),
  ]);

  return {
    totalMembers,
    activeToday,
    xpEarnedToday: xpToday._sum.xpEarned ?? 0,
    avgStreak: Math.round((avgStreak._avg.currentStreak ?? 0) * 10) / 10,
  };
}
