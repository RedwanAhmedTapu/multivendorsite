// lib/homepage-config/revalidate.ts
//
// Pure logic for POST /api/revalidate-homepage (app/api/revalidate-homepage),
// which refreshes the storefront configuration caches: homepage config,
// active layout and the global product card design.
// The caller must be an ADMIN: we don't trust the browser, we forward its
// bearer token to an ADMIN-only backend endpoint and only refresh the cache
// when the backend accepts it. No extra shared secret is needed.

/** Cache tags used by the server-side config fetches (lib/theme-utils.ts). */
export const HOMEPAGE_CACHE_TAGS = {
  config: "homepage-config",
  layout: "homepage-layout",
  card: "product-card-config",
  // Active-palette SSR fetch (lib/palette/active.ts). Instant revalidation
  // on palette publish is Part 5 scope — deliberately NOT in tagsForScope.
  palette: "theme-palette",
} as const;

export type RevalidateScope = "config" | "layout" | "card" | "all";

/** Tags to expire for a requested scope, or null when the scope is invalid. */
export function tagsForScope(scope: unknown): string[] | null {
  if (scope === "config") return [HOMEPAGE_CACHE_TAGS.config];
  if (scope === "layout") return [HOMEPAGE_CACHE_TAGS.layout];
  if (scope === "card") return [HOMEPAGE_CACHE_TAGS.card];
  if (scope === "all") return [HOMEPAGE_CACHE_TAGS.config, HOMEPAGE_CACHE_TAGS.layout, HOMEPAGE_CACHE_TAGS.card];
  return null;
}

export type AdminCheck = { ok: true } | { ok: false; status: number; error: string };

type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string>; cache?: "no-store" }) => Promise<{ status: number; ok: boolean }>;

/**
 * Confirms the bearer token belongs to an ADMIN by calling the ADMIN-only
 * (read-only) draft endpoint. Maps the backend's answer to our response.
 */
export async function verifyAdminToken(authorization: string | null, apiUrl: string, fetchImpl: FetchLike): Promise<AdminCheck> {
  if (!authorization || !/^Bearer\s+\S+$/.test(authorization)) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }
  try {
    const res = await fetchImpl(`${apiUrl}/themes/homepage-config/draft`, {
      method: "GET",
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, status: 401, error: "Not authenticated" };
    if (res.status === 403) return { ok: false, status: 403, error: "Admin only" };
    return { ok: false, status: 502, error: `Could not verify admin access (backend ${res.status})` };
  } catch {
    return { ok: false, status: 502, error: "Could not reach the backend to verify admin access" };
  }
}
