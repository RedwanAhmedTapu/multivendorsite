// tests/banner-editor.test.mjs
//
// Admin banners (/admin-dashboard/banners → SliderAdmin):
//   - Edit prefills the form from the saved banner (lib/slider/slider-form);
//   - Save Changes calls the REAL update endpoint — PUT /api/sliders/:id —
//     never create, sends cleared fields, and sends the image only when a new
//     file was chosen (the server keeps the current image otherwise);
//   - a successful update refreshes the banner list (invalidates "Slider");
//   - create still POSTs /api/sliders with the required image.
// The RTK endpoints run for real against a stubbed global fetch — no network.
//   node --test tests/banner-editor.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const f = await import("../src/lib/slider/slider-form.ts");
const { configureStore } = await import("@reduxjs/toolkit");
const { sliderApi } = await import("../src/features/sliderApi.ts");
const authReducer = (await import("../src/features/authSlice.ts")).default;

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

const SAVED = {
  id: "S1",
  title: "Mega Week",
  subtitle: "Up to 50% off",
  description: "Ends Friday",
  buttonText: "Shop now",
  buttonLink: "/category/electronics",
  imageUrl: "https://cdn.example/s1.jpg",
  type: "HOMEPAGE",
  vendorId: null,
};
const CAMPAIGNS = [{ id: "C1", slug: "flash-sale" }];

// ── prefill ─────────────────────────────────────────────────────────────────

test("sliderToForm prefills every saved field", () => {
  assert.deepEqual(f.sliderToForm(SAVED, CAMPAIGNS), {
    title: "Mega Week",
    subtitle: "Up to 50% off",
    description: "Ends Friday",
    buttonText: "Shop now",
    buttonLink: "/category/electronics",
    type: "HOMEPAGE",
    vendorId: "",
    campaignId: "",
  });
});

test("sliderToForm: missing optional fields become empty strings, type is kept", () => {
  const form = f.sliderToForm({ id: "S2", imageUrl: "x", type: "VENDORPAGE" });
  assert.deepEqual(form, { ...f.emptySliderForm(), type: "VENDORPAGE" });
});

test("sliderToForm: a vendor banner keeps its vendor; its automatic link shows as auto (empty)", () => {
  const form = f.sliderToForm({ ...SAVED, vendorId: "V9", buttonLink: "/store/V9" }, CAMPAIGNS);
  assert.equal(form.vendorId, "V9");
  assert.equal(form.buttonLink, "");
  assert.equal(form.campaignId, "");
});

test("sliderToForm: a /campaign/<slug> link selects that campaign; a custom link is kept", () => {
  const camp = f.sliderToForm({ ...SAVED, buttonLink: "/campaign/flash-sale" }, CAMPAIGNS);
  assert.equal(camp.campaignId, "C1");
  assert.equal(camp.buttonLink, "");
  const custom = f.sliderToForm({ ...SAVED, buttonLink: "/campaign/unknown" }, CAMPAIGNS);
  assert.equal(custom.campaignId, "");
  assert.equal(custom.buttonLink, "/campaign/unknown");
});

test("sliderPayloadFromForm: auto link when empty, no image unless a new file is given", () => {
  const p = f.sliderPayloadFromForm({ ...f.emptySliderForm(), vendorId: "V9" }, undefined, null);
  assert.equal(p.buttonLink, "/store/V9");
  assert.equal(p.vendorId, "V9");
  assert.ok(!("image" in p), "no image → server keeps the current one");
  const c = f.sliderPayloadFromForm({ ...f.emptySliderForm(), campaignId: "C1" }, "flash-sale");
  assert.equal(c.buttonLink, "/campaign/flash-sale");
  assert.equal(c.vendorId, undefined);
});

// ── multipart body ──────────────────────────────────────────────────────────

test("buildSliderFormData(update): cleared text fields are sent, image/vendor only when present", () => {
  const fd = f.buildSliderFormData({ title: "", subtitle: "New", description: "", buttonText: "", buttonLink: "/x", type: "HOMEPAGE" }, "update");
  assert.equal(fd.get("title"), "", "a cleared title is saved");
  assert.equal(fd.get("description"), "");
  assert.equal(fd.get("subtitle"), "New");
  assert.equal(fd.get("type"), "HOMEPAGE");
  assert.equal(fd.has("image"), false);
  assert.equal(fd.has("vendorId"), false);
});

test("buildSliderFormData(create): empty text fields are omitted, image and type always sent", () => {
  const image = new File(["x"], "b.png", { type: "image/png" });
  const fd = f.buildSliderFormData({ title: "", subtitle: "S", image, type: "HOMEPAGE" }, "create");
  assert.equal(fd.has("title"), false);
  assert.equal(fd.get("subtitle"), "S");
  assert.equal(fd.get("type"), "HOMEPAGE");
  assert.equal(fd.get("image").name, "b.png");
});

// ── the real RTK endpoints, against a stubbed fetch ─────────────────────────

