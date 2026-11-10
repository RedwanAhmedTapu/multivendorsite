import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { setAccessToken, setCredentials, clearAuth } from "./authSlice";
import type { RootState } from "@/store/store";
import { analyticsHeaders } from "@/lib/analytics/tracker";

let refreshPromise: Promise<any> | null = null;
let isRefreshing = false;

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  credentials: "include",
  prepareHeaders: (headers, { getState, type }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Business Advisor: random journey ids (no personal data) so the server can
    // connect a shopping journey's steps. Never used for auth. Only on requests
    // that are already CORS-preflighted (authenticated, or JSON mutations), so
    // anonymous browsing GETs stay simple requests.
    if (token || type === "mutation") {
      for (const [k, v] of Object.entries(analyticsHeaders())) headers.set(k, v);
    }
    return headers;
  },
});

// Helper to extract the inner data regardless of envelope shape
function unwrapRefreshData(raw: any): { accessToken?: string; user?: any } | null {
  if (!raw) return null;

  // Case 1: { accessToken, user } at top level
  if (raw.accessToken) return raw;

  // Case 2: { data: { accessToken, user } }  ← most likely your issue
  if (raw.data?.accessToken) return raw.data;

  // Case 3: { result: { accessToken, user } }
  if (raw.result?.accessToken) return raw.result;

  // Add more patterns as needed for your API
  return null;
}

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const state = api.getState() as RootState;
  if (!state.auth.accessToken) {
    return await baseQuery(args, api, extraOptions);
  }

  let result = await baseQuery(args, api, extraOptions);

  if ((result.error?.status === 401 || result.error?.status === 403) && state.auth.accessToken) {
    console.log("[reauth] Token expired, attempting refresh...");

    if (!isRefreshing) {
      isRefreshing = true;

      refreshPromise = (async () => {
        try {
          const refreshResult = await baseQuery(
            { url: "/auth/refresh", method: "POST" },
            api,
            extraOptions
          );

          // Phase 3: diagnostics only — the response carries the new access
          // token, so its body is never logged.
          console.log("[reauth] Refresh response:", {
            ok: !refreshResult.error,
            status: refreshResult.error?.status ?? 200,
          });

          // Check for HTTP-level errors first
          if (refreshResult.error) {
            console.error("[reauth] Refresh endpoint returned error:", refreshResult.error.status);
            // Refresh token itself is invalid → force logout
            api.dispatch(clearAuth());
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = "/login?session=expired";
              }, 100);
            }
            return { success: false, error: refreshResult.error };
          }

          // ─── Unwrap the response data ───
          const unwrapped = unwrapRefreshData(refreshResult.data);

          if (unwrapped?.accessToken) {
            const { accessToken, user } = unwrapped;

            api.dispatch(setAccessToken(accessToken));

            if (user) {
              const currentUser = (api.getState() as RootState).auth.user;
              api.dispatch(setCredentials({ user: { ...currentUser, ...user }, accessToken }));
            } else {
              // Still update token even without user data
              const currentUser = (api.getState() as RootState).auth.user;
              api.dispatch(setCredentials({ user: currentUser, accessToken }));
            }

            console.log("[reauth] Token refreshed successfully");
            return { success: true, accessToken };
          }

          // ─── Data exists but no accessToken found ───
          console.error("[reauth] Refresh response has no accessToken. Response keys:", Object.keys((refreshResult.data as object) || {}));
          throw new Error(
            `Refresh returned no accessToken. Response keys: ${JSON.stringify(Object.keys(refreshResult.data || {}))}`
          );
        } catch (error: any) {
          console.error("[reauth] Token refresh failed:", error);
          api.dispatch(clearAuth());
          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.location.href = "/login?session=expired";
            }, 100);
          }
          return { success: false, error };
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
    }

    const refreshResult = await refreshPromise;

    if (refreshResult?.success) {
      result = await baseQuery(args, api, extraOptions);
    } else {
      const url = typeof args === "string" ? args : args.url;
      if (url.includes("cart-wish")) {
        return {
          error: { status: 401, data: { message: "Please login to access cart/wishlist" } },
        };
      }
    }
  } else if (result.error?.status === 403) {
    console.log("[reauth] 403 — permission issue, not token expiry");
  }

  return result;
};

export default baseQueryWithReauth;