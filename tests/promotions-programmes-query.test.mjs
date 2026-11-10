// tests/promotions-programmes-query.test.mjs
//   node --test tests/promotions-programmes-query.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./support/tsx-loader.mjs", import.meta.url);
const Q = await import("../src/lib/promotions/promotionsProgrammesQuery.ts");

test("query: defaults to page 1 and limit 10", () => {
  assert.deepEqual(Q.buildCampaignPagesQuery(), { page: 1, limit: 10 });
  assert.deepEqual(Q.buildCampaignPagesQuery({}), { page: 1, limit: 10 });
  assert.equal(Q.CAMPAIGN_PAGES_PAGE_SIZE, 10);
});

test("query: empty or whitespace-only search is not sent at all", () => {
  for (const s of ["", "   ", "\t\n", null, undefined]) {
    const q = Q.buildCampaignPagesQuery({ page: 2, search: s });
    assert.equal("search" in q, false, `search must be omitted for ${JSON.stringify(s)}`);
    assert.equal(q.page, 2);
    assert.equal(q.limit, 10);
  }
});

test("query: a non-empty search is trimmed and passed through", () => {
  assert.deepEqual(Q.buildCampaignPagesQuery({ page: 1, search: "  spring sale  " }), {
    page: 1,
    limit: 10,
    search: "spring sale",
  });
});

test("query: invalid pages are coerced to 1, never sent as 0/NaN", () => {
  for (const p of [0, -3, NaN, 1.9]) {
    const q = Q.buildCampaignPagesQuery({ page: p });
    assert.equal(q.page, p === 1.9 ? 1 : 1, "coerced to 1");
    assert.ok(Number.isInteger(q.page) && q.page >= 1);
  }
});

test("query: changing the search resets to page 1", () => {
  assert.equal(Q.pageAfterSearchChange(), 1);
  const q = Q.buildCampaignPagesQuery({ page: Q.pageAfterSearchChange(), search: "autumn" });
  assert.equal(q.page, 1);
  assert.equal(q.search, "autumn");
});

test("labels: normal results", () => {
  assert.equal(Q.paginationLabel({ page: 1, totalPages: 5, total: 48 }), "Page 1 of 5 · 48 total");
  assert.equal(Q.paginationLabel({ page: 3, totalPages: 5, total: 48 }), "Page 3 of 5 · 48 total");
});

test("labels: empty or missing metadata degrades honestly", () => {
  assert.equal(Q.paginationLabel(undefined), "Page 1 of 1 · 0 total");
  assert.equal(Q.paginationLabel(null), "Page 1 of 1 · 0 total");
  assert.equal(Q.paginationLabel({}), "Page 1 of 1 · 0 total");
  assert.equal(Q.paginationLabel({ page: 1, totalPages: 1, total: 0 }), "Page 1 of 1 · 0 total");
});

test("labels: pager enablement follows the metadata", () => {
  assert.equal(Q.canGoPrevious({ page: 1, totalPages: 3 }), false);
  assert.equal(Q.canGoPrevious({ page: 2, totalPages: 3 }), true);
  assert.equal(Q.canGoNext({ page: 3, totalPages: 3 }), false);
  assert.equal(Q.canGoNext({ page: 2, totalPages: 3 }), true);
  assert.equal(Q.canGoNext(undefined), false);
});