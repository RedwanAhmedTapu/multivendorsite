// tests/campaign-editor.test.mjs
//
// Admin campaign editor (/admin-dashboard/campaigns) and the block builder's
// details form (/admin-dashboard/campaigns/[id]):
//   - datetime-local values are LOCAL time both ways (the old UTC slice moved
//     the campaign window by the UTC offset on every save);
//   - an update sends only changed fields, clears optional fields with null,
//     never re-sends an untouched date, and validates title + date order;
//   - search / status filter / stats / date-window helpers;
//   - the real updateCampaign endpoint sends PUT /api/campaigns/:id with
//     exactly those fields and refreshes the list (stubbed fetch, no network);
//   - the page offers only actions the backend supports.
//   node --test tests/campaign-editor.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const e = await import("../src/lib/campaign/campaign-editor.ts");
const { configureStore } = await import("@reduxjs/toolkit");
const { campaignPageApi } = await import("../src/features/campaignPageApi.ts");
const authReducer = (await import("../src/features/authSlice.ts")).default;

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

const SAVED = {
  id: "C1",
  title: "Mega Fest",
  slug: "mega-fest",
  status: "DRAFT",
  heroImage: "https://cdn.example/h.jpg",
  heroTitle: "Up to 70% off",
  heroSubtitle: "Weekend only",
  startDate: "2026-11-01T04:00:00.000Z",
  endDate: "2026-11-03T16:30:00.000Z",
  _count: { components: 3 },
};

// ── local-time dates ────────────────────────────────────────────────────────

test("toDateTimeLocal renders the browser's local time (not the UTC slice)", () => {
  const d = new Date(SAVED.startDate);
  const pad = (n) => String(n).padStart(2, "0");
  const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  assert.equal(e.toDateTimeLocal(SAVED.startDate), local);
  assert.equal(e.toDateTimeLocal(null), "");
  assert.equal(e.toDateTimeLocal("not a date"), "");
});

test("a saved date survives load → save unchanged (no timezone drift)", () => {
  for (const iso of [SAVED.startDate, SAVED.endDate, "2026-03-29T23:59:00.000Z"]) {
    assert.equal(e.fromDateTimeLocal(e.toDateTimeLocal(iso)), iso);
  }
  assert.equal(e.fromDateTimeLocal(""), null);
  assert.equal(e.fromDateTimeLocal("garbage"), undefined);
});

// ── update payload ──────────────────────────────────────────────────────────

test("an untouched form produces no update (nothing re-sent, dates included)", () => {
  assert.deepEqual(e.buildCampaignUpdate(e.campaignToForm(SAVED), SAVED), {});
  assert.equal(e.isCampaignDirty(e.campaignToForm(SAVED), SAVED), false);
});

test("only changed fields are sent; cleared optional fields become null; title is trimmed", () => {
  const form = { ...e.campaignToForm(SAVED), title: "  Mega Fest 2  ", heroSubtitle: "", heroImage: "", endDate: "" };
  assert.deepEqual(e.buildCampaignUpdate(form, SAVED), {
    title: "Mega Fest 2",
    heroSubtitle: null,
    heroImage: null,
    endDate: null,
  });
});

test("a changed date is sent as a full ISO datetime of the local time entered", () => {
  const form = { ...e.campaignToForm(SAVED), startDate: "2026-12-24T10:15" };
  const out = e.buildCampaignUpdate(form, SAVED);
  assert.deepEqual(Object.keys(out), ["startDate"]);
  assert.equal(out.startDate, new Date("2026-12-24T10:15").toISOString());
});

test("validation: title required, end must be after start", () => {
  const ok = e.campaignToForm(SAVED);
  assert.deepEqual(e.validateCampaignForm(ok), {});
  assert.equal(e.validateCampaignForm({ ...ok, title: "   " }).title, "Campaign title is required");
  assert.equal(e.validateCampaignForm({ ...ok, startDate: "2026-11-05T10:00", endDate: "2026-11-05T10:00" }).endDate, "The campaign must end after it starts");
  assert.equal(e.validateCampaignForm({ ...ok, startDate: "", endDate: "" }).endDate, undefined, "open-ended is fine");
});

// ── list helpers ────────────────────────────────────────────────────────────

const LIST = [
  { ...SAVED, id: "1", title: "Flash Sale", slug: "flash-sale", status: "PUBLISHED" },
  { ...SAVED, id: "2", title: "Eid Collection", slug: "eid", status: "DRAFT" },
  { ...SAVED, id: "3", title: "Old Promo", slug: "old-promo", status: "ARCHIVED" },
];

test("filterCampaigns: by title or slug, and by status", () => {
  assert.deepEqual(e.filterCampaigns(LIST, "flash", "ALL").map((c) => c.id), ["1"]);
  assert.deepEqual(e.filterCampaigns(LIST, "EID", "ALL").map((c) => c.id), ["2"]);
  assert.deepEqual(e.filterCampaigns(LIST, "old-promo", "ALL").map((c) => c.id), ["3"], "matches the slug, not the title");
  assert.deepEqual(e.filterCampaigns(LIST, "", "DRAFT").map((c) => c.id), ["2"]);
  assert.deepEqual(e.filterCampaigns(LIST, "promo", "PUBLISHED"), []);
});

