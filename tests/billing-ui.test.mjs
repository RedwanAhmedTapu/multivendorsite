// node --test tests/ — subscription platform + vendor payouts UI.
//   Pure display helpers, plus static checks: everything comes from the API
//   (no hardcoded plans or prices), pages are gated like the backend
//   (ADMIN-only admin pages, owner-only vendor pages), money flows stay apart,
//   payments are idempotent, and nothing promises an automatic transfer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  cycleSavingsPercent,
  dateText,
  limitText,
  monthlyEquivalent,
  newIdempotencyKey,
  offerValueText,
  perCycle,
  taka,
  takaShort,
} from "../src/lib/billing/format.ts";

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const api = read("features/billingApi.ts");
const adminSubs = read("app/admin-dashboard/@main/subscriptions/page.tsx");
const adminPayouts = read("app/admin-dashboard/@main/payouts/page.tsx");
const vendorSub = read("app/vendor-dashboard/@main/subscription/page.tsx");
const vendorPayouts = read("app/vendor-dashboard/@main/payouts/page.tsx");
const catalogue = read("components/admin-subscriptions/CatalogueSections.tsx");
const vendorSections = read("components/admin-subscriptions/VendorSections.tsx");
const payoutSections = read("components/admin-payouts/PayoutSections.tsx");

test("money and dates: ৳ with 2 decimals, short form for whole prices, Asia/Dhaka dates, safe fallbacks", () => {
  assert.equal(taka("1250"), "৳1,250.00");
  assert.equal(taka(0), "৳0.00");
  assert.equal(taka(null), "—");
  assert.equal(taka("abc"), "—");
  assert.equal(takaShort("1250"), "৳1,250");
  assert.equal(takaShort("999.5"), "৳999.50");
  assert.equal(dateText("2026-11-30T19:00:00Z"), "01 Dec 2026", "Dhaka is UTC+6");
  assert.equal(dateText(null), "—");
});

test("cycle helpers: labels, monthly equivalents and savings versus monthly", () => {
  assert.deepEqual([perCycle(1), perCycle(6), perCycle(12), perCycle(24)], ["per month", "per 6 months", "per year", "per 2 years"]);
  assert.equal(monthlyEquivalent("12000", 12), 1000);
  assert.equal(cycleSavingsPercent("1000", "10000", 12), 17);
  assert.equal(cycleSavingsPercent("1000", "12000", 12), 0, "not cheaper → no badge");
  assert.equal(cycleSavingsPercent(null, "10000", 12), 0);
  assert.equal(cycleSavingsPercent("1000", "1000", 1), 0);
});

test("limits and offers read naturally", () => {
  assert.equal(limitText("number", null), "Unlimited");
  assert.equal(limitText("number", 50, "renders", "MONTH"), "50 renders / month");
  assert.equal(limitText("boolean", true), "Included");
  assert.equal(limitText("boolean", false), "Not included");
  assert.equal(offerValueText("PERCENT_DISCOUNT", "25.00"), "25% off");
  assert.equal(offerValueText("FIXED_DISCOUNT", "200"), "৳200.00 off");
  assert.equal(offerValueText("FREE_PLAN", null), "Free plan access");
  const a = newIdempotencyKey("subpay"), b = newIdempotencyKey("subpay");
  assert.ok(a.startsWith("subpay-") && a !== b);
});

