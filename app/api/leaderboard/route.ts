// ============================================
// API: /api/leaderboard
// ============================================
// GET - Returns the leaderboard for a community
// Query: ?experienceId=xxx&period=weekly|monthly|all-time&limit=20
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/whop-api";
import { getLeaderboard } from "@/lib/gamification";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    if (!user || !user.experienceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") ?? "all-time") as "weekly" | "monthly" | "all-time";
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const members = await getLeaderboard(user.experienceId, limit, period);

    // Add rank numbers and mark current user
    const leaderboard = members.map((m, i) => ({
      rank: i + 1,
      id: m.id,
      userId: m.userId,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      totalXp: m.totalXp,
      currentStreak: m.currentStreak,
      isCurrentUser: m.userId === user.userId,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
