// src/lib/ads/ads-demo.ts
//
// Advertisement UI — FRONTEND-ONLY DEMO LAYER.
//
// There is no advertisement API yet (no routes, no lifecycle, no ad payments).
// Everything here is local and non-persistent:
//   - the types describe what the screens display, not an API contract;
//   - DEMO_* records are sample data for layout only — never real campaigns,
//     inventory, prices, payments or analytics;
//   - "save", "submit", "approve" and "reject" only change local React state.
// Pure helpers (filter / sort / paginate / validate / review) are unit-tested
// in tests/ads-ui.test.mjs and stay reusable when a real API is connected.

export type AdType = "STORE" | "PRODUCT";

/** Displayed lifecycle. Approval comes first, then payment; there are no
 *  paid/running states in this phase (no payment flow exists yet). */
export type AdStatus = "DRAFT" | "PENDING_REVIEW" | "PAYMENT_PENDING" | "REJECTED";

export type AdPlacementId =
  | "HOME_FEATURED_STORES"
  | "CATEGORY_FEATURED_STORES"
  | "HOME_SPONSORED_PRODUCTS"
  | "CATEGORY_SPONSORED_PRODUCTS";

export interface AdPlacement {
  id: AdPlacementId;
  label: string;
  description: string;
  type: AdType;
  needsCategory: boolean;
}

export const AD_PLACEMENTS: readonly AdPlacement[] = [
  { id: "HOME_FEATURED_STORES", label: "Homepage · Featured stores", description: "Store spotlight on the homepage", type: "STORE", needsCategory: false },
  { id: "CATEGORY_FEATURED_STORES", label: "Category page · Featured stores", description: "Store spotlight on one category page", type: "STORE", needsCategory: true },
  { id: "HOME_SPONSORED_PRODUCTS", label: "Homepage · Sponsored products", description: "Product row on the homepage", type: "PRODUCT", needsCategory: false },
  { id: "CATEGORY_SPONSORED_PRODUCTS", label: "Category page · Sponsored products", description: "Product row on one category page", type: "PRODUCT", needsCategory: true },
];

export const AD_DURATIONS_DAYS = [7, 14, 30] as const;

/** UI-only limit for this phase — the backend does not enforce it (no API yet). */
export const MAX_AD_PRODUCTS = 10;
export const MAX_HEADLINE = 80;
export const MAX_TITLE = 100;
export const MAX_REJECTION_REASON = 500;

export const AD_STATUS_LABEL: Record<AdStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  PAYMENT_PENDING: "Approved · payment pending",
  REJECTED: "Rejected",
};

export const AD_TYPE_LABEL: Record<AdType, string> = { STORE: "Store Ad", PRODUCT: "Product Ad" };

export interface AdProduct {
  id: string;
  name: string;
  image?: string;
  price?: string;
}

export interface AdCampaign {
  id: string;
  type: AdType;
  title: string;
  status: AdStatus;
  placement: AdPlacementId;
  categoryName?: string;
  durationDays: number;
  vendor: { id: string; storeName: string; logoUrl?: string };
  headline?: string;
  bannerUrl?: string;
  products: AdProduct[];
  submittedAt?: string;
  updatedAt: string;
  review?: { decidedAt: string; note?: string; rejectionReason?: string };
  /** Always true here: every record in this module is sample data. */
  demo: true;
}

export const placementById = (id: AdPlacementId) => AD_PLACEMENTS.find((p) => p.id === id)!;
export const placementsFor = (type: AdType) => AD_PLACEMENTS.filter((p) => p.type === type);

// ── demo data ───────────────────────────────────────────────────────────────

const demoProducts = (n: number): AdProduct[] =>
  Array.from({ length: n }, (_, i) => ({ id: `demo-product-${i + 1}`, name: `Sample product ${i + 1}` }));

/** Sample campaigns for the vendor screens ("your" store). */
export function demoVendorCampaigns(storeName = "Your store"): AdCampaign[] {
  const vendor = { id: "demo-vendor", storeName };
  return [
    { id: "demo-ad-1", type: "STORE", title: "Spring store spotlight", status: "PENDING_REVIEW", placement: "HOME_FEATURED_STORES", durationDays: 14, vendor, headline: "New season, new arrivals", products: [], submittedAt: "2026-10-10T09:30:00.000Z", updatedAt: "2026-10-10T09:30:00.000Z", demo: true },
    { id: "demo-ad-2", type: "PRODUCT", title: "Best sellers push", status: "PAYMENT_PENDING", placement: "HOME_SPONSORED_PRODUCTS", durationDays: 7, vendor, products: demoProducts(4), submittedAt: "2026-10-05T11:00:00.000Z", updatedAt: "2026-10-07T15:20:00.000Z", review: { decidedAt: "2026-10-07T15:20:00.000Z", note: "Looks good." }, demo: true },
    { id: "demo-ad-3", type: "PRODUCT", title: "Kitchen category row", status: "REJECTED", placement: "CATEGORY_SPONSORED_PRODUCTS", categoryName: "Sample category", durationDays: 30, vendor, products: demoProducts(2), submittedAt: "2026-10-01T08:00:00.000Z", updatedAt: "2026-10-02T10:45:00.000Z", review: { decidedAt: "2026-10-02T10:45:00.000Z", rejectionReason: "Product images do not meet the placement guidelines." }, demo: true },
    { id: "demo-ad-4", type: "STORE", title: "Category store banner", status: "DRAFT", placement: "CATEGORY_FEATURED_STORES", categoryName: "Sample category", durationDays: 14, vendor, headline: "", products: [], updatedAt: "2026-10-12T13:10:00.000Z", demo: true },
  ];
}

