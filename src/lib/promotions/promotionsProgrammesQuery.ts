// lib/promotions/promotionsProgrammesQuery.ts
//
// Pure query-shaping for the Promotions & Programmes screen. Extracted so the
// rules are testable without React/RTK: the backend validates
// { search?: string(<=150), page?: int>=1, limit?: int 1..100 }
// (multivendorbackend/src/modules/marketing/campaign.validators.ts).

export const CAMPAIGN_PAGES_PAGE_SIZE = 10;

export type CampaignPagesQuery = { page: number; limit: number; search?: string };

/**
 * Builds the request arguments. An empty or whitespace-only search is omitted
 * entirely (not sent as ""), and the page is coerced to an integer >= 1.
 */
export function buildCampaignPagesQuery(input: { page?: number; search?: string | null } = {}): CampaignPagesQuery {
  const rawPage = Number(input.page);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const search = (input.search ?? "").trim();
  return search ? { page, limit: CAMPAIGN_PAGES_PAGE_SIZE, search } : { page, limit: CAMPAIGN_PAGES_PAGE_SIZE };
}

/** Typing in the search box always restarts at the first page. */
export function pageAfterSearchChange(): number {
  return 1;
}

export type PaginationMeta = { page?: number; totalPages?: number; total?: number };

/** "Page 1 of 5 · 48 total" — degrades honestly when metadata is missing. */
export function paginationLabel(meta: PaginationMeta | undefined | null): string {
  const page = Math.max(1, Math.floor(Number(meta?.page ?? 1)) || 1);
  const totalPages = Math.max(1, Math.floor(Number(meta?.totalPages ?? 1)) || 1);
  const total = Math.max(0, Math.floor(Number(meta?.total ?? 0)) || 0);
  if (!meta || total === 0) return "Page 1 of 1 · 0 total";
  return `Page ${page} of ${totalPages} · ${total} total`;
}

/** True when the Previous control should be usable. */
export function canGoPrevious(meta: PaginationMeta | undefined | null): boolean {
  return Math.max(1, Math.floor(Number(meta?.page ?? 1)) || 1) > 1;
}

/** True when the Next control should be usable. */
export function canGoNext(meta: PaginationMeta | undefined | null): boolean {
  const page = Math.max(1, Math.floor(Number(meta?.page ?? 1)) || 1);
  const totalPages = Math.max(1, Math.floor(Number(meta?.totalPages ?? 1)) || 1);
  return page < totalPages;
}
// ── aliases used by the Promotions & Programmes screen ──────────────────────
// Same rules as above, under the names the component imports.

export const PROMOTIONS_PAGE_SIZE = CAMPAIGN_PAGES_PAGE_SIZE;

/** Query args with an explicit limit override (still validated to a positive int). */
export function buildListQuery(input: { page?: number; limit?: number; search?: string | null } = {}): CampaignPagesQuery {
  const base = buildCampaignPagesQuery({ page: input.page, search: input.search });
  const limit = Number(input.limit);
  return Number.isFinite(limit) && limit > 0 ? { ...base, limit: Math.floor(limit) } : base;
}

/** Typing in the search box restarts at page one. */
export function pageForSearch(): number {
  return 1;
}

/** Narrow an unknown `pagination` payload to the fields the UI needs. */
export function readPagination(raw: unknown): PaginationMeta | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const p = raw as { page?: unknown; totalPages?: unknown; total?: unknown };
  return {
    page: Number(p.page ?? 1),
    totalPages: Number(p.totalPages ?? 1),
    total: Number(p.total ?? 0),
  };
}
