// lib/pos/sale-math.ts
//
// The terminal's live totals. Mirrors the backend's createSale arithmetic
// (pos.service.ts) exactly — discount first, VAT on the discounted base shared
// pro-rata across lines, 2-dp rounding, money above the bill is change — so the
// screen shows what the server will charge. The server still recomputes
// everything from its own prices; the receipt shows the server's numbers.

export interface EstimateLine {
  price: number;
  qty: number;
  taxRate: number;
}

export interface SaleEstimate {
  subtotal: number;
  discountAmount: number;
  discountPct: number;
  tax: number;
  netBilling: number;
  /** Tendered minus change (what is recorded as paid). */
  paid: number;
  due: number;
  change: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const nonNeg = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function estimateSale(lines: EstimateLine[], discount: { type: "PERCENT" | "FLAT"; value: number }, tendered: number): SaleEstimate {
  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const discountPct = discount.type === "PERCENT" ? Math.min(round2(nonNeg(discount.value)), 100) : 0;
  const discountAmount =
    discount.type === "PERCENT" ? round2(subtotal * (discountPct / 100)) : Math.min(round2(nonNeg(discount.value)), subtotal);
  const taxableBase = subtotal - discountAmount;
  const tax = round2(
    lines.reduce((s, l) => {
      const share = subtotal > 0 ? (l.price * l.qty) / subtotal : 0;
      return s + taxableBase * share * (l.taxRate / 100);
    }, 0),
  );
  const netBilling = round2(taxableBase + tax);
  const t = round2(nonNeg(tendered));
  const change = Math.max(round2(t - netBilling), 0);
  const paid = round2(t - change);
  const due = Math.max(round2(netBilling - paid), 0);
  return { subtotal, discountAmount, discountPct, tax, netBilling, paid, due, change };
}

/** A fresh id for one checkout attempt (the server dedupes repeats). */
export function newClientRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
