// tests/offer-permissions-callers.test.mjs
//
// Phase 1 S2 / S4 (frontend side):
//   - the vendor offer screens read their offer permissions from the
//     vendor-scoped endpoint (/offers/vendor/permissions, vendor taken from
//     the session) — never the admin endpoint with a client-supplied vendorId,
//     which is now ADMIN-only;
//   - rejecting a vendor offer in the admin table collects a reason, and the
//     approve mutation sends it (stubbed fetch, no network).
//   node --test tests/offer-permissions-callers.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

test("no vendor component uses the admin single-vendor permissions hook", () => {
  const dir = new URL("../src/components/vendor/offers/", import.meta.url);
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".tsx"))) {
    const src = readFileSync(new URL(f, dir), "utf8");
    assert.doesNotMatch(src, /\buseGetVendorPermissionsQuery\b/, `${f} must not call the admin endpoint`);
    assert.doesNotMatch(src, /offers\/admin\/vendor-permissions/, f);
  }
});

test("both vendor offer screens use the vendor-scoped permissions hook without a vendor id", () => {
  for (const f of ["components/vendor/offers/vendor-offers-management.tsx", "components/offers/VendorCreateOfferPage.tsx"]) {
    assert.match(read(f), /useGetVendorPermissionsInfoQuery\(\)/, f);
  }
  // The old duplicate list is only a re-export of the current page now.
  assert.match(read("components/vendor/offers/create-vendor-offer-dialog.tsx"), /export \{ VendorOffersManagement \} from "\.\/vendor-offers-management"/);
  assert.match(read("components/vendor/offers/vendor-offers-header.tsx"), /permissions\.maxActiveOffers/, "the header still shows the active-offer limit");
  const api = read("features/offerApi.ts");
  assert.match(api, /getVendorPermissionsInfo: builder\.query<[\s\S]*?url: "\/offers\/vendor\/permissions"/);
});

test("admin reject flow collects a non-empty reason before calling the API", () => {
  const src = read("components/admin/offers/offers-table.tsx");
  assert.match(src, /<Textarea[\s\S]*?id="offer-reject-reason"/, "reason input");
  assert.match(src, /if \(action === 'reject' && !rejectReason\.trim\(\)\) \{/, "blocked without a reason");
  assert.match(src, /approveVendorOffer\(\{ offerId: offer\.id, approved: false, reason: rejectReason\.trim\(\) \}\)/);
  assert.match(src, /disabled=\{rejectReasonMissing(\}| \|\| working\})/, "confirm disabled while empty (and while a request is in flight)");
});

test("approveVendorOffer sends { approved, reason } for a rejection and { approved } for an approval", async () => {
  const { configureStore } = await import("@reduxjs/toolkit");
  const { offerApi } = await import("../src/features/offerApi.ts");
  const authReducer = (await import("../src/features/authSlice.ts")).default;
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    calls.push({ method: req.method, url: req.url, body: req.method === "GET" ? null : await req.json() });
    return new Response(JSON.stringify({ success: true, data: { id: "O1" } }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const store = configureStore({
    reducer: { auth: authReducer, [offerApi.reducerPath]: offerApi.reducer },
    middleware: (g) => g({ serializableCheck: false, immutableCheck: false }).concat(offerApi.middleware),
  });
  try {
    await store.dispatch(offerApi.endpoints.approveVendorOffer.initiate({ offerId: "O1", approved: false, reason: "Too deep" })).unwrap();
    await store.dispatch(offerApi.endpoints.approveVendorOffer.initiate({ offerId: "O1", approved: true })).unwrap();
    const patches = calls.filter((c) => c.method === "PATCH");
    assert.equal(patches[0].url, "http://localhost:5000/api/offers/admin/O1/approve");
    assert.deepEqual(patches[0].body, { approved: false, reason: "Too deep" });
    assert.deepEqual(patches[1].body, { approved: true });
  } finally {
    store.dispatch(offerApi.util.resetApiState());
    globalThis.fetch = realFetch;
  }
});
