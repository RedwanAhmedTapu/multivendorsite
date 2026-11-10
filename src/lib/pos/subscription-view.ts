// lib/pos/subscription-view.ts
//
// Pure presentation for POS subscription state. The server decides access
// (backend entitlement evaluator); these helpers only phrase what it said.

import type { PosEntitlement, PosMe, PosStaff, PosSubscriptionStatus } from "@/features/posApi";

export const ENTITLEMENT_LABEL: Record<PosEntitlement["state"], string> = {
  NONE: "No subscription",
  INVALID: "Needs attention",
  SUSPENDED: "Suspended",
  CANCELLED: "Revoked",
  ACTIVE: "Active",
  GRACE: "Grace period",
  EXPIRED: "Expired",
};

export const SOURCE_LABEL: Record<string, string> = {
  TRIAL: "Free trial",
  PAID: "Paid plan",
  COMPLIMENTARY: "Complimentary",
  LEGACY: "Existing access",
};

export type BannerTone = "info" | "warn" | "danger";

/** What the POS shows above the terminal, or null when there's nothing to say. */
export function posBannerFor(sub: PosSubscriptionStatus): { tone: BannerTone; text: string; cta?: string } | null {
  const e = sub.entitlement;
  if (sub.enforcement === "monitor" && !e.canOperate) {
    return { tone: "info", text: "POS subscriptions are being introduced — this store has no active plan yet. The POS still works for now.", cta: "View plans" };
  }
  switch (e.state) {
    case "SUSPENDED":
      return { tone: "danger", text: "POS access is suspended — past invoices are view-only. Contact FinixMart support." };
    case "CANCELLED":
    case "EXPIRED":
    case "NONE":
    case "INVALID":
      return { tone: "danger", text: "No active POS subscription — selling, refunds, voids and due collection are paused. Past invoices stay viewable.", cta: "Renew" };
    case "GRACE":
      return { tone: "warn", text: `Your POS subscription has ended — grace period, ${dayText(e.daysLeft)} left before the POS pauses.`, cta: "Renew now" };
    case "ACTIVE":
      if (e.daysLeft !== null && e.daysLeft <= 7) {
        return { tone: "warn", text: `Your POS subscription ends in ${dayText(e.daysLeft)}.`, cta: "Renew" };
      }
      return null;
    default:
      return null;
  }
}

/**
 * The current operator as the existing POS components expect it. Built from
 * the session (/pos/me); "isAdmin" = the store owner (owner-only screens),
 * the flags mirror the employee's POS grants. Display only.
 */
export function operatorFromMe(me: PosMe): PosStaff {
  return {
    id: me.employeeId ?? me.userId,
    username: "",
    displayName: me.displayName || (me.isOwner ? "Store owner" : "Staff"),
    isAdmin: me.isOwner,
    isActive: true,
    avatarColor: "#0d9488",
    permissions: {
      canDiscount: me.grants.posDiscount,
      canGrantLoan: me.grants.posCredit,
      canViewDashboard: me.grants.posReports,
      canRefund: me.grants.posRefund,
      canManageCustomers: true,
    },
    createdAt: "",
    employeeId: me.employeeId,
  };
}

function dayText(n: number | null): string {
  if (n === null) return "a few days";
  return n === 1 ? "1 day" : `${n} days`;
}

export function formatTaka(amount: string | number | null | undefined): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export function durationText(days: number): string {
  if (days % 365 === 0) return days === 365 ? "1 year" : `${days / 365} years`;
  if (days % 30 === 0) return days === 30 ? "1 month" : `${days / 30} months`;
  return days === 1 ? "1 day" : `${days} days`;
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

/** ?result= from the gateway return redirect (display only — the server already decided). */
export function checkoutResultMessage(result: string | null): { tone: BannerTone; text: string } | null {
  switch (result) {
    case "paid":
      return { tone: "info", text: "Payment confirmed — your POS subscription has been updated." };
    case "pending":
      return { tone: "warn", text: "We're still confirming your payment with the gateway. This page will show it once it's verified." };
    case "failed":
      return { tone: "danger", text: "The payment didn't go through. If money left your account, contact FinixMart support with the reference shown." };
    case "cancelled":
      return { tone: "warn", text: "The payment was cancelled." };
    default:
      return null;
  }
}

/** Only follow gateway pages served over https. */
export function safeGatewayUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
