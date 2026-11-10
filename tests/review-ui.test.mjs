// tests/review-ui.test.mjs
//
// Review UI: shared components + wiring. No browser, no network, no backend.
// The orchestrator (product-reviews.tsx) is asserted at source level because it
// needs a live RTK Query store; every presentational component it composes is
// rendered here for real.
//
//   node --test tests/review-ui.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register("./support/tsx-loader.mjs", import.meta.url);

const { createElement: h } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");

const { StarRating, StarRatingInput } = await import("../src/components/reviews/star-rating.tsx");
const { ReviewImages } = await import("../src/components/reviews/review-images.tsx");
const { ReviewCard } = await import("../src/components/reviews/review-card.tsx");
const { ReviewThread } = await import("../src/components/reviews/review-thread.tsx");
const { ReviewFilters } = await import("../src/components/reviews/review-filters.tsx");
const { ReviewForm } = await import("../src/components/reviews/review-form.tsx");
const { ReviewEmpty, ReviewError, ReviewSkeleton } = await import(
  "../src/components/reviews/review-states.tsx"
);
const types = await import("../src/components/reviews/review-types.ts");

const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const count = (haystack, needle) => haystack.split(needle).length - 1;

const review = (over = {}) => ({
  id: "r1",
  rating: 5,
  comment: "Great build quality, arrived a day early.",
  createdAt: "2026-10-01T10:00:00.000Z",
  user: { id: "u1", name: "Ayesha Rahman" },
  ...over,
});

test("MAX_REVIEW_IMAGES is the three-image cap the UI enforces", () => {
  assert.equal(types.MAX_REVIEW_IMAGES, 3);
  assert.equal(types.MAX_REVIEW_COMMENT, 1000);
});

test("ReviewImages renders at most three photos and keeps alt text per photo", () => {
  const images = [1, 2, 3, 4].map((n) => ({ id: `i${n}`, url: `/uploads/r${n}.jpg` }));
  const html = renderToStaticMarkup(h(ReviewImages, { images, authorName: "Ayesha" }));
  assert.equal(count(html, "<img"), 3, "a fourth image must not be rendered");
  assert.match(html, /Photo 1 from Ayesha/);
  assert.match(html, /Open review photo 3 of 3/);
});

test("ReviewCard shows verified purchase, seller reply, images and the thread", () => {
  const html = renderToStaticMarkup(
    h(ReviewCard, {
      review: review({
        orderItemId: "oi1",
        vendorReply: "Thanks for the kind words!",
        vendorReplyAt: "2026-10-02T09:00:00.000Z",
        images: [{ id: "i1", url: "/uploads/a.jpg" }],
        comments: [
          { id: "c1", body: "Does it fit a 15-inch laptop?", createdAt: "2026-10-03T09:00:00.000Z", user: { id: "u2", name: "Rafi" }, replies: [] },
        ],
      }),
    })
  );
  assert.match(html, /Ayesha Rahman/);
  assert.match(html, /Verified purchase/);
  assert.match(html, /Seller response/);
  assert.match(html, /Thanks for the kind words/);
  assert.match(html, /Does it fit a 15-inch laptop\?/);
  assert.match(html, /Great build quality/);
});

test("a legacy review (no orderItemId) is not labelled verified", () => {
  const html = renderToStaticMarkup(h(ReviewCard, { review: review({ orderItemId: null }) }));
  assert.doesNotMatch(html, /Verified purchase/);
});

test("HIDDEN reviews carry a badge only when the viewer may see status", () => {
  const visible = renderToStaticMarkup(h(ReviewCard, { review: review({ status: "HIDDEN" }), showStatus: true }));
  assert.match(visible, /hidden/);
  const storefront = renderToStaticMarkup(h(ReviewCard, { review: review({ status: "HIDDEN" }) }));
  assert.doesNotMatch(storefront, />hidden</);
});

