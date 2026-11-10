// tests/auth-no-token-logging.test.mjs
//
// Phase 3 — source-level guard (no rendering): the auth paths must not hand
// whole auth responses to the console. Those objects carry the app's access
// token (refresh / social-login responses) or a provider's access token
// (Facebook authResponse). The runtime check for the refresh path lives in
// chat-socket-token-refresh.test.mjs (test 5).
//   node --test tests/auth-no-token-logging.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

test("baseQueryWithReauth logs neither the refresh response body nor the error object", () => {
  const s = src("features/baseQueryWithReauth.ts");
  assert.doesNotMatch(s, /console\.\w+\([^;]*\bdata:\s*refreshResult\.data/);
  assert.doesNotMatch(s, /console\.\w+\([^;]*,\s*refreshResult\.data\s*\)/);
  assert.doesNotMatch(s, /console\.\w+\([^;]*,\s*refreshResult\.error\s*\)/);
  assert.match(s, /\[reauth\] Refresh response:/, "a non-sensitive diagnostic remains");
});

test("SocialAuth logs neither the login API result nor the Facebook login response", () => {
  const s = src("components/sociallogin/SocialAuth.tsx");
  assert.doesNotMatch(s, /console\.\w+\([^;]*,\s*result\s*\)/);
  assert.doesNotMatch(s, /console\.\w+\([^;]*,\s*response\s*\)/);
});
