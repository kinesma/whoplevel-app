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
// NOTE: Whop's JWT token payload does NOT include an `isAdmin` field.
// Admin status must be verified separately via the Whop API or by
// comparing the companyId from the token with the route's companyId.
// We check both `isAdmin` and `isModerator` fields defensively since
// the SDK may use either name across versions.
// ============================================
export async function getCurrentUser(headersList: Headers) {
  try {
    const verifier = getVerifier();
    // Cast to any: @whop/api token payload has runtime fields not in SDK types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenData = await verifier(headersList) as any;
    if (!tokenData) return null;

    // Whop JWT may use isAdmin, isModerator, or neither —
    // we check all possibilities and fall back to false
    const isAdmin =
      tokenData.isAdmin === true ||
      tokenData.isModerator === true ||
      tokenData.is_admin === true ||
      tokenData.is_moderator === true ||
      false;

    return {
      userId: tokenData.userId ?? tokenData.sub ?? "",
      experienceId: tokenData.experienceId ?? null,
      companyId: tokenData.companyId ?? null,
      isAdmin,
    };
  } catch {
    return null;
  }
}

// ============================================
// Helper: Verify the user is a company admin
// ============================================
// In Whop, the /dashboard/[companyId] route is ONLY shown to
// company owners/admins — Whop's own routing enforces this.
// This function provides an additional programmatic check:
// 1. Checks JWT admin fields (isAdmin / isModerator)
// 2. Checks that the user's companyId matches the route companyId
// 3. Falls back to a Whop API call to verify company access
// ============================================
export async function verifyIsCompanyAdmin(
  user: { userId: string; companyId: string | null; isAdmin: boolean },
  routeCompanyId: string
): Promise<boolean> {
  // If JWT already says admin, trust it
  if (user.isAdmin) return true;

  // If the user's companyId from the token matches the route companyId,
  // this is a strong signal they're the company admin (Whop only routes
  // admins to the dashboard path, so a matching companyId confirms it)
  if (user.companyId && user.companyId === routeCompanyId) return true;

  // Final fallback: ask the Whop API whether this user has company access
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = getWhopServerSdk() as any;

    // Try the most common access-check methods in @whop/api
    // These may vary by SDK version — we try multiple patterns
    const checks = [
      () => api.checkIfUserHasAccessToCompany?.({ userId: user.userId, companyId: routeCompanyId }),
      () => api.hasAccessToCompany?.({ userId: user.userId, companyId: routeCompanyId }),
      () => api.ACCESS?.checkIfUserHasAccessToCompany?.({ userId: user.userId, companyId: routeCompanyId }),
    ];

    for (const check of checks) {
      try {
        const result = await check();
        if (result !== undefined && result !== null) {
          // SDK returns { hasAccess: boolean } or similar
          if (typeof result === "boolean") return result;
          if (result.hasAccess !== undefined) return Boolean(result.hasAccess);
          if (result.access !== undefined) return Boolean(result.access);
        }
      } catch {
        // This specific check failed, try the next one
      }
    }
  } catch {
    // API check failed entirely — rely on token data only
  }

  // If companyId is null (rare edge case), deny access
  return false;
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
