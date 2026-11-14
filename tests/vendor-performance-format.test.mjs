// tests/vendor-performance-format.test.mjs
//
// Pure display rules for the vendor-performance UI. The point of these tests is
// data honesty: a null metric is "Collecting data" (or "Not tracked" for the
// vendor-cancel rate that has no source yet), never 0% or 100%.
//   node --test tests/vendor-performance-format.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);

const f = await import("../src/components/vendor-performance/format.ts");

const DAY = "2026-11-14T00:00:00.000Z";

const CONFIG = {
  version: "score-v1",
  notEnoughDataCoveragePct: 40,
  atRiskScoreCap: 49,
  catalogFlagMinProducts: 10,
  gradeBands: [
    { grade: "A", min: 85 },
    { grade: "B", min: 70 },
    { grade: "C", min: 50 },
    { grade: "D", min: 0 },
  ],
  groups: [
    {
      key: "order",
      label: "Order",
      weight: 30,
      metrics: [
        { key: "acceptRate", weight: 40, scale: "linear", at100: 95, at0: 70 },
        { key: "medianAcceptMinutes", weight: 20, scale: "linear", at100: 30, at0: 240 },
        { key: "onTimeDispatchRate", weight: 30, scale: "linear", at100: 95, at0: 70 },
        { key: "vendorFaultCancelRate", weight: 10, scale: "linear", at100: 1, at0: 10 },
      ],
    },
    {
      key: "compliance",
      label: "Compliance",
      weight: 15,
      metrics: [{ key: "kycValidWeightPct", weight: 100, scale: "identity" }],
    },
  ],
};

const METRICS = {
  orderCount: 24,
  acceptRate: 91.2,
  medianAcceptMinutes: null,
  onTimeDispatchRate: null,
  avgDispatchDelayHours: 3.4,
  vendorCancelRate: null,
  vendorFaultCancelRate: 4.2,
  qualifiedProductCount: 6,
  avgCompletenessPct: 61.5,
  grossRevenue: 120000,
  revenueGrowthPct: -3.4,
  repeatBuyerRate: 12,
  avgRating: 4.3,
  returnRate: null,
  refundRate: null,
  kycValidWeightPct: 90,
  kycStatus: "EXPIRING_SOON",
  lastLoginAt: "2026-11-01T00:00:00.000Z",
  activeDays30: 18,
};

const SNAPSHOT = {
  vendorId: "vend-1",
  day: DAY,
  periodDays: 30,
  configVersion: "phase2-v1+score-v1",
  metrics: METRICS,
  score: {
    overallScore: 72.4,
    grade: "B",
    coveragePct: 78,
    groupScores: { order: 70.5, compliance: 90 },
    flags: [],
  },
  sampleSizes: {
    received: 24,
    acceptDenominator: 22,
    acceptMinutes: 22,
    dispatchComparable: 20,
    reviews: 9,
    delivered: 18,
    buyers: 14,
    products: 12,
    loginDays: 18,
  },
  checklist: [],
};

test("null metrics never render as 0% or 100%", () => {
  assert.equal(f.percentText(null), "Collecting data");
  assert.equal(f.percentText(undefined), "Collecting data");
  assert.equal(f.percentText(0), "0%");
  assert.equal(f.percentText(12.34), "12.3%");
  assert.equal(f.scoreText(null), "No score yet");
  assert.equal(f.scoreText(72.44), "72.4");
  assert.equal(f.signedPercentText(null), "Collecting data");
  assert.equal(f.signedPercentText(-3.4), "-3.4%");
});

test("vendor-cancel rate is 'Not tracked', vendor-fault cancel is its own metric", () => {
  const cancel = f.metricDef("vendorCancelRate");
  const fault = f.metricDef("vendorFaultCancelRate");
  assert.equal(f.metricDisplayValue(cancel, METRICS, DAY), "Not tracked");
  assert.equal(f.metricDisplayValue(fault, METRICS, DAY), "4.2%");
  assert.equal(
    f.metricDisplayValue(fault, { ...METRICS, vendorFaultCancelRate: null }, DAY),
    "Collecting data",
  );
  assert.match(cancel.note, /no vendor-initiated cancel flow/i);
});

test("metric values use their unit and nulls stay honest", () => {
  assert.equal(f.metricDisplayValue(f.metricDef("medianAcceptMinutes"), METRICS, DAY), "Collecting data");
  assert.equal(f.metricDisplayValue(f.metricDef("avgRating"), METRICS, DAY), "4.3/5");
  assert.equal(f.metricDisplayValue(f.metricDef("activeDays30"), METRICS, DAY), "18 days");
  assert.equal(f.metricDisplayValue(f.metricDef("qualifiedProductCount"), METRICS, DAY), "6");
  assert.ok(f.metricDisplayValue(f.metricDef("grossRevenue"), METRICS, DAY).startsWith("৳"));
  assert.equal(f.metricDisplayValue(f.metricDef("kycStatus"), METRICS, DAY), "Expiring soon");
  assert.equal(f.daysSince("2026-11-01T00:00:00.000Z", DAY), 13);
  assert.equal(f.daysSince(null, DAY), null);
});

