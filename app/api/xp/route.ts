// ============================================
// API: /api/xp
// ============================================
// POST - Add XP to a member
// GET  - Get member's XP data & activity
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/whop-api";
import { addXP, getOrCreateMember, updateStreak, getOrCreateSettings, seedDefaultBadges } from "@/lib/gamification";
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

// POST /api/xp
// Body: { action, description, icon? }
// Adds XP based on the action type and community settings
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    if (!user || !user.experienceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, description, icon } = body;

    if (!action || !description) {
      return NextResponse.json({ error: "Missing action or description" }, { status: 400 });
    }

    // Get community settings for XP values
    const settings = await getOrCreateSettings(user.experienceId, user.companyId ?? "");

    // Map action type to XP value from settings
    const xpMap: Record<string, number> = {
      post: settings.xpPerPost,
      lesson: settings.xpPerLesson,
      login: settings.xpPerLogin,
      referral: settings.xpPerReferral,
      quiz: settings.xpPerQuiz,
      feedback: settings.xpPerFeedback,
    };

    const xpAmount = xpMap[action] ?? 10; // Default to 10 if unknown action

    // Get or create the member
    const member = await getOrCreateMember(
      user.userId,
      user.experienceId,
      user.companyId ?? ""
    );

    // Add XP
    const result = await addXP(
      member.id,
      action,
      description,
      xpAmount,
      icon ?? "⚡"
    );

    return NextResponse.json({
      success: true,
      xpEarned: xpAmount,
      totalXp: result.member.totalXp,
      activityId: result.activity.id,
    });
  } catch (error) {
    console.error("POST /api/xp error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
