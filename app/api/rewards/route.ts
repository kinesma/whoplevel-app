// ============================================
// API: /api/rewards
// ============================================
// GET  - Returns all rewards + claim status
// POST - Claim a reward (deducts XP)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/whop-api";
import { getOrCreateMember, claimReward } from "@/lib/gamification";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    if (!user || !user.experienceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await getOrCreateMember(
      user.userId,
      user.experienceId,
      user.companyId ?? ""
    );

    const rewards = await db.reward.findMany({
      where: { experienceId: user.experienceId, isActive: true },
      include: {
        claimedRewards: {
          where: { memberId: member.id },
        },
      },
    });

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

    return NextResponse.json({ rewards: rewardData, userXp: member.totalXp });
  } catch (error) {
    console.error("GET /api/rewards error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    if (!user || !user.experienceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json({ error: "Missing rewardId" }, { status: 400 });
    }

    const member = await getOrCreateMember(
      user.userId,
      user.experienceId,
      user.companyId ?? ""
    );

    const result = await claimReward(member.id, rewardId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/rewards error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