function harness() {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const entry = { method: req.method, url: req.url, form: null };
    if (req.method !== "GET" && req.method !== "DELETE") entry.form = await req.formData();
    calls.push(entry);
    const body = req.method === "GET" ? [] : { id: "S1" };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };
  const store = configureStore({
    reducer: { auth: authReducer, [sliderApi.reducerPath]: sliderApi.reducer },
    middleware: (g) => g({ serializableCheck: false, immutableCheck: false }).concat(sliderApi.middleware),
  });
  return {
    calls,
    store,
    restore: () => {
      store.dispatch(sliderApi.util.resetApiState());
      globalThis.fetch = realFetch;
    },
  };
}
const settle = () => new Promise((r) => setTimeout(r, 30));

test("Save Changes → PUT /api/sliders/:id with the edited fields and NO image (current image kept)", async () => {
  const h = harness();
  try {
    const payload = f.sliderPayloadFromForm({ ...f.sliderToForm(SAVED), title: "Edited", description: "" }, undefined, null);
    await h.store.dispatch(sliderApi.endpoints.updateSlider.initiate({ id: "S1", ...payload })).unwrap();
    assert.equal(h.calls.length, 1);
    const [c] = h.calls;
    assert.equal(c.method, "PUT");
    assert.equal(c.url, "http://localhost:5000/api/sliders/S1");
    assert.equal(c.form.get("title"), "Edited");
    assert.equal(c.form.get("description"), "", "cleared field reaches the server");
    assert.equal(c.form.get("buttonLink"), "/category/electronics");
    assert.equal(c.form.has("image"), false);
  } finally {
    h.restore();
  }
});

test("Save Changes with a new image sends it (replace), still via PUT", async () => {
  const h = harness();
  try {
    const image = new File(["new"], "new.jpg", { type: "image/jpeg" });
    await h.store.dispatch(sliderApi.endpoints.updateSlider.initiate({ id: "S1", ...f.sliderPayloadFromForm(f.sliderToForm(SAVED), undefined, image) })).unwrap();
    assert.equal(h.calls[0].method, "PUT");
    assert.equal(h.calls[0].form.get("image").name, "new.jpg");
  } finally {
    h.restore();
  }
});

test("a successful update refreshes the banner list (GET /api/sliders refetched)", async () => {
  const h = harness();
  try {
    const sub = h.store.dispatch(sliderApi.endpoints.getSliders.initiate());
    await settle();
    const before = h.calls.filter((c) => c.method === "GET").length;
    assert.equal(before, 1);
    await h.store.dispatch(sliderApi.endpoints.updateSlider.initiate({ id: "S1", title: "x" })).unwrap();
    await settle();
    const gets = h.calls.filter((c) => c.method === "GET");
    assert.equal(gets.length, 2, "list refetched after the update");
    assert.equal(gets[1].url, "http://localhost:5000/api/sliders");
    sub.unsubscribe();
  } finally {
    h.restore();
  }
});

test("create still POSTs /api/sliders with the image", async () => {
  const h = harness();
  try {
    const image = new File(["x"], "a.png", { type: "image/png" });
    await h.store.dispatch(sliderApi.endpoints.createSlider.initiate({ ...f.sliderPayloadFromForm({ ...f.emptySliderForm(), title: "New" }, undefined, image), type: "HOMEPAGE", image })).unwrap();
    assert.equal(h.calls[0].method, "POST");
    assert.equal(h.calls[0].url, "http://localhost:5000/api/sliders");
    assert.equal(h.calls[0].form.get("image").name, "a.png");
    assert.equal(h.calls[0].form.get("title"), "New");
  } finally {
    h.restore();
  }
});

test("getSliderById uses the correct /sliders/:id path (was /silders/)", async () => {
  const h = harness();
  try {
    await h.store.dispatch(sliderApi.endpoints.getSliderById.initiate("S1"));
    await settle();
    assert.equal(h.calls[0].url, "http://localhost:5000/api/sliders/S1");
  } finally {
    h.restore();
  }
});

// ── SliderAdmin wiring ──────────────────────────────────────────────────────

test("SliderAdmin: each card has an Edit button that prefills; Save calls update in edit mode, create otherwise", () => {
  const src = read("components/slider/adminsliderhome/SliderAdmin.tsx");
  assert.match(src, /onClick=\{\(\) => startEdit\(slider\)\}/, "card Edit button");
  assert.match(src, /const f = sliderToForm\(slider, campaigns \?\? \[\]\);/, "prefill from the saved banner");
  assert.match(src, /await updateSlider\(\{ id: editingSlider\.id, \.\.\.payload \}\)\.unwrap\(\);/, "real update endpoint");
  assert.match(src, /await createSlider\(\{ \.\.\.payload, type, image: file \}\)\.unwrap\(\);/, "create unchanged");
  assert.ok(src.indexOf("if (editingSlider) {") < src.indexOf("await createSlider("), "edit mode returns before create");
  assert.match(src, /Save Changes/);
  assert.match(src, /const shownImage = preview \?\? \(editingSlider \? editingSlider\.imageUrl : null\);/, "current image shown until replaced");
  assert.doesNotMatch(src, /handleCreate/);
});
