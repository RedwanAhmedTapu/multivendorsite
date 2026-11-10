// lib/analytics/advisor-view.ts
//
// Pure presentation helpers for Business Advisor (no React, no network):
// date presets in Asia/Dhaka days (the server's calendar), number / % /
// money formatting that never invents a value ("—" when there is none), and
// the copy for journey steps, outcomes and checkout-failure categories.

import { formatBDT } from "@/lib/cart/display";

export const MAX_RANGE_DAYS = 92;
const DHAKA_OFFSET_MS = 6 * 60 * 60_000;

/** Today's calendar day in Asia/Dhaka as YYYY-MM-DD. */
export function dhakaToday(now: Date = new Date()): string {
  return new Date(now.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
}

export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  return new Date(d.getTime() + delta * 86_400_000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000) + 1;
}

export type PresetId = "today" | "7d" | "30d" | "90d" | "month" | "custom";
export const PRESETS: { id: Exclude<PresetId, "custom">; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "month", label: "This month" },
];

export function presetRange(id: Exclude<PresetId, "custom">, now: Date = new Date()): { from: string; to: string } {
  const to = dhakaToday(now);
  switch (id) {
    case "today":
      return { from: to, to };
    case "7d":
      return { from: shiftDay(to, -6), to };
    case "90d":
      return { from: shiftDay(to, -89), to };
    case "month":
      return { from: `${to.slice(0, 8)}01`, to };
    case "30d":
    default:
      return { from: shiftDay(to, -29), to };
  }
}

/** Client-side check mirroring the server (the server re-validates). */
export function validateRange(from: string, to: string, now: Date = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return "Choose a start and end date.";
  if (from > to) return "The start date must be on or before the end date.";
  if (to > dhakaToday(now)) return "The end date can't be in the future.";
  if (daysBetween(from, to) > MAX_RANGE_DAYS) return `Choose at most ${MAX_RANGE_DAYS} days.`;
  return null;
}

export function formatCount(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-US") : "—";
}

export function formatPct(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })}%` : "—";
}

export function formatMoneyMinor(minor: number | null | undefined): string {
  return typeof minor === "number" && Number.isFinite(minor) ? formatBDT(minor / 100) : "—";
}

/** Change vs the comparison period: null → no comparison is shown (never a fake 0%). */
export function changeBadge(kpi: { change: number | null; pointsChange: number | null } | undefined): { text: string; direction: "up" | "down" | "flat" } | null {
  if (!kpi) return null;
  if (typeof kpi.change === "number") {
    const d = kpi.change > 0 ? "up" : kpi.change < 0 ? "down" : "flat";
    return { text: `${kpi.change > 0 ? "+" : ""}${kpi.change.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`, direction: d };
  }
  if (typeof kpi.pointsChange === "number") {
    const d = kpi.pointsChange > 0 ? "up" : kpi.pointsChange < 0 ? "down" : "flat";
    return { text: `${kpi.pointsChange > 0 ? "+" : ""}${kpi.pointsChange.toLocaleString("en-US", { maximumFractionDigits: 1 })} pts`, direction: d };
  }
  return null;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86_400)}d ${Math.floor((seconds % 86_400) / 3600)}h`;
}

export function formatDayLabel(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" });
}

export const STEP_COPY: Record<string, { label: string; short: string }> = {
  PRODUCT_VIEW: { label: "Viewed product", short: "View" },
  ADD_TO_CART: { label: "Added to cart", short: "Cart" },
  REMOVE_FROM_CART: { label: "Removed from cart", short: "Removed" },
  CART_QUANTITY_CHANGED: { label: "Changed quantity", short: "Qty" },
  CHECKOUT_STARTED: { label: "Opened checkout", short: "Checkout" },
  CHECKOUT_FAILED: { label: "Checkout failed", short: "Failed" },
  ORDER_PLACED: { label: "Placed order", short: "Order" },
};

export type OutcomeTone = "success" | "warning" | "danger" | "neutral" | "info";
export const OUTCOME_COPY: Record<string, { label: string; tone: OutcomeTone; help: string }> = {
  ORDERED_PAID: { label: "Ordered · paid", tone: "success", help: "Placed an order that has been paid." },
  ORDERED_COD: { label: "Ordered · cash on delivery", tone: "success", help: "Placed a cash-on-delivery order." },
  ORDERED_PAYMENT_PENDING: { label: "Ordered · payment pending", tone: "info", help: "Placed an online-payment order that isn't paid yet." },
  ORDERED: { label: "Ordered", tone: "success", help: "Placed an order." },
  ORDERED_LATER: { label: "Ordered later", tone: "success", help: "The same customer placed an order with you after this journey." },
  PAYMENT_FAILED: { label: "Payment failed", tone: "danger", help: "The order's payment failed (from the payment record)." },
  ORDER_CANCELLED: { label: "Order cancelled", tone: "neutral", help: "The order was later cancelled." },
  ORDER_REFUNDED: { label: "Refunded / returned", tone: "neutral", help: "The order was later refunded or returned (from the order and payment records)." },
  CHECKOUT_FAILED: { label: "Checkout failed", tone: "danger", help: "The last recorded step was a failed checkout attempt." },
  ABANDONED_CHECKOUT: { label: "Abandoned at checkout", tone: "warning", help: "Opened checkout but no order after the abandonment window." },
  ABANDONED_CART: { label: "Abandoned cart", tone: "warning", help: "Added to cart but didn't check out within the abandonment window." },
  IN_PROGRESS: { label: "In progress", tone: "info", help: "Recent activity — too early to call it abandoned." },
  BROWSED: { label: "Browsed only", tone: "neutral", help: "Viewed products without adding to cart." },
};
export const outcomeCopy = (o: string) => OUTCOME_COPY[o] ?? { label: "Unknown outcome", tone: "neutral" as OutcomeTone, help: "Not enough recorded events to tell." };

export const FAILURE_COPY: Record<string, string> = {
  STOCK_UNAVAILABLE: "Stock unavailable",
  SHIPPING_UNAVAILABLE: "Delivery unavailable",
  ADDRESS_INVALID: "Address problem",
  PRICE_CHANGED: "Price changed at checkout",
  QUOTE_REVIEW_REQUIRED: "Checkout needed re-confirmation",
  CART_CHANGED: "Cart changed during checkout",
  VALIDATION: "Missing or invalid details",
  OTHER: "Other errors",
};

export const PATH_COPY: Record<string, string> = { CART: "Cart checkout", BUY_NOW: "Buy Now", BROWSE: "Browsing" };
