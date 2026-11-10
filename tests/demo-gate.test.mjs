// tests/demo-gate.test.mjs
// The demo gate must be off unless BOTH switches are on, and each switch alone
// must be insufficient.   node --test tests/demo-gate.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const G = await import("../src/lib/analytics/replay/demo-gate.ts");

const store = (v) => ({ getItem: (k) => (k === G.DEMO_OPT_IN_KEY ? v : null) });
const opted = store("1");
const notOpted = store(null);

test("gate: off by default — no env value, no opt-in", () => {
  assert.equal(G.demoEnvOn(undefined), false);
  assert.equal(G.demoEnvOn(""), false);
  assert.equal(G.demoEnvOn("0"), false);
  assert.equal(G.demoEnvOn("true"), false, "only the exact string 1 enables it");
  assert.equal(G.demoOptedIn(notOpted), false);
  assert.equal(G.demoModeEnabled(undefined, notOpted), false);
});

test("gate: both switches required — neither alone is enough", () => {
  assert.equal(G.demoModeEnabled("1", notOpted), false, "env alone must not enable the demo");
  assert.equal(G.demoModeEnabled(undefined, opted), false, "opt-in alone must not enable the demo");
  assert.equal(G.demoModeEnabled("0", opted), false);
  assert.equal(G.demoModeEnabled("1", opted), true);
});

test("gate: storage failures and absent storage stay closed", () => {
  const throwing = { getItem: () => { throw new Error("blocked"); } };
  assert.equal(G.demoOptedIn(throwing), false);
  assert.equal(G.demoModeEnabled("1", throwing), false);
  assert.equal(G.demoModeEnabled("1"), false, "no browser storage means no demo");
});

test("gate: enabling writes only when the build flag is on", () => {
  const writes = [];
  const s = { getItem: () => null, setItem: (k, v) => writes.push([k, v]) };
  assert.equal(G.enableDemoForThisBrowser(undefined, s), false);
  assert.deepEqual(writes, [], "refuses to write without the env flag");
  assert.equal(G.enableDemoForThisBrowser("1", s), true);
  assert.deepEqual(writes, [[G.DEMO_OPT_IN_KEY, "1"]]);
});

test("gate: does not reuse the synthetic-recording opt-in key", async () => {
  const cfg = await import("../src/lib/analytics/replay/replay-config.ts");
  assert.notEqual(G.DEMO_OPT_IN_KEY, cfg.SYNTHETIC_OPT_IN_KEY, "demo opt-in must be a separate key");
});