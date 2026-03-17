// ============================================
// Whop API Client & Authentication
// ============================================
// This file sets up the Whop API connection and
// provides helper functions for authenticating
// users when the app loads inside a Whop iframe.
// ============================================

import { WhopServerSdk, makeUserTokenVerifier } from "@whop/api";

// ============================================
// Safe SDK initialization
// Guards against missing env vars at module
// load time, which would crash the server.
// ============================================

let _whopApi: ReturnType<typeof WhopServerSdk> | null = null;
let _verifyUserToken: ReturnType<typeof makeUserTokenVerifier> | null = null;

function getWhopServerSdk() {
  if (!_whopApi) {
    _whopApi = WhopServerSdk({
      appApiKey: process.env.WHOP_API_KEY ?? "",
      appId: process.env.WHOP_APP_ID ?? "",
      onBehalfOfUserId: process.env.WHOP_AGENT_USER_ID,
    });
  }
  return _whopApi;
}

function getVerifier() {
  if (!_verifyUserToken) {
    _verifyUserToken = makeUserTokenVerifier({
      appId: process.env.WHOP_APP_ID ?? "",
      dontThrow: true,
    });
  }
  return _verifyUserToken;
}

// Keep named export for backwards compatibility
export const whopApi = new Proxy({} as ReturnType<typeof WhopServerSdk>, {
  get(_target, prop) {
    const api = getWhopServerSdk();
    return (api as Record<string | symbol, unknown>)[prop];
  },
});

// ============================================
// Helper: Get the current user from a request
// ============================================
export async function getCurrentUser(headersList: Headers) {
  try {
    const verifier = getVerifier();
    // Cast to any: @whop/api token payload has runtime fields not in SDK types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenData = await verifier(headersList) as any;
    if (!tokenData) return null;

    return {
      userId: tokenData.userId,
      experienceId: tokenData.experienceId ?? null,
      companyId: tokenData.companyId ?? null,
      isAdmin: tokenData.isAdmin ?? false,
    };
  } catch {
    return null;
  }
}

// ============================================
// Helper: Get user profile from Whop
// ============================================
export async function getWhopUserProfile(userId: string) {
  try {
    // Cast to any: @whop/api SDK types are incomplete for some methods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = getWhopServerSdk() as any;
    const user = await api.PublicUser({ userId });
    return {
      id: userId,
      name: user?.publicUser?.name ?? "Member",
      avatarUrl: user?.publicUser?.profilePicUrl ?? null,
    };
  } catch {
    return { id: userId, name: "Member", avatarUrl: null };
  }
}