test("localized checklist text follows the app locale, legacy strings pass through", () => {
  const bilingual = { en: "Accept orders promptly", bn: "দ্রুত অর্ডার accept করুন" };
  assert.equal(f.pickLocalized(bilingual, "en"), bilingual.en);
  assert.equal(f.pickLocalized(bilingual, "bn"), bilingual.bn);
  assert.equal(f.pickLocalized("Legacy row", "bn"), "Legacy row");
  assert.equal(f.pickLocalized(null, "bn"), "");
});

test("grade and flag metadata explain the state without colour alone", () => {
  assert.equal(f.gradeMeta("NOT_ENOUGH_DATA").label, "Collecting data");
  assert.equal(f.gradeMeta("NOT_ENOUGH_DATA").tone, "slate");
  assert.equal(f.gradeMeta("AT_RISK").tone, "rose");
  assert.match(f.gradeMeta("AT_RISK").description, /KYC/);
  assert.equal(f.gradeMeta(null).label, "Unknown");

  assert.deepEqual(f.flagMeta({ code: "CATALOG_INCOMPLETE", severity: "warning", message: "x" }), {
    label: "Catalog incomplete",
    tone: "amber",
  });
  assert.equal(f.flagMeta({ code: "KYC_EXPIRED_PAST_GRACE", severity: "critical", message: "x" }).tone, "rose");
  assert.equal(f.kycMeta("EXPIRY_UNKNOWN").label, "Expiry not recorded");
  assert.equal(f.docStateMeta("REJECTED").label, "Rejected");
});

test("trend arrow only appears with a comparable previous snapshot", () => {
  assert.deepEqual(f.scoreTrend(72.4, 70.1), { direction: "up", delta: 2.3, label: "+2.3 vs previous" });
  assert.equal(f.scoreTrend(70.1, 72.4).direction, "down");
  assert.equal(f.scoreTrend(70, 70).direction, "flat");
  assert.equal(f.scoreTrend(70.04, 70).direction, "flat");
  assert.deepEqual(f.scoreTrend(null, 70), { direction: "none", delta: null, label: "No previous snapshot" });
  assert.equal(f.scoreTrend(70, null).direction, "none");
});

test("thresholds are stated in the metric's own unit", () => {
  assert.equal(
    f.thresholdText({ key: "acceptRate", weight: 40, scale: "linear", at100: 95, at0: 70 }, f.metricDef("acceptRate")),
    "Full score at ≥ 95% · 0 at 70%",
  );
  assert.equal(
    f.thresholdText(
      { key: "vendorFaultCancelRate", weight: 10, scale: "linear", at100: 1, at0: 10 },
      f.metricDef("vendorFaultCancelRate"),
    ),
    "Full score at ≤ 1% · 0 at 10%",
  );
  assert.equal(
    f.thresholdText({ key: "qualifiedProductCount", weight: 50, scale: "cap", target: 10 }, f.metricDef("qualifiedProductCount")),
    "Target 10",
  );
  assert.equal(
    f.thresholdText({ key: "kycValidWeightPct", weight: 100, scale: "identity" }, f.metricDef("kycValidWeightPct")),
    "Score = value (0–100%)",
  );
  assert.equal(f.thresholdText(null, f.metricDef("avgRating")), "—");
});

test("sample notes pluralise and disappear without a sample count", () => {
  assert.equal(f.sampleNote(f.metricDef("acceptRate"), SNAPSHOT.sampleSizes), "Based on 22 orders");
  assert.equal(f.sampleNote(f.metricDef("avgRating"), SNAPSHOT.sampleSizes), "Based on 9 reviews");
  assert.equal(f.sampleNote(f.metricDef("avgRating"), { reviews: 1 }), "Based on 1 review");
  assert.equal(f.sampleNote(f.metricDef("acceptRate"), null), null);
  assert.equal(f.sampleNote(f.metricDef("grossRevenue"), SNAPSHOT.sampleSizes), null);
});

test("grade explanations are specific for NOT_ENOUGH_DATA, AT_RISK and letter grades", () => {
  const noData = f.explainGrade(
    { ...SNAPSHOT, score: { ...SNAPSHOT.score, grade: "NOT_ENOUGH_DATA", overallScore: null, coveragePct: 12.5 } },
    CONFIG,
  );
  assert.match(noData, /Not enough data yet/);
  assert.match(noData, /12\.5%/);
  assert.match(noData, /coverage must reach 40%/);
  assert.match(noData, /30-day window/);

  const atRisk = f.explainGrade(
    { ...SNAPSHOT, score: { ...SNAPSHOT.score, grade: "AT_RISK", overallScore: 49 } },
    CONFIG,
  );
  assert.match(atRisk, /KYC document is past its expiry/);
  assert.match(atRisk, /capped at 49/);

  const bandB = f.explainGrade(SNAPSHOT, CONFIG);
  assert.match(bandB, /72\.4\/100/);
  assert.match(bandB, /B band \(70\+\)/);

  assert.match(f.explainGrade(SNAPSHOT, null), /→ grade B/);
});