/** Sample review queue for the admin screens (several sample stores). */
export function demoAdminCampaigns(): AdCampaign[] {
  const v = (n: string) => ({ id: `demo-vendor-${n}`, storeName: `Sample Store ${n}` });
  return [
    { id: "demo-rev-1", type: "PRODUCT", title: "Weekend deals row", status: "PENDING_REVIEW", placement: "HOME_SPONSORED_PRODUCTS", durationDays: 7, vendor: v("A"), products: demoProducts(6), submittedAt: "2026-10-14T07:15:00.000Z", updatedAt: "2026-10-14T07:15:00.000Z", demo: true },
    { id: "demo-rev-2", type: "STORE", title: "Store spotlight", status: "PENDING_REVIEW", placement: "HOME_FEATURED_STORES", durationDays: 14, vendor: v("B"), headline: "Handmade, locally sourced", products: [], submittedAt: "2026-10-13T12:40:00.000Z", updatedAt: "2026-10-13T12:40:00.000Z", demo: true },
    { id: "demo-rev-3", type: "PRODUCT", title: "Category feature", status: "PENDING_REVIEW", placement: "CATEGORY_SPONSORED_PRODUCTS", categoryName: "Sample category", durationDays: 30, vendor: v("C"), products: demoProducts(10), submittedAt: "2026-10-12T16:05:00.000Z", updatedAt: "2026-10-12T16:05:00.000Z", demo: true },
    { id: "demo-rev-4", type: "STORE", title: "Brand week", status: "PAYMENT_PENDING", placement: "CATEGORY_FEATURED_STORES", categoryName: "Sample category", durationDays: 7, vendor: v("D"), headline: "Brand week", products: [], submittedAt: "2026-10-09T10:00:00.000Z", updatedAt: "2026-10-10T09:00:00.000Z", review: { decidedAt: "2026-10-10T09:00:00.000Z", note: "Approved for the category page." }, demo: true },
    { id: "demo-rev-5", type: "PRODUCT", title: "Clearance row", status: "REJECTED", placement: "HOME_SPONSORED_PRODUCTS", durationDays: 14, vendor: v("E"), products: demoProducts(3), submittedAt: "2026-10-08T14:30:00.000Z", updatedAt: "2026-10-09T08:20:00.000Z", review: { decidedAt: "2026-10-09T08:20:00.000Z", rejectionReason: "Two products are out of stock." }, demo: true },
  ];
}

// ── list helpers ────────────────────────────────────────────────────────────

export type AdStatusFilter = AdStatus | "ALL";
export type AdTypeFilter = AdType | "ALL";
export type AdSort = "newest" | "oldest" | "title";

export interface AdListQuery {
  search?: string;
  status?: AdStatusFilter;
  type?: AdTypeFilter;
  sort?: AdSort;
}

const timeOf = (c: AdCampaign) => new Date(c.submittedAt ?? c.updatedAt).getTime();

export function filterAndSortAds(list: AdCampaign[], q: AdListQuery = {}): AdCampaign[] {
  const needle = (q.search ?? "").trim().toLowerCase();
  const out = list.filter(
    (c) =>
      (!q.status || q.status === "ALL" || c.status === q.status) &&
      (!q.type || q.type === "ALL" || c.type === q.type) &&
      (!needle || c.title.toLowerCase().includes(needle) || c.vendor.storeName.toLowerCase().includes(needle)),
  );
  const sort = q.sort ?? "newest";
  return out.sort((a, b) =>
    sort === "title" ? a.title.localeCompare(b.title) : sort === "oldest" ? timeOf(a) - timeOf(b) : timeOf(b) - timeOf(a),
  );
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, totalPages, total: items.length };
}

