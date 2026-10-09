// ============================================
// API: /api/badges
// ============================================
// GET  - Returns all badges + which ones user earned
// POST - Admin: create a new badge
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/whop-api";
import { getOrCreateMember, seedDefaultBadges } from "@/lib/gamification";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    if (!user || !user.experienceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await seedDefaultBadges(user.experienceId);

    const member = await getOrCreateMember(
      user.userId,
      user.experienceId,
      user.companyId ?? ""
    );

    // Get all badges for this community
    const badges = await db.badge.findMany({
      where: { experienceId: user.experienceId },
      include: {
        memberBadges: {
          where: { memberId: member.id },
        },
      },
    });

    const badgeData = badges.map((b) => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      description: b.description,
      criteriaType: b.criteriaType,
      criteriaValue: b.criteriaValue,
      unlocked: b.memberBadges.length > 0,
      earnedAt: b.memberBadges[0]?.earnedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ badges: badgeData });
  } catch (error) {
    console.error("GET /api/badges error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    // Admin check via companyId match (Whop's JWT does not carry a
    // reliable isAdmin field — see lib/whop-api.ts). The badge is
    // created for the caller's own company context only.
    const body = await request.json();
    const { companyId = "", name, icon, description, criteriaType, criteriaValue } = body;
    if (!user || !user.companyId || user.companyId !== companyId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const experienceId = user.experienceId ?? companyId;

    if (!name || !icon || !criteriaType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const badge = await db.badge.create({
      data: {
        experienceId,
        name,
        icon,
        description: description ?? "",
        criteriaType,
        criteriaValue: criteriaValue ?? 0,
      },
    });

    return NextResponse.json({ badge });
  } catch (error) {
    console.error("POST /api/badges error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
