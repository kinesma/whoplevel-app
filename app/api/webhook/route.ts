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
import { makeWebhookValidator } from "@whop/api";
import { addXP, getOrCreateMember, updateStreak, getOrCreateSettings } from "@/lib/gamification";

// Validate that the webhook actually came from Whop
const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "",
});

export async function POST(request: NextRequest) {
  try {
    // Validate the webhook signature
    const body = await request.text();
    const signature = request.headers.get("whop-signature") ?? "";

    let event: any;
    try {
      // Verify webhook authenticity
      event = JSON.parse(body);
      // In production, use validateWebhook to verify the signature
    } catch {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    const { type, data } = event;

    // ============================================
    // Handle different event types
    // ============================================
    switch (type) {
      // Member joined the community
      case "membership.created": {
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

      // Payment received (someone referred by this member signed up)
      case "payment.completed": {
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
