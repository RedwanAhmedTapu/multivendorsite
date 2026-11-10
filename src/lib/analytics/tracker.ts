// lib/analytics/tracker.ts
//
// Browser side of Business Advisor analytics. Only two things are sent from
// the browser — a product-page view and "checkout opened"; cart, failure and
// order events are recorded by the server after the real operation succeeds.
//
// Identifiers (random, no personal data):
//   - visitor id: localStorage "fm_avid" — the same browser across visits;
//   - session id: sessionStorage "fm_asid" — rotates after 30 minutes without
//     activity (one "journey").
// Both are sent as x-fm-analytics-* headers on API calls so the server can
// connect a journey's steps; the server never trusts them for anything but
// grouping. Storage access is wrapped — private mode / blocked storage just
// means an in-memory id for this page.

export const ANALYTICS_SESSION_HEADER = "x-fm-analytics-session";
export const ANALYTICS_VISITOR_HEADER = "x-fm-analytics-visitor";
export const SESSION_IDLE_MS = 30 * 60_000;
export const VIEW_DEDUP_MS = 30 * 60_000;

const memory: Record<string, string> = {};

function randomId(): string {
  try {
    const bytes = new Uint8Array(18);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`.padEnd(20, "0");
  }
}

function store(kind: "local" | "session") {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function read(kind: "local" | "session", key: string): string | null {
  try {
    return store(kind)?.getItem(key) ?? memory[`${kind}:${key}`] ?? null;
  } catch {
    return memory[`${kind}:${key}`] ?? null;
  }
}

function write(kind: "local" | "session", key: string, value: string) {
  memory[`${kind}:${key}`] = value;
  try {
    store(kind)?.setItem(key, value);
  } catch {
    /* storage blocked — memory copy is enough */
  }
}

export function getVisitorId(): string {
  let id = read("local", "fm_avid");
  if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    id = randomId();
    write("local", "fm_avid", id);
  }
  return id;
}

/** The current journey id; a new one after SESSION_IDLE_MS without activity. */
export function getSessionId(now: number = Date.now()): string {
  let id = read("session", "fm_asid");
  const last = Number(read("session", "fm_asid_t") ?? 0);
  if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id) || now - last > SESSION_IDLE_MS) id = randomId();
  write("session", "fm_asid", id);
  write("session", "fm_asid_t", String(now));
  return id;
}

/**
 * The current journey id WITHOUT refreshing its idle timer — for background
 * traffic (session replay uploads) that must not keep a journey alive or
 * change how journeys are split. Creates the id only when none exists yet.
 */
export function peekSessionId(): string {
  const id = read("session", "fm_asid");
  return id && /^[A-Za-z0-9_-]{16,64}$/.test(id) ? id : getSessionId();
}

/** Headers for API calls (browser only; empty on the server). */
export function analyticsHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return { [ANALYTICS_VISITOR_HEADER]: getVisitorId(), [ANALYTICS_SESSION_HEADER]: getSessionId() };
}

const STAFF = new Set(["VENDOR", "ADMIN", "EMPLOYEE"]);
/** Staff accounts aren't shoppers — their browsing isn't sent (the server ignores it anyway). */
export function isShopper(role?: string | null): boolean {
  return !STAFF.has(String(role ?? "").toUpperCase());
}

/**
 * True at most once per product per VIEW_DEDUP_MS in this browser session —
 * re-renders, React Strict Mode's double effects and quick back/forward
 * navigation don't count as new views. The server applies the same window.
 */
export function shouldRecordView(productId: string, now: number = Date.now()): boolean {
  if (!productId) return false;
  const key = `fm_av:${productId}`;
  const last = Number(read("session", key) ?? 0);
  if (now - last < VIEW_DEDUP_MS) return false;
  write("session", key, String(now));
  return true;
}

/** Allowlisted entry points (mirrors the server's EVENT_SOURCES). */
export type AnalyticsSource = "PRODUCT_PAGE" | "QUICK_VIEW" | "BUY_NOW" | "CART" | "CHECKOUT" | "WISHLIST";