test("plans, prices and features come only from the API (nothing hardcoded)", () => {
  for (const [name, src] of [["vendor pricing", vendorSub], ["catalogue", catalogue]]) {
    assert.ok(!/(FREE|BASIC|PREMIUM|ENTERPRISE|PRO)["']\s*[:,]/.test(src), `${name}: no plan enum literals`);
    assert.ok(!/৳\s?\d/.test(src), `${name}: no hardcoded taka amounts`);
  }
  assert.match(vendorSub, /useVendorPlansQuery\(\)/);
  assert.match(vendorSub, /useVendorCurrentQuery\(\)/);
  assert.match(vendorSub, /useVendorSubPaymentsQuery\(\)/);
  for (const url of ["/vendor/subscription/plans", "/vendor/subscription/current", "/vendor/subscription/payments", "/vendor/subscription/requests", "/admin/subscriptions/plans", "/admin/subscriptions/features", "/admin/subscriptions/cycles", "/admin/subscriptions/offers", "/admin/subscriptions/transactions", "/admin/payouts/batches", "/vendor/payouts/summary"])
    assert.ok(api.includes(url), url);
  assert.match(api, /apiSlice\.enhanceEndpoints\(\{ addTagTypes:/, "injected into the existing slice: no new store wiring");
});

test("admin pages are ADMIN-only; vendor pages are the owner's; sidebar links mirror the backend gates", () => {
  assert.match(adminSubs, /const isAdmin = me\?\.data\?\.role === "ADMIN"/);
  assert.match(adminPayouts, /me\?\.data\?\.role !== "ADMIN"/);
  assert.match(vendorSub, /Only the store owner can open this page/);
  assert.match(vendorPayouts, /Only the store owner can open this page/);
  const adminNav = read("app/admin-dashboard/layout.tsx");
  assert.match(adminNav, /title: "Plans & Subscriptions", href: "\/admin-dashboard\/subscriptions", icon: Star, color: "text-\[#7c3aed\]", permissionKey: "OWNER_ONLY"/);
  assert.match(adminNav, /title: "Vendor Payouts", href: "\/admin-dashboard\/payouts"/);
  assert.match(adminNav, /title: "POS Subscriptions", href: "\/admin-dashboard\/pos-subscriptions"/, "POS page untouched");
  const vendorNav = read("app/vendor-dashboard/layout.tsx");
  assert.match(vendorNav, /title: "Subscription Plan", href: "\/vendor-dashboard\/subscription", icon: Crown, color: "text-\[#7c3aed\]", permissionKey: "OWNER_ONLY"/);
  assert.match(vendorNav, /title: "Payouts", href: "\/vendor-dashboard\/payouts", icon: Wallet, color: "text-\[#4f46e5\]", permissionKey: "OWNER_ONLY"/);
  assert.match(vendorNav, /title: "POS Subscription", href: "\/vendor-dashboard\/pos-billing"/);
});

test("no silent charges: vendor requests are confirmed by FinixMart; admin payments are idempotent and amount-checked", () => {
  assert.match(vendorSub, /Nothing is charged here/);
  assert.ok(!/checkout|sslcommerz|gateway/i.test(vendorSub), "no online checkout in v1");
  assert.match(vendorSections, /const idempotencyKey = useMemo\(\(\) => newIdempotencyKey\("subpay"\), \[\]\)/);
  assert.match(vendorSections, /mismatch && overrideReason\.trim\(\)\.length < 3/);
  assert.match(vendorSections, /Only record money you have already received/);
});

test("payouts: manual approval, reference + confirmation before mark paid, holds keep the reason internal, flows never mix", () => {
  assert.match(payoutSections, /FinixMart doesn&apos;t send money automatically/);
  assert.match(payoutSections, /disabled=\{reference\.trim\(\)\.length < 3 \|\| !sure\}/);
  assert.match(payoutSections, /onChange=\{\(\) => setP\(\{ \.\.\.p, requireApproval: true \}\)\}/, "manual approval can't be switched off in v1");
  assert.ok(!/holdReason|heldReason/.test(vendorPayouts), "vendors never see admin hold notes");
  assert.ok(!/subscription/i.test(vendorPayouts.replace(/subscription payments are a separate page/i, "")), "the payout page doesn't show billing");
  assert.ok(!/payout/i.test(vendorSub), "the billing page doesn't show earnings");
});

test("mobile: section navigation scrolls on phones, tables scroll inside their card, dialogs become bottom sheets", () => {
  const ui = read("components/billing/ui.tsx");
  assert.match(ui, /overflow-x-auto px-1 pb-1 lg:sticky/);
  assert.match(ui, /items-end justify-center .* sm:items-center/);
  for (const src of [vendorSub, vendorPayouts, payoutSections, vendorSections]) assert.match(src, /overflow-x-auto/);
});
