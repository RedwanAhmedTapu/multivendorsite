// lib/vendor-directory.ts
// Pure display helpers for the admin vendor directory. Kept free of React so
// the formatting rules (status wording, vendor code, pagination pills, response
// envelopes) can be unit tested without a DOM.
import type { Vendor } from "@/features/vendorManageApi";

export type VendorStatus = Vendor["status"];
export type KycStatus = NonNullable<Vendor["verificationStatus"]>;

export const VENDOR_STATUS_LABEL: Record<VendorStatus, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DEACTIVATED: "Deactivated",
};

export const KYC_STATUS_LABEL: Record<KycStatus, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

const DOCUMENT_LABELS: Record<string, string> = {
  NATIONAL_ID_FRONT: "National ID (front)",
  NATIONAL_ID_BACK: "National ID (back)",
  PASSPORT_FRONT: "Passport (front)",
  PASSPORT_BACK: "Passport (back)",
  TRADE_LICENSE: "Trade License",
  RJSC_REGISTRATION: "RJSC Registration",
  TIN_CERTIFICATE: "TIN Certificate",
  VAT_CERTIFICATE: "VAT Certificate",
  OTHER: "Other document",
};

const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  BASIC: "Basic",
  PREMIUM: "Premium",
  ENTERPRISE: "Enterprise",
};

/** Display code derived from the real id — the API has no separate vendor code. */
export function vendorCode(id?: string | null): string {
  if (!id) return "—";
  return `#${id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`;
}

export function vendorInitials(name?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function formatMoney(value?: number | null): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "৳0";
  return `৳${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n)}`;
}

export function compactMoney(value?: number | null): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "৳0";
  if (Math.abs(n) >= 1_000_000) return `৳${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toFixed(0)}`;
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}, ${d.getFullYear()}`;
}

export function planLabel(plan?: string | null): string {
  if (!plan) return "—";
  return PLAN_LABELS[plan] ?? plan;
}

export function documentTypeLabel(type?: string | null): string {
  if (!type) return "Document";
  return DOCUMENT_LABELS[type] ?? type.replace(/_/g, " ");
}

/** Rating is stored as 0 until the first review, so 0 means "no rating yet". */
export function ratingLabel(value?: number | null): string {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n.toFixed(1) : "—";
}

export function fulfillmentLabel(value?: number | null): string {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `${n.toFixed(1)}%` : "—";
}

/**
 * Pills for the footer: first and last page always visible, the current page
 * plus its neighbours, and "…" where the range jumps.
 */
export function pageWindow(current: number, pages: number): (number | "…")[] {
  const total = Math.max(0, Math.floor(pages));
  const cur = Math.min(Math.max(1, Math.floor(current)), Math.max(1, total));
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const shown = new Set<number>([1, total, cur, cur - 1, cur + 1]);
  const sorted = [...shown].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export interface CommissionRow {
  id: string;
  categoryId?: string;
  categoryName: string;
  rate: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  note?: string | null;
  createdAt?: string | null;
}

export interface PayoutRow {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | string;
  method?: string | null;
  period?: string | null;
  note?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
}

/** The commission/payout endpoints answer `{success, data}` while typed as arrays. */
function unwrapList(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  const data = (raw as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? data : [];
}

export function commissionRows(raw: unknown): CommissionRow[] {
  return unwrapList(raw).map((c: any) => ({
    id: String(c.id),
    categoryId: c.categoryId,
    categoryName: c.category?.name ?? "Uncategorised",
    rate: Number(c.rate) || 0,
    effectiveFrom: c.effectiveFrom,
    effectiveTo: c.effectiveTo,
    note: c.note,
    createdAt: c.createdAt,
  }));
}

export function payoutRows(raw: unknown): PayoutRow[] {
  return unwrapList(raw).map((p: any) => ({
    id: String(p.id),
    amount: Number(p.amount) || 0,
    status: String(p.status ?? "PENDING"),
    method: p.method,
    period: p.period,
    note: p.note,
    createdAt: p.createdAt,
    paidAt: p.paidAt,
  }));
}

/** Document titles shown in the KYC tab; file path is the only download source. */
export function documentHref(filePath?: string | null): string | null {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath) || filePath.startsWith("/")) return filePath;
  return null;
}
