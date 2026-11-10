// components/reviews/review-types.ts
//
// Shape-tolerant view models for the review UI.
//
// The RTK Query slice (features/productReviewApi.ts) types only what the
// backend returned when it was written: id/rating/comment/dates/user. The
// Increment-2 schema adds `status`, `orderItemId`, images, a seller reply and
// comment threads — none of which are in the generated Prisma client yet, so
// the API may omit them at any time. Every field beyond the original five is
// therefore optional here, and nothing in the UI assumes it exists.

/** Hard cap from the backend policy (review-write-rules.ts MAX_REVIEW_IMAGES). */
export const MAX_REVIEW_IMAGES = 3;

/** Longest comment the API accepts today; the counter stops at this. */
export const MAX_REVIEW_COMMENT = 1000;

export type ReviewStatus = "PUBLISHED" | "HIDDEN" | string;

export interface ReviewImageDto {
  id?: string;
  url: string;
  position?: number;
}

export interface ReviewAuthorDto {
  id: string;
  name?: string | null;
}

/** Product context returned by the vendor and admin list endpoints. */
export interface ReviewProductRef {
  id: string;
  name?: string | null;
  slug?: string | null;
  vendor?: { id: string; storeName?: string | null } | null;
}

export interface ReviewCommentDto {
  id: string;
  body: string;
  createdAt: string;
  parentId?: string | null;
  user?: ReviewAuthorDto | null;
  replies?: ReviewCommentDto[] | null;
}

export interface ReviewDto {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  userId?: string;
  productId?: string;
  user?: ReviewAuthorDto | null;
  /** Present on the vendor/admin feeds; absent on the public product list. */
  product?: ReviewProductRef | null;
  /** Present once the API exposes it; absent on the current contract. */
  status?: ReviewStatus;
  /** Set on reviews written against a delivered order line. */
  orderItemId?: string | null;
  images?: ReviewImageDto[] | null;
  vendorReply?: string | null;
  vendorReplyAt?: string | null;
  comments?: ReviewCommentDto[] | null;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason?: "NOT_PURCHASED" | "NOT_DELIVERED" | "RETURNED" | string;
  orderItemId?: string;
  vendorOrderId?: string;
  deliveredAt?: string | null;
}

export const ELIGIBILITY_MESSAGES: Record<string, string> = {
  NOT_PURCHASED: "Only customers who bought this product can review it.",
  NOT_DELIVERED: "Your order has to be delivered before you can review this product.",
  RETURNED: "This item was returned, so it can no longer be reviewed.",
};

export function initialsOf(name?: string | null): string {
  const clean = (name ?? "").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Deterministic, locale-free date so server and client render identically. */
export function formatReviewDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][d.getUTCMonth()];
  return `${d.getUTCDate()} ${month} ${d.getUTCFullYear()}`;
}

/**
 * `/reviews/me` returned a single row when the slice was written and returns a
 * LIST after the Increment-2 service change. Accept either, plus a bare array,
 * so a deploy in either direction cannot blank the section.
 */
export function normalizeReviewList(payload: unknown): ReviewDto[] {
  if (!payload || typeof payload !== "object") return [];
  const box = payload as { data?: unknown };
  const data = Array.isArray(box.data) ? box.data : box.data ? [box.data] : [];
  return data.filter((r): r is ReviewDto => !!r && typeof (r as ReviewDto).id === "string");
}

/** Sorts the distribution into 5→1 and keeps the API's numbers intact. */
export function normalizeDistribution(summary?: {
  ratingDistribution?: { star: number; count: number; percentage: number }[];
}): { star: number; count: number; percentage: number }[] {
  const given = summary?.ratingDistribution ?? [];
  return [5, 4, 3, 2, 1].map((star) => {
    const hit = given.find((d) => d.star === star);
    return { star, count: hit?.count ?? 0, percentage: hit?.percentage ?? 0 };
  });
}
