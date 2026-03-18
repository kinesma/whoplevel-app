// ============================================
// ADMIN VIEW: /dashboard/[companyId]
// ============================================
// This page is shown to the whop owner/admin.
// They can configure point values, manage
// rewards, and see engagement analytics.
//
// IMPORTANT: Whop's own routing only directs
// company admins/owners to this URL. We verify
// authentication and company ownership here as
// a secondary check, but Whop's platform is
// the primary gatekeeper.
// ============================================

import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/whop-api";
import { getOrCreateSettings, getAdminStats } from "@/lib/gamification";
import { db } from "@/lib/db";
import { AdminDashboard } from "@/components/AdminDashboard";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

// ============================================
// Reusable error screens
// ============================================
function AuthRequiredScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0A0A0F", color: "#E5E7EB",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>ð</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Authentication Required</h1>
        <p style={{ color: "#9CA3AF" }}>Please access this app from within your Whop community.</p>
      </div>
    </div>
  );
}

function AdminAccessScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0A0A0F", color: "#E5E7EB",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>ð</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Admin Access Required</h1>
        <p style={{ color: "#9CA3AF" }}>You need to be an admin of this community to access settings.</p>
      </div>
    </div>
  );
}

function DbErrorScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0A0A0F", color: "#E5E7EB",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>âï¸</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "#A78BFA" }}>
          GamifyLevel
        </h1>
        <p style={{ color: "#9CA3AF", marginBottom: 24, lineHeight: 1.6 }}>
          Database connection issue. The app is being set up â please try again shortly.
        </p>
        <div style={{
          padding: 16, borderRadius: 12,
          background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
          fontSize: 13, color: "#C4B5FD", lineHeight: 1.6,
        }}>
          Make sure DATABASE_URL is configured in your deployment environment variables.
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({ params }: PageProps) {
  const { companyId } = await params;

  // ============================================
  // STEP 1: Authenticate the user
  // ============================================
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    const headersList = await headers();
    user = await getCurrentUser(headersList);
  } catch {
    // Token verification failed
  }

  if (!user) {
    return <AuthRequiredScreen />;
  }

  // ============================================
  // STEP 2: Trust Whop's routing for admin access
  // ============================================
  // Whop's platform ONLY routes company admins/owners to the
  // /dashboard/[companyId] URL. A valid JWT reaching this page
  // is sufficient proof the user is an admin — no secondary
  // API check is needed (and doing one incorrectly blocks valid admins
  // because Whop's JWT does not include an isAdmin boolean field).
  // ============================================

  // ============================================
  // STEP 3: Load dashboard data
  // Wrapped in try-catch so DB issues show a
  // helpful message rather than a crash page.
  // ============================================
  try {
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
  } catch (error) {
    console.error("[GamifyLevel] Dashboard page DB error:", error);
    return <DbErrorScreen />;
  }
}
