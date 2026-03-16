// ============================================
// API: /api/admin
// ============================================
// GET   - Get admin stats + settings
// PATCH - Update settings
// POST  - Create a new reward
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/whop-api";
import { getOrCreateSettings, updateSettings, getAdminStats } from "@/lib/gamification";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    if (!user || !user.experienceId || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const [settings, stats] = await Promise.all([
      getOrCreateSettings(user.experienceId, user.companyId ?? ""),
      getAdminStats(user.experienceId),
    ]);

    return NextResponse.json({ settings, stats });
  } catch (error) {
    console.error("GET /api/admin error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    if (!user || !user.experienceId || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await updateSettings(user.experienceId, body);

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("PATCH /api/admin error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST - Create a new reward
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const user = await getCurrentUser(headersList);
    if (!user || !user.experienceId || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, icon, description, xpCost, totalSupply } = body;

    if (!name || !icon || !xpCost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const reward = await db.reward.create({
      data: {
        experienceId: user.experienceId,
        name,
        icon,
        description: description ?? "",
        xpCost,
        totalSupply: totalSupply ?? -1,
      },
    });

    return NextResponse.json({ reward });
  } catch (error) {
    console.error("POST /api/admin error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