test("ReviewThread renders replies and explains why composing is off", () => {
  const comments = [
    { id: "c1", body: "Top level", createdAt: "2026-10-03T09:00:00.000Z", user: { id: "u2", name: "Rafi" } },
    { id: "c2", body: "Nested reply", parentId: "c1", createdAt: "2026-10-03T10:00:00.000Z", user: { id: "u3", name: "Nadia" } },
  ];
  const off = renderToStaticMarkup(h(ReviewThread, { comments }));
  assert.match(off, /Top level/);
  assert.match(off, /Nested reply/);
  assert.match(off, /Replies open once the comment API ships/);

  const on = renderToStaticMarkup(h(ReviewThread, { comments, onSubmit: () => {} }));
  assert.match(on, /Reply/);
  assert.doesNotMatch(on, /Replies open once the comment API ships/);
});

test("Rating filter chips expose the active state and clear action", () => {
  const html = renderToStaticMarkup(
    h(ReviewFilters, {
      rating: 4,
      onRating: () => {},
      sortBy: "newest",
      onSort: () => {},
      counts: { 5: 3, 4: 1 },
      total: 4,
    })
  );
  assert.match(html, /All \(4\)/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Clear/);
  assert.match(html, /Highest rating/);
  assert.match(html, /4 star/);
});

test("StarRating is announced to screen readers", () => {
  const html = renderToStaticMarkup(h(StarRating, { value: 4.4 }));
  assert.match(html, /aria-label="Rated 4.4 out of 5"/);
});

test("StarRatingInput exposes five radios with the current choice checked", () => {
  const html = renderToStaticMarkup(h(StarRatingInput, { value: 3, onChange: () => {} }));
  assert.equal(count(html, 'role="radio"'), 5);
  assert.equal(count(html, 'aria-checked="true"'), 1);
  assert.match(html, /aria-label="3 stars"/);
});

test("ReviewForm blocks submit until a rating exists and offers the photo picker", () => {
  const empty = renderToStaticMarkup(h(ReviewForm, { onSubmit: () => {} }));
  assert.match(empty, /disabled/, "submit must start disabled");
  assert.match(empty, /Choose photos/, "the picker is enabled now that the API exists");
  assert.match(empty, /up to 5 MB each/);
  assert.match(empty, /type="file"/);
  assert.match(empty, /0\/1000/);

  const filled = renderToStaticMarkup(
    h(ReviewForm, { initialRating: 4, initialComment: "Solid", onSubmit: () => {} })
  );
  assert.doesNotMatch(filled, /Pick a star rating first/);
});

test("list states render a retry, an empty message and a skeleton", () => {
  const error = renderToStaticMarkup(h(ReviewError, { onRetry: () => {} }));
  assert.match(error, /role="alert"/);
  assert.match(error, /Retry/);

  const empty = renderToStaticMarkup(h(ReviewEmpty, { title: "No 5-star reviews yet" }));
  assert.match(empty, /No 5-star reviews yet/);

  const skeleton = renderToStaticMarkup(h(ReviewSkeleton, { rows: 2 }));
  assert.equal(count(skeleton, "animate-pulse"), 2);
});

test("normalizeReviewList accepts a single row, a list and an envelope", () => {
  const row = review();
  assert.deepEqual(types.normalizeReviewList({ data: row }).map((r) => r.id), ["r1"]);
  assert.deepEqual(types.normalizeReviewList({ data: [row] }).map((r) => r.id), ["r1"]);
  assert.deepEqual(types.normalizeReviewList(null), []);
});

test("helpers are locale-free", () => {
  assert.equal(types.initialsOf("Ayesha Rahman"), "AR");
  assert.equal(types.initialsOf(""), "?");
  assert.equal(types.formatReviewDate("2026-10-01T10:00:00.000Z"), "1 Oct 2026");
  assert.deepEqual(
    types.normalizeDistribution({ ratingDistribution: [{ star: 5, count: 2, percentage: 100 }] }).map((d) => d.star),
    [5, 4, 3, 2, 1]
  );
});

