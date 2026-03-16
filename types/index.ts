// ============================================
// Shared TypeScript Types
// ============================================

export interface WhopUser {
  userId: string;
  experienceId: string | null;
  companyId: string | null;
  isAdmin: boolean;
}

export interface MemberData {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  rank: RankData;
  nextRank: RankData | null;
  rankProgress: number;
}

export interface RankData {
  name: string;
  minXP: number;
  color: string;
  icon: string;
}

export interface ActivityData {
  id: string;
  action: string;
  description: string;
  xpEarned: number;
  icon: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  currentStreak: number;
  isCurrentUser: boolean;
}

export interface BadgeData {
  id: string;
  name: string;
  icon: string;
  description: string;
  criteriaType: string;
  criteriaValue: number;
  unlocked: boolean;
  earnedAt?: string;
}

export interface RewardData {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  xpCost: number;
  totalSupply: number;
  claimed: number;
  isActive: boolean;
  userClaimed: boolean;
}

export interface AppSettingsData {
  xpPerPost: number;
  xpPerLesson: number;
  xpPerLogin: number;
  xpPerReferral: number;
  xpPerQuiz: number;
  xpPerFeedback: number;
  leaderboardEnabled: boolean;
  badgesEnabled: boolean;
  rewardsEnabled: boolean;
  streaksEnabled: boolean;
}

export interface AdminStats {
  totalMembers: number;
  activeToday: number;
  xpEarnedToday: number;
  avgStreak: number;
}