export function adSummary(list: AdCampaign[]) {
  const count = (s: AdStatus) => list.filter((c) => c.status === s).length;
  return {
    total: list.length,
    draft: count("DRAFT"),
    pendingReview: count("PENDING_REVIEW"),
    // Approved = admin-approved. In this phase every approved campaign is
    // still awaiting payment (no payment flow exists yet).
    approved: count("PAYMENT_PENDING"),
    paymentPending: count("PAYMENT_PENDING"),
    rejected: count("REJECTED"),
  };
}

/** Vendors may edit only campaigns that are not under or past review. */
export const canVendorEdit = (status: AdStatus) => status === "DRAFT" || status === "REJECTED";

// ── form ────────────────────────────────────────────────────────────────────

export interface AdFormState {
  type: AdType;
  title: string;
  headline: string;
  placement: AdPlacementId | "";
  categoryId: string;
  categoryName: string;
  durationDays: number | "";
  products: AdProduct[];
  logoPreviewUrl?: string;
  bannerPreviewUrl?: string;
}

export type AdFormErrors = Partial<Record<"type" | "title" | "headline" | "placement" | "category" | "durationDays" | "products", string>>;

export const emptyAdForm = (type: AdType = "STORE"): AdFormState => ({
  type,
  title: "",
  headline: "",
  placement: "",
  categoryId: "",
  categoryName: "",
  durationDays: "",
  products: [],
});

export function adToForm(c: AdCampaign): AdFormState {
  return {
    type: c.type,
    title: c.title,
    headline: c.headline ?? "",
    placement: c.placement,
    categoryId: "",
    categoryName: c.categoryName ?? "",
    durationDays: c.durationDays,
    products: c.products,
    logoPreviewUrl: c.vendor.logoUrl,
    bannerPreviewUrl: c.bannerUrl,
  };
}

/** Changing the type clears what belongs to the other type. */
export function switchAdType(form: AdFormState, type: AdType): AdFormState {
  if (form.type === type) return form;
  return { ...form, type, placement: "", products: type === "PRODUCT" ? form.products : [], headline: type === "STORE" ? form.headline : "" };
}

/** `mode: "draft"` only needs a title; `"submit"` needs everything. */
export function validateAdForm(form: AdFormState, mode: "draft" | "submit"): AdFormErrors {
  const e: AdFormErrors = {};
  const title = form.title.trim();
  if (!title) e.title = "Campaign title is required";
  else if (title.length > MAX_TITLE) e.title = `Keep the title under ${MAX_TITLE} characters`;
  if (form.headline.trim().length > MAX_HEADLINE) e.headline = `Keep the headline under ${MAX_HEADLINE} characters`;
  if (form.products.length > MAX_AD_PRODUCTS) e.products = `Select at most ${MAX_AD_PRODUCTS} products`;
  if (mode === "draft") return e;

  if (form.type === "STORE" && !form.headline.trim()) e.headline = "Add a headline for the store ad";
  if (form.type === "PRODUCT" && form.products.length === 0) e.products = "Select at least one product";
  const placement = form.placement ? placementById(form.placement) : undefined;
  if (!placement) e.placement = "Choose where the ad should appear";
  else if (placement.type !== form.type) e.placement = "This placement is not available for this campaign type";
  else if (placement.needsCategory && !form.categoryName.trim()) e.category = "Choose the category page";
  if (!form.durationDays || !(AD_DURATIONS_DAYS as readonly number[]).includes(Number(form.durationDays))) e.durationDays = "Choose a campaign duration";
  return e;
}

// ── admin review (demo) ─────────────────────────────────────────────────────

export type ReviewDecision = { decision: "approve"; note?: string } | { decision: "reject"; reason: string; note?: string };

/** Local-only review: only PENDING_REVIEW can be decided; rejecting needs a reason.
 *  Returns the updated campaign or an error message. Nothing is persisted. */
export function applyDemoReview(c: AdCampaign, d: ReviewDecision, now = new Date()): { ok: true; campaign: AdCampaign } | { ok: false; error: string } {
  if (c.status !== "PENDING_REVIEW") return { ok: false, error: `Only campaigns pending review can be decided (this one is ${AD_STATUS_LABEL[c.status].toLowerCase()}).` };
  const note = d.note?.trim() || undefined;
  if (d.decision === "reject") {
    const reason = d.reason.trim();
    if (!reason) return { ok: false, error: "A rejection reason is required." };
    if (reason.length > MAX_REJECTION_REASON) return { ok: false, error: `Keep the reason under ${MAX_REJECTION_REASON} characters.` };
    return { ok: true, campaign: { ...c, status: "REJECTED", updatedAt: now.toISOString(), review: { decidedAt: now.toISOString(), note, rejectionReason: reason } } };
  }
  return { ok: true, campaign: { ...c, status: "PAYMENT_PENDING", updatedAt: now.toISOString(), review: { decidedAt: now.toISOString(), note } } };
}

export function formatAdDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