test("customer product page mounts the review section with server summary data", () => {
  const page = src("app/products/[id]/SingleProductClient.tsx");
  assert.match(page, /import \{ ProductReviews \} from "@\/components\/reviews\/product-reviews"/);
  assert.match(page, /<ProductReviews/);
  assert.match(page, /summary=\{product\.reviewSummary\}/);
  assert.match(page, /isAuthenticated=\{isAuthenticated\}/);
  assert.match(page, /onRequireAuth=\{\(\) => setIsLoginModalOpen\(true\)\}/);
  assert.match(page, /product-reviews"\)\?\.scrollIntoView/);
});

test("orchestrator uses the real endpoints and reports failures", () => {
  const screen = src("components/reviews/product-reviews.tsx");
  for (const hook of [
    "useGetProductReviewsQuery",
    "useGetMyProductReviewQuery",
    "useGetReviewEligibilityQuery",
    "useCreateReviewMutation",
    "useUpdateReviewMutation",
    "useDeleteReviewMutation",
  ]) {
    assert.match(screen, new RegExp(hook), `${hook} must be wired`);
  }
  assert.match(screen, /limit: PAGE_SIZE/);
  assert.match(screen, /Could not save your review/);
  assert.match(screen, /Your review is published/);
  assert.match(screen, /Delete your review\?/);

  const eligibility = src("features/productReviewEligibilityApi.ts");
  assert.match(eligibility, /`\/products\/\$\{productId\}\/reviews\/eligibility`/);
});

test("feeds call the real routes and gate writes on the server's schemaReady meta", () => {
  const api = src("features/reviewModerationApi.ts");
  assert.match(api, /export const REVIEW_MODERATION_API_READY = true/);
  assert.match(api, /url: "\/vendor\/reviews"/);
  assert.match(api, /`\/vendor\/reviews\/\$\{reviewId\}\/reply`/);
  assert.match(api, /url: "\/admin\/reviews"/);
  assert.match(api, /`\/admin\/reviews\/\$\{reviewId\}\/status`/);

  for (const screen of ["components/reviews/vendor-reviews-screen.tsx", "components/reviews/admin-reviews-screen.tsx"]) {
    const body = src(screen);
    assert.match(body, /skip: !enabled/, `${screen} must skip while disabled`);
    assert.match(body, /meta\?\.schemaReady/, `${screen} must read the server capability`);
    assert.match(body, /canReply|canModerate/, `${screen} must not enable writes unconditionally`);
  }
});

test("dashboard pages exist at the slot routes", () => {
  assert.match(src("app/vendor-dashboard/@main/reviews/page.tsx"), /VendorReviewsScreen/);
  assert.match(src("app/admin-dashboard/@main/reviews/page.tsx"), /AdminReviewsScreen/);
});

test("both dashboard screens render their integration state without a request", async () => {
  const { configureStore } = await import("@reduxjs/toolkit");
  const { Provider } = await import("react-redux");
  const { productApiBase } = await import("../src/features/productapi/productApiBase.ts");
  const { VendorReviewsScreen } = await import("../src/components/reviews/vendor-reviews-screen.tsx");
  const { AdminReviewsScreen } = await import("../src/components/reviews/admin-reviews-screen.tsx");

  const store = configureStore({
    reducer: { [productApiBase.reducerPath]: productApiBase.reducer },
    middleware: (getDefault) => getDefault().concat(productApiBase.middleware),
  });

  const vendor = renderToStaticMarkup(
    h(Provider, { store }, h(VendorReviewsScreen, { enabled: false }))
  );
  assert.match(vendor, /Vendor review feed is disabled/);
  assert.match(vendor, /POST/, "the required contract is listed by method");
  assert.match(vendor, /\/api\/vendor\/reviews/);
  assert.match(vendor, /feed disabled/);
  assert.match(vendor, /Feed disabled/);

  const admin = renderToStaticMarkup(h(Provider, { store }, h(AdminReviewsScreen, { enabled: false })));
  assert.match(admin, /Moderation queue is disabled/);
  assert.match(admin, /\/api\/admin\/reviews/);
  assert.match(admin, /Queue disabled/);
  assert.match(admin, /Hidden/);

  // Nothing was fetched: both queries are skipped while the screen is disabled.
  const state = store.getState()[productApiBase.reducerPath];
  assert.equal(Object.keys(state.queries).length, 0, "a disabled screen must not query");
});
