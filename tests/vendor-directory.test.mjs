// tests/vendor-directory.test.mjs
//   node --test tests/vendor-directory.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register("./support/tsx-loader.mjs", import.meta.url);
const D = await import("../src/lib/vendor-directory.ts");

test("vendor code and initials are derived from the real id / store name", () => {
  assert.equal(D.vendorCode("cm3xk9zab0001vendor"), "#VENDOR");
  assert.equal(D.vendorCode("vend-0000-0001"), "#000001");
  assert.equal(D.vendorCode(null), "—");
  assert.equal(D.vendorInitials("Najah Mart"), "NM");
  assert.equal(D.vendorInitials("Baby Shop Ltd"), "BS");
  assert.equal(D.vendorInitials(""), "?");
});

test("money and dates do not invent values when the API has none", () => {
  assert.equal(D.formatMoney(4850210.5), "৳4,850,210.5");
  assert.equal(D.formatMoney(undefined), "৳0");
  assert.equal(D.compactMoney(4_850_210), "৳4.85M");
  assert.equal(D.compactMoney(12_500), "৳12.5K");
  assert.equal(D.compactMoney(0), "৳0");
  assert.equal(D.formatDate("2026-10-04T10:00:00.000Z"), "4 Oct, 2026");
  assert.equal(D.formatDate(null), "—");
});

test("labels never fall back to made-up rows", () => {
  assert.equal(D.planLabel("PREMIUM"), "Premium");
  assert.equal(D.planLabel(null), "—");
  assert.equal(D.ratingLabel(0), "—", "0 means no review yet");
  assert.equal(D.ratingLabel(4.25), "4.3");
  assert.equal(D.fulfillmentLabel(0), "—");
  assert.equal(D.fulfillmentLabel(94.2), "94.2%");
  assert.equal(D.documentTypeLabel("TIN_CERTIFICATE"), "TIN Certificate");
  assert.equal(D.documentHref("https://cdn.example.com/tin.pdf"), "https://cdn.example.com/tin.pdf");
  assert.equal(D.documentHref("/uploads/tin.pdf"), "/uploads/tin.pdf");
  assert.equal(D.documentHref("C:\\files\\tin.pdf"), null, "a bare path is not a browser link");
});

test("pagination pills keep the first/last page and collapse the middle", () => {
  assert.deepEqual(D.pageWindow(1, 3), [1, 2, 3]);
  assert.deepEqual(D.pageWindow(1, 125), [1, 2, "…", 125]);
  assert.deepEqual(D.pageWindow(5, 125), [1, "…", 4, 5, 6, "…", 125]);
  assert.deepEqual(D.pageWindow(125, 125), [1, "…", 124, 125]);
});

test("commission/payout envelopes are unwrapped from { success, data }", () => {
  const commissions = D.commissionRows({
    success: true,
    data: [{ id: "c1", rate: 12, categoryId: "cat1", category: { name: "Electronics" }, effectiveFrom: "2026-01-01" }],
  });
  assert.deepEqual(commissions, [
    { id: "c1", categoryId: "cat1", categoryName: "Electronics", rate: 12, effectiveFrom: "2026-01-01", effectiveTo: undefined, note: undefined, createdAt: undefined },
  ]);
  assert.deepEqual(D.commissionRows([{ id: "c2", rate: 5, category: null }])[0].categoryName, "Uncategorised");
  assert.deepEqual(D.commissionRows({ success: true }), []);

  const payouts = D.payoutRows({ success: true, data: [{ id: "p1", amount: 1200, status: "PAID", period: "Oct", paidAt: "2026-11-01" }] });
  assert.equal(payouts[0].amount, 1200);
  assert.equal(payouts[0].status, "PAID");
  assert.deepEqual(D.payoutRows(undefined), []);
});

test("the All Vendors route renders the redesigned directory", () => {
  const page = readFileSync(new URL("../src/app/admin-dashboard/@main/vendormanage/vendor-approval/page.tsx", import.meta.url), "utf8");
  assert.match(page, /VendorDirectory/);
});