test("metric rows follow config order and append informational rows", () => {
  const rows = f.metricRowsForGroup("order", CONFIG);
  assert.deepEqual(
    rows.map((row) => row.key),
    ["acceptRate", "medianAcceptMinutes", "onTimeDispatchRate", "vendorFaultCancelRate", "orderCount", "avgDispatchDelayHours", "vendorCancelRate"],
  );
  assert.equal(rows.find((row) => row.key === "acceptRate").informational, false);
  assert.equal(rows.find((row) => row.key === "orderCount").informational, true);
  assert.equal(rows.find((row) => row.key === "acceptRate").rule.weight, 40);

  const fallback = f.metricRowsForGroup("order", null);
  assert.ok(fallback.length >= 7);
  assert.ok(fallback.every((row) => row.rule === null));

  const groupKeys = f.groupKeys(CONFIG).map((group) => group.key);
  assert.deepEqual(groupKeys, ["order", "compliance"]);
  assert.equal(f.groupKeys(null).length, 6);
});

test("catalog issues and KYC expiry text are concrete", () => {
  assert.equal(f.catalogIssueText({ code: "IMAGES", actual: 1, target: 3 }), "1/3 images");
  assert.equal(f.catalogIssueText({ code: "DESCRIPTION", actual: 20, target: 100 }), "20/100 chars");
  assert.equal(f.catalogIssueText({ code: "PRICE", actual: 0, target: 1 }), "No positive price");
  assert.equal(f.catalogIssueText({ code: "STOCK", actual: 0, target: 1 }), "Out of stock");

  assert.equal(f.expiryText({ expiresAt: null, daysLeft: null }), "No expiry date");
  assert.equal(f.expiryText({ expiresAt: DAY, daysLeft: 6 }), "6 days left");
  assert.equal(f.expiryText({ expiresAt: DAY, daysLeft: 0 }), "Expires today");
  assert.equal(f.expiryText({ expiresAt: DAY, daysLeft: -3 }), "3 days ago");

  const doc = { requiresExpiry: true, expiresAt: DAY, daysLeft: -3, graceDaysLeft: 4 };
  assert.equal(f.graceText(doc), "Grace: 4 days left");
  assert.equal(f.graceText({ ...doc, graceDaysLeft: -2 }), "Grace passed — listings restricted");
  assert.equal(f.graceText({ ...doc, daysLeft: 3 }), null);
  assert.equal(f.graceText({ ...doc, requiresExpiry: false }), null);
});

test("API errors keep the server message and document 409/503", () => {
  const validation = f.apiErrorText(
    { status: 400, data: { message: "Invalid score config", errors: ["group weights must sum to 100 (got 90)"] } },
    "fallback",
  );
  assert.equal(validation.message, "Invalid score config");
  assert.deepEqual(validation.details, ["group weights must sum to 100 (got 90)"]);

  assert.equal(f.apiErrorText({ status: 409 }, "fallback").message, "A vendor performance run is already in progress.");
  assert.match(f.apiErrorText({ status: 503 }, "fallback").message, /Redis/);
  assert.equal(f.apiErrorText({ status: 500, data: { message: "Boom" } }, "fallback").message, "Boom");
});

test("run results state dry-run vs saved and count product changes", () => {
  const result = {
    success: true,
    dryRun: true,
    vendorId: "vend-1",
    day: DAY,
    snapshot: { ...SNAPSHOT.score, orderCount: 24, qualifiedProductCount: 6, avgCompletenessPct: 61.5 },
    productCompleteness: [
      { productId: "p1", completenessScore: 40, current: 60, written: false },
      { productId: "p2", completenessScore: 88, current: 88, written: false },
    ],
  };
  const lines = f.runResultLines(result);
  assert.match(lines[0], /^Dry run for/);
  assert.match(lines[1], /Score 72\.4 · grade B · coverage 78%/);
  assert.equal(lines[2], "1 of 2 products would change");

  const saved = f.runResultLines({ ...result, dryRun: false, productCompleteness: [{ productId: "p1", completenessScore: 40, current: 60, written: true }] });
  assert.match(saved[0], /^Saved for/);
  assert.equal(saved[2], "1 of 1 products updated");
});

test("config and shadow-mode helpers", () => {
  assert.deepEqual(f.configVersionParts("phase2-v1+score-v1"), { platform: "phase2-v1", score: "score-v1" });
  assert.deepEqual(f.configVersionParts(null), { platform: null, score: null });
  assert.match(f.shadowModeText(false), /403/);
  assert.match(f.shadowModeText(true), /visible/i);
  assert.equal(f.coverageTone(85), "emerald");
  assert.equal(f.coverageTone(39), "amber");
  assert.equal(f.coverageTone(0), "rose");
  assert.equal(f.coverageTone(null), "slate");
});
