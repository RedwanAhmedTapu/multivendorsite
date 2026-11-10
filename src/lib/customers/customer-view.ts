// lib/customers/customer-view.ts
//
// Admin › Customer Account Management — pure presentation logic. Every value
// is derived from what GET /api/customermanagement actually returns
// (customer.service.ts getCustomers); nothing here invents a field.
//
// Backend contract (customer.controller.ts getCustomers):
//   status    "active" | "blocked" | "all"   (User.isActive true / false)
//   search    name | email | phone, case-insensitive contains
//   startDate / endDate   User.createdAt gte / lte
//   page, limit, sortBy (a User column), sortOrder
//   → { data: User[] (+ customerProfile, _count.reviews), pagination: { total, page, limit, pages } }

export type AccountStatusFilter = "all" | "active" | "blocked";

export const ACCOUNT_STATUS_OPTIONS: { value: AccountStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Suspended" },
];

/** Columns the list endpoint can order by (plain User columns only). */
export const CUSTOMER_SORT_FIELDS = ["createdAt", "name", "email"] as const;
export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];

export const PAGE_SIZES = [10, 25, 50] as const;

export interface CustomerFilters {
  search: string;
  status: AccountStatusFilter;
  /** yyyy-mm-dd (from <input type="date">), inclusive. */
  from: string;
  to: string;
}

export const DEFAULT_FILTERS: CustomerFilters = { search: "", status: "all", from: "", to: "" };

export interface CustomerListState extends CustomerFilters {
  page: number;
  limit: number;
  sortBy: CustomerSortField;
  sortOrder: "asc" | "desc";
}

export const DEFAULT_LIST_STATE: CustomerListState = {
  ...DEFAULT_FILTERS,
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Start / end of a local calendar day as ISO (the end date is inclusive). */
export function dayBoundaryISO(ymd: string, edge: "start" | "end"): string | undefined {
  if (!DATE_RE.test(ymd)) return undefined;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = edge === "start" ? new Date(y, m - 1, d, 0, 0, 0, 0) : new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isFinite(dt.getTime()) ? dt.toISOString() : undefined;
}

export function validateDateRange(from: string, to: string): string | null {
  if (from && !DATE_RE.test(from)) return "Enter a valid start date.";
  if (to && !DATE_RE.test(to)) return "Enter a valid end date.";
  if (from && to && from > to) return "The start date must be on or before the end date.";
  return null;
}

/** Query params for GET /customermanagement — only parameters the API reads. */
export function buildCustomerQuery(s: CustomerListState): Record<string, string | number> {
  const q: Record<string, string | number> = {
    page: Math.max(1, Math.floor(s.page) || 1),
    limit: s.limit,
    sortBy: (CUSTOMER_SORT_FIELDS as readonly string[]).includes(s.sortBy) ? s.sortBy : "createdAt",
    sortOrder: s.sortOrder === "asc" ? "asc" : "desc",
  };
  const search = s.search.trim();
  if (search) q.search = search;
  if (s.status !== "all") q.status = s.status;
  const start = s.from ? dayBoundaryISO(s.from, "start") : undefined;
  const end = s.to ? dayBoundaryISO(s.to, "end") : undefined;
  if (start) q.startDate = start;
  if (end) q.endDate = end;
  return q;
}

export function filtersEqual(a: CustomerFilters, b: CustomerFilters): boolean {
  return a.search.trim() === b.search.trim() && a.status === b.status && a.from === b.from && a.to === b.to;
}

export function hasActiveFilters(f: CustomerFilters): boolean {
  return !filtersEqual(f, DEFAULT_FILTERS);
}

// ---------------------------------------------------------------------------
// Row presentation
// ---------------------------------------------------------------------------

export interface CustomerRowInput {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  customerProfile?: { profileImage?: string | null; wallet?: number | null; loyaltyPoints?: number | null } | null;
}

export type AccountStatus = "active" | "suspended";

/** The only account-state flag on User is isActive (PUT /:id/block writes it). */
export function accountStatus(c: Pick<CustomerRowInput, "isActive">): AccountStatus {
  return c.isActive === false ? "suspended" : "active";
}

export function displayName(c: Pick<CustomerRowInput, "name" | "email" | "phone">): string {
  return c.name?.trim() || c.email?.split("@")[0] || c.phone || "Unnamed customer";
}

export function initials(c: Pick<CustomerRowInput, "name" | "email" | "phone">): string {
  const name = displayName(c);
  const parts = name.split(/\s+/).filter(Boolean);
  const s = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return s.toUpperCase();
}

/** Short, copyable customer reference (the full cuid is shown on View). */
export function shortId(id: string): string {
  return id.length > 10 ? `#${id.slice(-8).toUpperCase()}` : `#${id.toUpperCase()}`;
}

/**
 * Bangladesh mobile numbers → "+880 1XXX-XXXXXX". Anything that isn't a
 * recognisable BD mobile number is returned unchanged (never guessed at).
 */
export function formatBdPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  let local: string | null = null;
  if (/^8801[3-9]\d{8}$/.test(digits)) local = digits.slice(3);
  else if (/^01[3-9]\d{8}$/.test(digits)) local = digits.slice(1);
  else if (/^1[3-9]\d{8}$/.test(digits)) local = digits;
  if (!local) return raw.trim();
  return `+880 ${local.slice(0, 4)}-${local.slice(4)}`;
}

export function formatTaka(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatJoined(iso: string | undefined | null): { date: string; relative: string | null } {
  if (!iso) return { date: "—", relative: null };
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return { date: "—", relative: null };
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const relative = days < 0 ? null : days === 0 ? "Today" : days === 1 ? "Yesterday" : days < 30 ? `${days} days ago` : null;
  return { date, relative };
}

/** "Showing 11–20 of 134". */
export function rangeLabel(page: number, limit: number, total: number, shown: number): string {
  if (!total || !shown) return `Showing 0 of ${total.toLocaleString("en-BD")}`;
  const start = (page - 1) * limit + 1;
  return `Showing ${start.toLocaleString("en-BD")}–${(start + shown - 1).toLocaleString("en-BD")} of ${total.toLocaleString("en-BD")}`;
}

/** Compact page list with ellipses: [1, "…", 4, 5, 6, "…", 12]. */
export function pageList(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push("…");
    out.push(p);
  });
  return out;
}

/** Export fields that exist on the list rows — never password or tokens. */
export const EXPORT_FIELDS = [
  "id",
  "name",
  "email",
  "phone",
  "isActive",
  "isVerified",
  "createdAt",
  "customerProfile.wallet",
  "customerProfile.loyaltyPoints",
] as const;

/**
 * The export endpoint answers `res.json({ data: Buffer, fileName })`, so the
 * workbook arrives as `{ type: "Buffer", data: number[] }`. Turn that into
 * bytes; null when the response isn't in that shape.
 */
export function exportBytes(result: unknown): { bytes: Uint8Array; fileName: string | null } | null {
  const r = result as { data?: { type?: string; data?: unknown }; fileName?: unknown } | null;
  const arr = r?.data?.type === "Buffer" ? r.data.data : null;
  if (!Array.isArray(arr) || !arr.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) return null;
  const fileName = typeof r?.fileName === "string" && /^[\w.-]+\.xlsx$/.test(r.fileName) ? r.fileName : null;
  return { bytes: Uint8Array.from(arr as number[]), fileName };
}

/** Filters for POST /export: the list query without paging (the server exports up to 10,000 rows). */
export function exportFilters(s: CustomerListState): Record<string, string | number> {
  const q = buildCustomerQuery(s);
  delete q.page;
  delete q.limit;
  return q;
}
