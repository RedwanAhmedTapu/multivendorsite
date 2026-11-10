// tests/permission-keys-parity.test.mjs
//
// Phase 1 S6: the backend now rejects unknown permission keys (400), so the
// keys the frontend can send must be exactly the backend's known keys —
// excluding the backend's vendor-only keys (adManagement), which have no UI
// in Phase 1. Compared from source text (no backend code is executed, no
// database). Skips if the sibling backend checkout is not present.
//   node --test tests/permission-keys-parity.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const FE = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const BE_PATH = new URL("../../multivendorbackend/src/middlewares/permission.middleware.ts", import.meta.url);
const haveBackend = existsSync(BE_PATH);

/** String literals inside the first `<name> … [ … ]` array or `<name> = | … ;` union. */
function arrayLiterals(src, name) {
  const m = src.match(new RegExp(`${name}[^=]*=\\s*\\[([\\s\\S]*?)\\]`));
  assert.ok(m, `${name} not found`);
  return [...m[1].matchAll(/"(\w+)"/g)].map((x) => x[1]);
}
function unionLiterals(src, name) {
  const m = src.match(new RegExp(`export type ${name}\\s*=([\\s\\S]*?);`));
  assert.ok(m, `type ${name} not found`);
  return [...m[1].matchAll(/"(\w+)"/g)].map((x) => x[1]);
}
const sorted = (a) => [...new Set(a)].sort();

test("frontend permission keys = backend known keys minus vendor-only keys", { skip: haveBackend ? false : "backend checkout not found" }, () => {
  const be = readFileSync(BE_PATH, "utf8");
  const beBase = unionLiterals(be, "PermissionKey");
  const beHr = unionLiterals(be, "HrGranularKey");
  const beVendorOnly = arrayLiterals(be, "VENDOR_ONLY_PERMISSION_KEYS");
  assert.deepEqual(beVendorOnly, ["adManagement", "posAccess", "posDiscount", "posCredit", "posRefund", "posReports"]);
  assert.deepEqual(sorted(arrayLiterals(be, "BASE_PERMISSION_KEYS")), sorted(beBase), "runtime list mirrors the PermissionKey union");

  const feBase = unionLiterals(FE("features/authApi.ts"), "PermissionKey");
  const feHr = arrayLiterals(FE("hooks/usePermissions.ts"), "HR_GRANULAR_KEYS");
  assert.deepEqual(sorted(feBase), sorted(beBase), "module keys");
  assert.deepEqual(sorted(feHr), sorted(beHr), "HR granular keys");
  // Vendor-only keys never sit in the shared module/HR lists; those with a UI
  // (posAccess) are listed separately, the rest (adManagement) have none yet.
  const feVendorOnly = arrayLiterals(FE("features/authApi.ts"), "VENDOR_ONLY_PERMISSION_KEYS");
  assert.deepEqual(feVendorOnly, ["posAccess", "posDiscount", "posCredit", "posRefund", "posReports"]);
  for (const k of feVendorOnly) assert.ok(beVendorOnly.includes(k), `${k} is a backend vendor-only key`);
  for (const k of beVendorOnly) {
    assert.ok(!feBase.includes(k) && !feHr.includes(k), `${k} is not a shared module/HR key`);
  }
});

test("the permission editor only labels keys the backend accepts", { skip: haveBackend ? false : "backend checkout not found" }, () => {
  const be = readFileSync(BE_PATH, "utf8");
  const known = new Set([...unionLiterals(be, "PermissionKey"), ...unionLiterals(be, "HrGranularKey"), ...arrayLiterals(be, "VENDOR_ONLY_PERMISSION_KEYS")]);
  const src = FE("othersfeatures/hrm/components/PermissionCheckboxGroup.tsx");
  const labelled = [...src.matchAll(/^\s{2}(\w+):\s*"/gm)].map((m) => m[1]);
  assert.ok(labelled.length >= 7, "labels found");
  for (const k of labelled) assert.ok(known.has(k), `${k} is a backend key`);
});
