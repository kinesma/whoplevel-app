// ============================================
// ADMIN VIEW: /dashboard/[companyId]
// ============================================
// This page is shown to the whop owner/admin.
// They can configure point values, manage
// rewards, and see engagement analytics.
// ============================================

import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/whop-api";
import { getOrCreateSettings, getAdminStats } from "@/lib/gamification";
import { db } from "@/lib/db";
import { AdminDashboard } from "@/components/AdminDashboard";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { companyId } = await params;
  const headersList = await headers();
  const user = await getCurrentUser(headersList);

  if (!user || !user.isAdmin) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0A0A0F", color: "#E5E7EB",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Admin Access Required</h1>
          <p style={{ color: "#9CA3AF" }}>You need to be an admin of this community to access settings.</p>
        </div>
      </div>
    );
  }

  const experienceId = user.experienceId ?? "";
  const settings = await getOrCreateSettings(experienceId, companyId);
  const stats = await getAdminStats(experienceId);

  // Get all rewards for management
  const rewards = await db.reward.findMany({
    where: { experienceId },
    orderBy: { createdAt: "desc" },
  });

  const settingsData = {
    xpPerPost: settings.xpPerPost,
    xpPerLesson: settings.xpPerLesson,
    xpPerLogin: settings.xpPerLogin,
    xpPerReferral: settings.xpPerReferral,
    xpPerQuiz: settings.xpPerQuiz,
    xpPerFeedback: settings.xpPerFeedback,
    leaderboardEnabled: settings.leaderboardEnabled,
    badgesEnabled: settings.badgesEnabled,
    rewardsEnabled: settings.rewardsEnabled,
    streaksEnabled: settings.streaksEnabled,
  };

  const rewardList = rewards.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    description: r.description,
    xpCost: r.xpCost,
    totalSupply: r.totalSupply,
    claimed: r.claimed,
    isActive: r.isActive,
    userClaimed: false,
  }));

  return (
    <AdminDashboard
      settings={settingsData}
      stats={stats}
      rewards={rewardList}
    />
  );
}