test("campaignStats counts by status", () => {
  assert.deepEqual(e.campaignStats(LIST), { total: 3, live: 1, draft: 1, archived: 1, scheduled: 0 });
});

test("campaignWindow uses the storefront's bounds (start <= now <= end)", () => {
  const now = new Date("2026-11-02T00:00:00Z");
  assert.equal(e.campaignWindow({}, now), "ALWAYS");
  assert.equal(e.campaignWindow({ startDate: "2026-11-03T00:00:00Z" }, now), "UPCOMING");
  assert.equal(e.campaignWindow({ endDate: "2026-11-01T00:00:00Z" }, now), "ENDED");
  assert.equal(e.campaignWindow({ startDate: "2026-11-01T00:00:00Z", endDate: "2026-11-02T00:00:00Z" }, now), "RUNNING", "end == now is still shown");
});

// ── the real updateCampaign endpoint, stubbed fetch ─────────────────────────

test("updateCampaign → PUT /api/campaigns/:id with exactly the changed fields, then the list is refetched", async () => {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    calls.push({ method: req.method, url: req.url, body: req.method === "GET" ? null : await req.json() });
    const data = req.method === "GET" ? [] : { ...SAVED };
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const store = configureStore({
    reducer: { auth: authReducer, [campaignPageApi.reducerPath]: campaignPageApi.reducer },
    middleware: (g) => g({ serializableCheck: false, immutableCheck: false }).concat(campaignPageApi.middleware),
  });
  try {
    const sub = store.dispatch(campaignPageApi.endpoints.listCampaigns.initiate());
    await new Promise((r) => setTimeout(r, 30));
    const changes = e.buildCampaignUpdate({ ...e.campaignToForm(SAVED), heroTitle: "", title: "Renamed" }, SAVED);
    await store.dispatch(campaignPageApi.endpoints.updateCampaign.initiate({ id: "C1", ...changes })).unwrap();
    await new Promise((r) => setTimeout(r, 30));
    const put = calls.find((c) => c.method === "PUT");
    assert.equal(put.url, "http://localhost:5000/api/campaigns/C1");
    assert.deepEqual(put.body, { title: "Renamed", heroTitle: null });
    assert.equal(calls.filter((c) => c.method === "GET" && c.url.endsWith("/api/campaigns")).length, 2, "list refreshed");
    sub.unsubscribe();
  } finally {
    store.dispatch(campaignPageApi.util.resetApiState());
    globalThis.fetch = realFetch;
  }
});

// ── page wiring ─────────────────────────────────────────────────────────────

test("campaigns page: editor saves via updateCampaign with changed fields only, and uses the shared ProductForm primitives", () => {
  const src = read("app/admin-dashboard/@main/campaigns/page.tsx");
  assert.match(src, /const changes = useMemo\(\(\) => buildCampaignUpdate\(form, saved\), \[form, saved\]\);/);
  assert.match(src, /await updateCampaign\(\{ id: campaign\.id, \.\.\.changes \}\)\.unwrap\(\);/);
  assert.match(src, /from "@\/components\/ui\/section-card"/);
  assert.match(src, /from "@\/components\/ui\/section-buttons"/);
  assert.match(src, /lg:grid-cols-\[minmax\(300px,380px\)_minmax\(0,1fr\)\]/, "responsive list + editor layout");
});

test("campaigns page offers only backend-supported actions", () => {
  const src = read("app/admin-dashboard/@main/campaigns/page.tsx");
  for (const hook of ["useListCampaignsQuery", "useCreateCampaignMutation", "useUpdateCampaignMutation", "useDeleteCampaignMutation", "usePublishCampaignMutation", "useUnpublishCampaignMutation", "useUploadCampaignImageMutation"]) {
    assert.match(src, new RegExp(`\\b${hook}\\b`), hook);
  }
  const api = read("features/campaignPageApi.ts");
  for (const [, name] of src.matchAll(/\buse(\w+)(Query|Mutation)\b/g)) {
    const hook = `use${name}`;
    if (!/Campaign|Campaigns/.test(name)) continue;
    assert.match(api, new RegExp(`\\b${hook}(Query|Mutation)\\b`), `${hook} must exist in campaignPageApi`);
  }
  assert.doesNotMatch(src, /\bfetch\(|axios|status:\s*"ARCHIVED"|duplicate/i, "no ad-hoc endpoints or unsupported actions");
  assert.match(src, /router\.push\(`\/admin-dashboard\/campaigns\/\$\{campaign\.id\}`\)/, "page blocks are edited in the existing builder");
});

test("block builder details form uses local-time dates and changed-fields updates", () => {
  const src = read("app/admin-dashboard/@main/campaigns/[id]/page.tsx");
  assert.doesNotMatch(src, /toISOString\(\)\.slice\(0, 16\)/);
  assert.match(src, /setMeta\(campaignToForm\(campaign\)\)/);
  assert.match(src, /const changes = buildCampaignUpdate\(meta, campaign\);/);
  assert.match(src, /await updateCampaign\(\{ id: campaignId, \.\.\.changes \}\)\.unwrap\(\);/);
});
