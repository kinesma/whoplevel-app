// ============================================
// API: /api/webhook
// ============================================
// Whop sends webhook events when members do things:
// - Join a community
// - Complete a course lesson
// - Post in chat
// - etc.
//
// This handler listens for those events and
// automatically awards XP to members.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { addXP, getOrCreateMember, updateStreak, getOrCreateSettings } from "@/lib/gamification";

// ============================================
// Webhook signature verification.
// We verify the HMAC-SHA256 signature manually (same algorithm as
// @whop/api's makeWebhookValidator) instead of using the SDK's
// validator, because the SDK also gates on api_version === "v5"
// while this webhook is configured as API v1 in the Whop dashboard.
// Rejecting on version would break legitimate v1 deliveries.
// Header format: "t=<unix_ts>,v1=<hex_hmac>"
// Signed payload: "<timestamp>.<raw_body>"
// ============================================
async function verifySignature(request: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.WHOP_WEBHOOK_SECRET ?? "";
  if (!secret) {
    console.error("WHOP_WEBHOOK_SECRET is not set — refusing webhook");
    return false;
  }
  const header = request.headers.get("whop-signature") ?? "";
  const [timestampPart, signaturePart] = header.split(",");
  const timestamp = timestampPart?.split("=")[1] ?? "";
  const sentSignature = signaturePart?.split("=")[1] ?? "";
  if (!timestamp || !sentSignature) return false;

  // Reject stale requests (>5 min) to prevent replay attacks
  const nowSec = Math.round(Date.now() / 1000);
  if (Number.isNaN(parseInt(timestamp)) || Math.abs(nowSec - parseInt(timestamp)) > 300) {
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${timestamp}.${rawBody}`)
    );
    const expected = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return expected === sentSignature.toLowerCase();
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Reject forged webhooks — without this, anyone could POST
    // fake events and mint unlimited XP.
    if (!(await verifySignature(request, body))) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    // Whop sends v1 payloads as { type, data } and v5 as { action, data }.
    // Accept both so the handler works regardless of webhook API version.
    const eventType = event.action ?? event.type;
    const { data } = event;

    // ============================================
    // Handle different event types
    // ============================================
    switch (eventType) {
      // Member joined the community (v1: membership.created,
      // v5: membership.went_valid / app_membership.went_valid)
      case "membership.created":
      case "membership.went_valid":
      case "app_membership.went_valid": {
        const { user_id, experience_id, company_id } = data;
        if (!user_id || !experience_id) break;

        const member = await getOrCreateMember(user_id, experience_id, company_id ?? "");
        const settings = await getOrCreateSettings(experience_id, company_id ?? "");

        await addXP(member.id, "login", "Joined the community! Welcome!", settings.xpPerLogin, "🎉");
        break;
      }

      // Member completed a course lesson
      case "lesson.completed": {
        const { user_id, experience_id, company_id, lesson_name } = data;
        if (!user_id || !experience_id) break;

        const member = await getOrCreateMember(user_id, experience_id, company_id ?? "");
        const settings = await getOrCreateSettings(experience_id, company_id ?? "");

        await addXP(
          member.id,
          "lesson",
          `Completed lesson: ${lesson_name ?? "Unknown"}`,
          settings.xpPerLesson,
          "📖"
        );
        await updateStreak(member.id);
        break;
      }

      // Member posted in chat
      case "chat.message.created": {
        const { user_id, experience_id, company_id } = data;
        if (!user_id || !experience_id) break;

        const member = await getOrCreateMember(user_id, experience_id, company_id ?? "");
        const settings = await getOrCreateSettings(experience_id, company_id ?? "");

        await addXP(member.id, "post", "Posted in community chat", settings.xpPerPost, "💬");
        await updateStreak(member.id);
        break;
      }

      // Member completed a quiz
      case "quiz.completed": {
        const { user_id, experience_id, company_id, quiz_name } = data;
        if (!user_id || !experience_id) break;

        const member = await getOrCreateMember(user_id, experience_id, company_id ?? "");
        const settings = await getOrCreateSettings(experience_id, company_id ?? "");

        await addXP(
          member.id,
          "quiz",
          `Completed quiz: ${quiz_name ?? "Unknown"}`,
          settings.xpPerQuiz,
          "✅"
        );
        await updateStreak(member.id);
        break;
      }

      // Payment received (v1: payment.completed,
      // v5: payment.succeeded / app_payment.succeeded).
      // If it carries an affiliate, the referrer earns XP.
      case "payment.completed":
      case "payment.succeeded":
      case "app_payment.succeeded": {
        const { affiliate_user_id, experience_id, company_id } = data;
        if (!affiliate_user_id || !experience_id) break;

        const member = await getOrCreateMember(affiliate_user_id, experience_id, company_id ?? "");
        const settings = await getOrCreateSettings(experience_id, company_id ?? "");

        await addXP(
          member.id,
          "referral",
          "Referred a new member!",
          settings.xpPerReferral,
          "👥"
        );
        break;
      }

      default:
        // Unknown event type — ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
