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

// ============================================
// requireAdmin: verify the caller has a valid Whop JWT.
// Whop only routes company admins to /dashboard/[companyId],
// so a valid JWT from that context is sufficient proof.
// If the JWT carries a companyId, we verify it matches the
// requested one to prevent cross-company access.
// ============================================
async function requireAdmin(companyId: string) {
  const headersList = await headers();
  const user = await getCurrentUser(headersList);
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  // Cross-company guard: if JWT has a companyId, it must match.
  // If JWT has no companyId (null), we trust Whop's routing.
  if (user.companyId && user.companyId !== companyId) {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  // Fall back to companyId as the settings key when JWT lacks experienceId
  const experienceId = user.experienceId ?? companyId;
  return { user, experienceId };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") ?? "";

    const auth = await requireAdmin(companyId);
    if ("error" in auth) return auth.error;
    const { experienceId } = auth;

    const [settings, stats] = await Promise.all([
      getOrCreateSettings(experienceId, companyId),
      getAdminStats(experienceId),
    ]);

    return NextResponse.json({ settings, stats });
  } catch (error) {
    console.error("GET /api/admin error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId = "", ...settingsData } = body;

    const auth = await requireAdmin(companyId);
    if ("error" in auth) return auth.error;
    const { experienceId } = auth;

    const updated = await updateSettings(experienceId, settingsData);
    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("PATCH /api/admin error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId = "", name, icon, description, xpCost, totalSupply } = body;

    const auth = await requireAdmin(companyId);
    if ("error" in auth) return auth.error;
    const { experienceId } = auth;

    if (!name || !icon || !xpCost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const reward = await db.reward.create({
      data: {
        experienceId,
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
