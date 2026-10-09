// ============================================
// API: /api/xp
// ============================================
// GET  - Get member's XP data & activity
//
// NOTE: there is intentionally NO POST handler. XP is only awarded
// server-side via verified Whop webhooks (see /api/webhook).
// A previous POST endpoint let any authenticated member mint
// arbitrary XP with no proof of action, so it was removed.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/whop-api";
import { getOrCreateMember, updateStreak, seedDefaultBadges } from "@/lib/gamification";
import { db } from "@/lib/db";
import { headers } from "next/headers";

// GET /api/xp?experienceId=xxx
// Returns current member data + recent activity
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    if (!user || !user.experienceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create member
    const member = await getOrCreateMember(
      user.userId,
      user.experienceId,
      user.companyId ?? ""
    );

    // Seed default badges if this is a new community
    await seedDefaultBadges(user.experienceId);

    // Update streak on visit
    await updateStreak(member.id);

    // Get recent activities
    const activities = await db.activity.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      member: {
        id: member.id,
        userId: member.userId,
        displayName: member.displayName,
        avatarUrl: member.avatarUrl,
        totalXp: member.totalXp,
        currentStreak: member.currentStreak,
        longestStreak: member.longestStreak,
      },
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        xpEarned: a.xpEarned,
        icon: a.icon,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/xp error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
