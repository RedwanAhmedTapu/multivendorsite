// lib/pos/credit.ts
//
// The POS customer-credit rule as the server applies it (pos.service createSale):
// a credit facility exists only when loanLimit > 0, and a sale may only take
// the customer's outstanding due to at most loanLimit. `due` is the one
// outstanding balance (loanBalance mirrors it). The server re-checks every
// sale atomically; this module only lets the terminal explain and stop early.

export interface CreditCustomer {
  loanLimit?: number | null;
  due?: number | null;
}

export interface CreditStatus {
  hasFacility: boolean;
  limit: number;
  outstanding: number;
  available: number;
}

const EPS = 0.005;
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const round2 = (v: number) => Math.round(v * 100) / 100;

export function creditStatus(c: CreditCustomer | null | undefined): CreditStatus {
  const limit = Math.max(n(c?.loanLimit), 0);
  const outstanding = Math.max(n(c?.due), 0);
  return { hasFacility: limit > 0, limit, outstanding, available: limit > 0 ? Math.max(round2(limit - outstanding), 0) : 0 };
}

/** null when a sale leaving `newDue` unpaid is allowed; otherwise the server's reason. */
export function creditRefusal(c: CreditCustomer | null | undefined, newDue: number): string | null {
  if (!(newDue > 0)) return null;
  const s = creditStatus(c);
  if (!s.hasFacility) return "This customer has no credit facility — take full payment or set a credit limit first";
  if (s.outstanding + newDue > s.limit + EPS) {
    return `Credit limit exceeded: ${s.available.toFixed(2)} available of ${s.limit.toFixed(2)}, this sale needs ${round2(newDue).toFixed(2)}`;
  }
  return null;
}
