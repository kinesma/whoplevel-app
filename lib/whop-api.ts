// ============================================
// Whop API Client & Authentication
// ============================================
// This file sets up the Whop API connection and
// provides helper functions for authenticating
// users when the app loads inside a Whop iframe.
// ============================================

import { WhopApi, makeUserTokenVerifier } from "@whop/api";

// Initialize the Whop API client
// This is used to make API calls to Whop (get user info, etc.)
export const whopApi = WhopApi({
  appApiKey: process.env.WHOP_API_KEY ?? "",
  onBehalfOfUserId: process.env.WHOP_AGENT_USER_ID,
});

// Create a token verifier
// When your app loads inside the Whop iframe, Whop sends a
// token in the request headers. This verifies that token is real.
export const verifyUserToken = makeUserTokenVerifier({
  appId: process.env.WHOP_APP_ID ?? "",
  dontThrow: true, // Returns null instead of throwing on invalid tokens
});

// ============================================
// Helper: Get the current user from a request
// ============================================
export async function getCurrentUser(headersList: Headers) {
  const tokenData = await verifyUserToken(headersList);
  if (!tokenData) return null;

  return {
    userId: tokenData.userId,
    experienceId: tokenData.experienceId ?? null,
    companyId: tokenData.companyId ?? null,
    isAdmin: tokenData.isAdmin ?? false,
  };
}

// ============================================
// Helper: Get user profile from Whop
// ============================================
export async function getWhopUserProfile(userId: string) {
  try {
    const user = await whopApi.PublicUser({ userId });
    return {
      id: userId,
      name: user.publicUser?.name ?? "Member",
      avatarUrl: user.publicUser?.profilePicUrl ?? null,
    };
  } catch {
    return { id: userId, name: "Member", avatarUrl: null };
  }
}
