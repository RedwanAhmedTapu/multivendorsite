// services/socketTokenRefresh.ts
//
// Phase 2 (chat idle recovery): when the chat socket's handshake is refused
// (the access token expired while the chat sat idle), run the app's EXISTING
// refresh: an authenticated request through baseQueryWithReauth, which on 401
// refreshes once (single-flight) and dispatches setAccessToken — or clears the
// session if the refresh token is gone. socketService.bindAuth then reconnects
// with the new token. No second refresh implementation, no token handling here.
import { authApi } from "@/features/authApi";

export function socketTokenRefresher(store: { dispatch: (action: any) => any }) {
  return () => {
    store.dispatch(authApi.endpoints.getMe.initiate(undefined, { subscribe: false, forceRefetch: true }));
  };
}
