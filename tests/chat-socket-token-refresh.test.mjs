// tests/chat-socket-token-refresh.test.mjs
//
// Phase 2 — idle chat recovery uses the app's EXISTING refresh path:
// socketTokenRefresher(store) (src/services/socketTokenRefresh.ts) dispatches
// an authenticated getMe through baseQueryWithReauth. A real Redux store with
// the real auth slice + authApi; global fetch is replaced (no network):
//   1. an expired token → /auth/me 401 → ONE /auth/refresh → setAccessToken,
//      the user (account identity) unchanged → bindAuth sees a same-account refresh;
//   2. concurrent triggers (socket + a 401 from another request) share ONE refresh;
//   3. refresh refused → clearAuth (the socket's logout path), no retry loop;
//   4. token still valid for HTTP → no refresh, nothing changes;
//   5. (Phase 3) no token is ever written to the console by the refresh path.
//   node --test tests/chat-socket-token-refresh.test.mjs

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const { configureStore } = await import("@reduxjs/toolkit");
const { authApi } = await import("../src/features/authApi.ts");
const authReducer = (await import("../src/features/authSlice.ts")).default;
const { setCredentials } = await import("../src/features/authSlice.ts");
const { socketTokenRefresher } = await import("../src/services/socketTokenRefresh.ts");

const realFetch = globalThis.fetch;
let calls;
let validTokens;
let refreshOk;
let issued;
const stores = [];

function makeStore() {
  const store = configureStore({
    reducer: { auth: authReducer, [authApi.reducerPath]: authApi.reducer },
    middleware: (gdm) => gdm({ serializableCheck: false, immutableCheck: false }).concat(authApi.middleware),
  });
  store.dispatch(setCredentials({ user: { id: "U1", rawId: "U1", role: "VENDOR" }, accessToken: "T_OLD" }));
  stores.push(store);
  return store;
}
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(cond, ms = 2000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (cond()) return true;
    await sleep(10);
  }
  return cond();
}

beforeEach(() => {
  calls = [];
  validTokens = new Set();
  refreshOk = true;
  issued = 0;
  globalThis.fetch = async (input) => {
    const req = input instanceof Request ? input : new Request(input);
    const path = new URL(req.url).pathname;
    calls.push(path);
    if (path.endsWith("/auth/refresh")) {
      await sleep(30); // in flight long enough for concurrent callers to join
      if (!refreshOk) return json(403, { message: "Invalid refresh token" });
      const t = `T_NEW_${++issued}`;
      validTokens.add(t);
      return json(200, { accessToken: t });
    }
    const auth = req.headers.get("authorization") ?? "";
    if (!validTokens.has(auth.replace(/^Bearer /, ""))) return json(401, { message: "Unauthorized" });
    return json(200, { success: true, data: { id: "U1" } });
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
  stores.splice(0).forEach((s) => s.dispatch(authApi.util.resetApiState())); // clears RTK cache-removal timers
});

test("1. expired token: the socket's trigger runs one refresh and stores the new token for the same account", async () => {
  const store = makeStore();
  socketTokenRefresher(store)();
  assert.ok(await until(() => store.getState().auth.accessToken === "T_NEW_1"), JSON.stringify(calls));
  assert.equal(calls.filter((p) => p.endsWith("/auth/refresh")).length, 1);
  const u = store.getState().auth.user;
  assert.equal(`${u.role}:${u.rawId}`, "VENDOR:U1", "account identity unchanged → socketService treats it as a refresh, not a switch");
});

test("2. concurrent triggers share ONE refresh request", async () => {
  const store = makeStore();
  const refresh = socketTokenRefresher(store);
  refresh();
  store.dispatch(authApi.endpoints.getLoginHistory.initiate(undefined, { subscribe: false })); // another page's request 401s too
  refresh(); // a second socket rejection before the first finished
  assert.ok(await until(() => store.getState().auth.accessToken === "T_NEW_1"));
  await sleep(150);
  assert.equal(calls.filter((p) => p.endsWith("/auth/refresh")).length, 1, JSON.stringify(calls));
  assert.equal(store.getState().auth.accessToken, "T_NEW_1");
});

test("3. refresh refused: the session is cleared (socketService then tears the socket down), no retry loop", async () => {
  refreshOk = false;
  const store = makeStore();
  socketTokenRefresher(store)();
  assert.ok(await until(() => store.getState().auth.accessToken === null));
  assert.equal(store.getState().auth.user, null);
  await sleep(150);
  assert.equal(calls.filter((p) => p.endsWith("/auth/refresh")).length, 1);
});

test("4. token still valid for HTTP: no refresh, nothing changes", async () => {
  validTokens.add("T_OLD");
  const store = makeStore();
  socketTokenRefresher(store)();
  assert.ok(await until(() => calls.includes("/api/auth/me")));
  await sleep(100);
  assert.equal(calls.filter((p) => p.endsWith("/auth/refresh")).length, 0);
  assert.equal(store.getState().auth.accessToken, "T_OLD");
});

test("5. Phase 3: no access token reaches the console during refresh — success, missing token, or refused", async () => {
  const lines = [];
  const orig = { log: console.log, info: console.info, warn: console.warn, error: console.error, debug: console.debug };
  for (const k of Object.keys(orig)) console[k] = (...a) => lines.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
  try {
    const ok = makeStore();
    socketTokenRefresher(ok)();
    assert.ok(await until(() => ok.getState().auth.accessToken === "T_NEW_1"));
    // a refresh response that echoes extra credentials but no accessToken
    const realFetchNow = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const path = new URL((input instanceof Request ? input : new Request(input)).url).pathname;
      return path.endsWith("/auth/refresh") ? json(200, { token: "T_LEAKY_SECRET", refreshToken: "R_LEAKY_SECRET" }) : json(401, { message: "Unauthorized" });
    };
    const odd = makeStore();
    socketTokenRefresher(odd)();
    assert.ok(await until(() => odd.getState().auth.accessToken === null));
    globalThis.fetch = realFetchNow;
  } finally {
    Object.assign(console, orig);
  }
  const joined = lines.join("\n");
  for (const secret of ["T_NEW_1", "T_OLD", "T_LEAKY_SECRET", "R_LEAKY_SECRET"]) assert.ok(!joined.includes(secret), `${secret} was logged:\n${joined}`);
  assert.ok(lines.some((l) => l.includes("[reauth]")), "non-sensitive diagnostics are kept");
});
