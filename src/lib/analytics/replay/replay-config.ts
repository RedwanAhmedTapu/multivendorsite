// lib/analytics/replay/replay-config.ts
//
// Visual session replay (rrweb) — browser-side switches, privacy rules and
// resource limits. Pure: no rrweb import here, so this file is safe to ship
// in the storefront bundle; the recorder itself is loaded lazily.
//
// Phase 1 (no consent mechanism yet): recording is OFF unless the build sets
// NEXT_PUBLIC_SESSION_REPLAY=synthetic AND the tester's own browser has
// opted in with localStorage "fm_replay_synthetic" = "1". Real visitors are
// never recorded. The server (SESSION_REPLAY_MODE) must also be "synthetic".

export type ReplayClientMode = "off" | "synthetic";

export function replayClientMode(raw: unknown = process.env.NEXT_PUBLIC_SESSION_REPLAY): ReplayClientMode {
  return String(raw ?? "").trim().toLowerCase() === "synthetic" ? "synthetic" : "off";
}

export const SYNTHETIC_OPT_IN_KEY = "fm_replay_synthetic";

/** True only in a browser a tester explicitly opted in. Storage errors → false. */
export function isSyntheticBrowser(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(SYNTHETIC_OPT_IN_KEY) === "1";
  } catch {
    return false;
  }
}

/** Mirrors the server's REPLAY_EXCLUDED_PATH_PREFIXES (session-replay.contract.ts). */
export const REPLAY_EXCLUDED_PATH_PREFIXES = [
  "/checkout",
  "/payment",
  "/payment-option",
  "/login",
  "/register",
  "/reset-password",
  "/verify-email",
  "/user-dashboard",
  "/vendor-dashboard",
  "/admin-dashboard",
  "/vendorauth",
  "/vendor-register",
  "/track",
  "/hrm",
  "/accounting",
  "/inventory",
  "/pos",
  "/store-editor",
  "/vendor-store-decoration",
  "/chat",
  "/messages",
] as const;

export function isExcludedPath(path: string | null | undefined): boolean {
  if (typeof path !== "string" || !path) return true;
  let p: string;
  try {
    p = decodeURIComponent(new URL(path, "http://x.invalid").pathname).toLowerCase();
  } catch {
    return true;
  }
  return REPLAY_EXCLUDED_PATH_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));
}

/**
 * Privacy-safe marker for time spent on an excluded page: only WHICH kind of
 * section (no path, query or content). Mirrors the server's EXCLUDED_SECTIONS;
 * any other custom event is refused by the server.
 */
export const EXCLUDED_MARKER_TAG = "fm:excluded-page";
export type ExcludedSection = "checkout" | "sign-in" | "account" | "dashboard" | "chat" | "other";
export function excludedSection(path: string | null | undefined): ExcludedSection {
  let p = "";
  try {
    p = new URL(String(path ?? ""), "http://x.invalid").pathname.toLowerCase();
  } catch {
    return "other";
  }
  const under = (...xs: string[]) => xs.some((x) => p === x || p.startsWith(`${x}/`));
  if (under("/checkout", "/payment", "/payment-option")) return "checkout";
  if (under("/login", "/register", "/reset-password", "/verify-email", "/vendorauth", "/vendor-register")) return "sign-in";
  if (under("/user-dashboard", "/track")) return "account";
  if (under("/vendor-dashboard", "/admin-dashboard", "/hrm", "/accounting", "/inventory", "/pos", "/store-editor", "/vendor-store-decoration")) return "dashboard";
  if (under("/chat", "/messages")) return "chat";
  return "other";
}

/**
 * Signed-in sessions are only recordable for synthetic TEST accounts on the
 * reserved test.invalid domain. This is a client-side HINT only (it skips
 * obviously-ineligible sessions); the server decides, against its own allowlist.
 */
export function isSyntheticTestEmail(email: unknown): boolean {
  return /^[a-z0-9._+-]{1,64}@test\.invalid$/.test(String(email ?? "").trim().toLowerCase());
}

export const REPLAY_CLIENT_LIMITS = {
  /** Wait this long after the page is idle before loading the recorder. */
  startDelayMs: 1_500,
  /** Upload cadence; a batch also flushes early when it reaches maxBatchEvents. */
  flushIntervalMs: 10_000,
  maxBatchEvents: 1_500,
  /** Full snapshots per upload (server limit: maxFullSnapshotsPerChunk = 4). */
  maxSnapshotsPerBatch: 3,
  /** Hard cap on buffered events; reaching it stops recording (never silently drops events). */
  maxQueueEvents: 6_000,
  /** Serialized size cap of one batch before compression (server refuses > 4 MB decompressed). */
  maxBatchChars: 3_500_000,
  /** Compressed size cap of one upload (server limit 256 KB). */
  maxUploadBytes: 250 * 1024,
  maxRetries: 3,
  retryBaseMs: 2_000,
  /** Events per minute beyond which the page is too busy to record cheaply → stop. */
  maxEventsPerMinute: 12_000,
  /** Whole-session cap (compressed bytes uploaded). */
  maxSessionBytes: 20 * 1024 * 1024,
  maxChunks: 700,
} as const;

/**
 * rrweb record options. Privacy: every input is masked with a fixed
 * placeholder (no length leak); password / payment fields, iframes and
 * anything marked data-replay-block are not captured at all; text inside
 * data-replay-mask is masked. Performance: throttled pointer and scroll,
 * last-value inputs only, no canvas / fonts / inline images, periodic full
 * snapshot every 10 minutes only (seek points), slimmed DOM.
 */
export const REPLAY_RECORD_OPTIONS = {
  maskAllInputs: true,
  maskInputFn: () => "•••",
  maskTextSelector: "[data-replay-mask], [data-replay-mask] *",
  blockClass: "fm-replay-block",
  blockSelector: "[data-replay-block], input[type=password], [autocomplete^='cc-'], iframe, video, canvas",
  ignoreClass: "fm-replay-ignore",
  slimDOMOptions: "all" as const,
  inlineStylesheet: true,
  inlineImages: false,
  collectFonts: false,
  recordCanvas: false,
  recordCrossOriginIframes: false,
  checkoutEveryNms: 10 * 60_000,
  sampling: {
    mousemove: 100,
    mouseInteraction: { MouseUp: false, MouseDown: false, Click: true, ContextMenu: false, DblClick: true, Focus: false, Blur: false, TouchStart: false, TouchEnd: true },
    scroll: 200,
    media: 1_000,
    input: "last" as const,
  },
};
