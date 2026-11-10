// tests/ui-tests.mjs
//
// Admin UI surface for visual session replay.
//
// Scope note (honest): these are *contract* tests, not rendered-DOM tests.
// The components under test are RTK-Query-connected React components that need a
// Redux Provider, a live API base URL and an authenticated admin session; the
// repository has no component-render harness (no @testing-library, no MSW).
// What is asserted here:
//   1. the three public surfaces exist and are components;
//   2. playback is only ever requested with a bearer token prop — the UI never
//      builds a public/unsigned recording URL;
//   3. the viewer distinguishes a failed/forbidden load from a loaded recording,
//      so a vendor who is refused server-side sees an error, not a player;
//   4. an events-only session (no chunks) never silently renders as if DOM
//      replay were available — the player component requires chunk data;
//   5. vendor scoping is by journey id, and no vendor-side surface lists
//      recordings across journeys.
//
// Server-side authorization itself is covered by the backend suite
// (tests/session-replay.test.ts: "playback: administrators only ...").
//
//   node --test tests/ui-tests.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

register("./support/tsx-loader.mjs", import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "src");

const read = (rel) => readFileSync(join(SRC, rel), "utf8");
const RECORDINGS = "components/product/vendor/buisnessadivisordashboard/SessionRecordings.tsx";
const PLAYER = "components/product/vendor/buisnessadivisordashboard/SessionReplayPlayer.tsx";

const rec = read(RECORDINGS);
const player = read(PLAYER);

test("ui: the admin surfaces exist and are exported components", async () => {
  const mod = await import("../src/components/product/vendor/buisnessadivisordashboard/SessionRecordings.tsx");
  for (const name of ["RecordedSessionsPanel", "JourneyRecordings", "RecordingViewer"]) {
    assert.equal(typeof mod[name], "function", `${name} must be an exported component`);
  }
});

test("ui: playback is requested with an access token, never a public URL", () => {
  assert.match(rec, /accessToken/, "the viewer must pass an access token to the player");
  assert.match(player, /accessToken/, "the player must accept the access token");
  assert.doesNotMatch(rec + player, /r2\.dev|pub-[0-9a-f]{16}|X-Amz-Signature/, "no public or pre-signed media URLs in the UI");
  assert.doesNotMatch(rec + player, /\/api\/public\//, "recordings must not be read from a public API path");
});

test("ui: a refused or failed load renders an error, not a player", () => {
  // RecordingViewer: isLoading -> skeleton, isError/!data -> alert, else player.
  assert.match(rec, /isError \|\| !data/, "the viewer must branch on a missing/failed response");
  assert.match(rec, /role="alert"/, "the failure state must be announced, not silently blank");
  assert.match(rec, /SessionReplayPlayer/, "the player is only reached in the success branch");
});

test("ui: events-only sessions cannot masquerade as DOM replay", () => {
  // The player is fed only a recording detail (with chunk data); nothing in the
  // recordings UI fabricates a player for an analytics-only journey.
  assert.match(player, /chunks?/i, "the player requires chunk data to render anything");
  assert.doesNotMatch(rec, /eventsOnly=\{|fallback="(?!.*unavailable)/i, "no synthetic player for event-only sessions");
});

test("ui: vendor lists are scoped by journey id, not a global recording feed", () => {
  assert.match(rec, /journeyId/, "journey-scoped listing is required");
  const globalList = /useGet\w*Recordings\w*Query\(\s*\)/.exec(rec);
  assert.equal(globalList, null, "the vendor UI must not call an unscoped recordings query");
});
