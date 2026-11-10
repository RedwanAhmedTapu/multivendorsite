// lib/analytics/replay/replay-session.ts
//
// One browser's visual recording: lazily loads rrweb's recorder, buffers its
// events in a bounded queue, and uploads gzip batches one at a time in the
// background. Everything here is best-effort and failure-isolated — any
// error, limit or refusal stops recording; it never throws into the page and
// never delays rendering, navigation, cart, checkout or payment.
//
// Privacy guards (in addition to rrweb masking, see replay-config.ts):
//   - excluded pages: recording stops synchronously inside history.pushState /
//     replaceState and on popstate — BEFORE the router renders the excluded
//     page — and any event emitted while the current path is excluded is
//     dropped. The server additionally refuses chunks that reach one.
//   - staff accounts are never recorded (checked by the caller and the server).
//
// Linking: uploads carry the analytics visitor / session ids (read without
// refreshing them, so recording never changes how journeys are split); the
// server binds the recording to that journey. When the journey rotates the
// server answers "restart" and a new recording begins with a fresh snapshot.

import { EXCLUDED_MARKER_TAG, REPLAY_CLIENT_LIMITS, REPLAY_RECORD_OPTIONS, excludedSection, isExcludedPath } from "./replay-config";

type RRWebEvent = { type: number; timestamp: number; data?: unknown };
export type RecordFn = ((options: Record<string, unknown> & { emit: (e: RRWebEvent) => void }) => (() => void) | undefined) & {
  /** rrweb's record.takeFullSnapshot — emits a Meta (page URL) event and a fresh full snapshot. */
  takeFullSnapshot?: (isCheckout?: boolean) => void;
};

const pathnameOf = (path: string) => {
  try {
    return new URL(path, "http://x.invalid").pathname;
  } catch {
    return path;
  }
};

export type ReplayStopReason =
  | "server_disabled"
  | "excluded_start"
  | "queue_full"
  | "overload"
  | "too_large"
  | "session_limit"
  | "upload_failed"
  | "refused"
  | "unsupported"
  | "load_failed"
  | "staff"
  | "signed_in"
  | "disposed";

export type ReplaySessionDeps = {
  apiBase: string;
  loadRecord: () => Promise<RecordFn>;
  fetch: typeof fetch;
  /** gzip a string; null when the browser can't compress (→ recording stops). */
  compress: (text: string) => Promise<Uint8Array | null>;
  /** Analytics visitor / session headers (+ Authorization when signed in). */
  headers: () => Record<string, string>;
  sessionId: () => string | null;
  storage?: { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void };
  now?: () => number;
  path?: () => string;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
  /** Run work when the main thread is idle (requestIdleCallback where available). */
  idle?: (fn: () => void) => void;
  win?: Window & typeof globalThis;
  limits?: Partial<typeof REPLAY_CLIENT_LIMITS>;
  onState?: (state: ReplayState, reason?: ReplayStopReason) => void;
};

export type ReplayState = "idle" | "starting" | "recording" | "paused" | "stopped";
type Persisted = { recordingId: string; token: string; seq: number; sessionId: string };
const PERSIST_KEY = "fm_replay";

export class ReplaySession {
  state: ReplayState = "idle";
  stopReason: ReplayStopReason | null = null;
  uploadedBytes = 0;
  uploadedChunks = 0;
  droppedOnExcluded = 0;

  private readonly d: Required<Omit<ReplaySessionDeps, "storage" | "win" | "onState" | "limits">> & Pick<ReplaySessionDeps, "storage" | "win" | "onState">;
  private readonly L: typeof REPLAY_CLIENT_LIMITS;
  private queue: RRWebEvent[] = [];
  private stopRecord: (() => void) | null = null;
  private recordFn: RecordFn | null = null;
  /** Page the current recording last marked with a Meta event (pathname). */
  private recordedPath: string | null = null;
  private rec: Persisted | null = null;
  private timer: unknown = null;
  private inflight: Promise<void> | null = null;
  private minuteStart = 0;
  private minuteCount = 0;
  private flushSoon = false;
  private unpatch: (() => void) | null = null;
  private restarting = false;

  constructor(deps: ReplaySessionDeps) {
    const defaults = {
      now: () => Date.now(),
      path: () => (typeof location !== "undefined" ? location.pathname + location.search : "/"),
      schedule: (fn: () => void, ms: number): unknown => setTimeout(fn, ms),
      cancel: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>),
      idle: (fn: () => void) => {
        const w = globalThis as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void };
        if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(fn, { timeout: 2_000 });
        else setTimeout(fn, 0);
      },
    };
    this.d = { ...defaults, ...deps } as typeof this.d;
    this.L = { ...REPLAY_CLIENT_LIMITS, ...(deps.limits ?? {}) };
  }

  private set(state: ReplayState, reason?: ReplayStopReason) {
    this.state = state;
    try {
      this.d.onState?.(state, reason);
    } catch {
      /* observer errors never matter */
    }
  }

  /** Begin (or resume after a full reload) on the current page. Never throws. */
  async start(): Promise<void> {
    if (this.state !== "idle" && this.state !== "paused") return;
    if (isExcludedPath(this.d.path())) {
      this.set("paused");
      this.patchHistory();
      return;
    }
    this.set("starting");
    try {
      if (!(await this.ensureRecording())) return;
      const record = await this.d.loadRecord().catch(() => null);
      if ((this.state as ReplayState) !== "starting") return; // stopped / paused meanwhile
      if (!record) return this.stop("load_failed");
      if (isExcludedPath(this.d.path())) return this.pause(this.d.path());
      this.patchHistory();
      this.minuteStart = this.d.now();
      this.minuteCount = 0;
      this.stopRecord =
        record({
          ...REPLAY_RECORD_OPTIONS,
          emit: (e: RRWebEvent) => this.push(e),
          errorHandler: () => true,
        }) ?? null;
      if (!this.stopRecord) return this.stop("unsupported");
      this.recordFn = record;
      this.recordedPath = pathnameOf(this.d.path());
      this.set("recording");
      this.arm();
    } catch {
      this.stop("load_failed");
    }
  }

  /** Route changed (client navigation). Pause on excluded pages, resume elsewhere. */
  onRoute(path: string) {
    if (this.state === "stopped") return;
    if (isExcludedPath(path)) {
      if (this.state === "recording" || this.state === "starting") this.pause(path);
    } else if (this.state === "paused") {
      // resume on the next task, not on an idle period: a busy page (or a background tab) can go
      // seconds without one, and whatever the shopper does on the page meanwhile would be lost
      this.d.schedule(() => void this.start(), 0);
    } else if (this.state === "recording" && pathnameOf(path) !== this.recordedPath) {
      // client-side navigation (Next.js router): rrweb records the new page only as DOM mutations, with
      // no page marker — take a full snapshot so the replay gets the new page's URL (page label) and a seek point
      this.recordedPath = pathnameOf(path);
      try {
        this.recordFn?.takeFullSnapshot?.(true);
      } catch {
        /* recording continues without the marker */
      }
    }
  }

  /** Stops recording for good (this page view). Pending events are flushed best-effort. */
  stop(reason: ReplayStopReason) {
    if (this.state === "stopped") return;
    this.detachRecorder();
    this.unpatch?.();
    this.unpatch = null;
    if (this.timer) this.d.cancel(this.timer);
    this.timer = null;
    this.stopReason = reason;
    // unmount / page teardown keeps what was captured; every other reason discards it
    const keep = reason === "disposed";
    if (!keep) this.queue = [];
    if (!keep) this.forget();
    this.set("stopped", reason);
    if (keep && this.queue.length && this.rec) void this.flush(true);
  }

  /** Page is going away — send what is buffered (keepalive when small). */
  pageHide() {
    if (this.queue.length && this.rec && (this.state === "recording" || this.state === "paused")) void this.flush(true);
  }

  // ── internals ─────────────────────────────────────────────────────────

  /** excludedPath: the excluded page being entered — leaves a marker naming only its section. */
  private pause(excludedPath?: string) {
    if (excludedPath !== undefined && this.rec && this.state === "recording") {
      this.queue.push({ type: 5, timestamp: this.d.now(), data: { tag: EXCLUDED_MARKER_TAG, payload: { section: excludedSection(excludedPath) } } });
    }
    this.detachRecorder();
    if (this.timer) this.d.cancel(this.timer);
    this.timer = null;
    if (this.queue.length && this.rec) void this.flush(false);
    this.set("paused");
  }

  private detachRecorder() {
    const s = this.stopRecord;
    this.stopRecord = null;
    try {
      s?.();
    } catch {
      /* ignore */
    }
  }

  /** Stop synchronously before the URL changes to an excluded page. */
  private patchHistory() {
    const w = this.d.win;
    if (!w || this.unpatch) return;
    const h = w.history;
    const origPush = h.pushState;
    const origReplace = h.replaceState;
    const guard = (url: unknown) => {
      if (url === undefined || url === null) return;
      try {
        const next = new URL(String(url), w.location.href);
        if (isExcludedPath(next.pathname)) this.onRoute(next.pathname);
      } catch {
        /* ignore */
      }
    };
    const push = function (this: History, data: any, unused: string, url?: string | URL | null) {
      guard(url);
      return origPush.call(this, data, unused, url);
    };
    const replace = function (this: History, data: any, unused: string, url?: string | URL | null) {
      guard(url);
      return origReplace.call(this, data, unused, url);
    };
    const onPop = () => this.onRoute(w.location.pathname);
    h.pushState = push;
    h.replaceState = replace;
    w.addEventListener("popstate", onPop, true);
    this.unpatch = () => {
      if (h.pushState === push) h.pushState = origPush;
      if (h.replaceState === replace) h.replaceState = origReplace;
      w.removeEventListener("popstate", onPop, true);
    };
  }

  private push(e: RRWebEvent) {
    if (this.state !== "recording" && this.state !== "starting") return;
    if (isExcludedPath(this.d.path())) {
      this.droppedOnExcluded++;
      this.pause(this.d.path());
      return;
    }
    const now = this.d.now();
    if (now - this.minuteStart >= 60_000) {
      this.minuteStart = now;
      this.minuteCount = 0;
    }
    if (++this.minuteCount > this.L.maxEventsPerMinute) return this.stop("overload");
    if (this.queue.length >= this.L.maxQueueEvents) return this.stop("queue_full");
    this.queue.push(e);
    if (this.queue.length >= this.L.maxBatchEvents && !this.flushSoon) {
      this.flushSoon = true;
      this.d.idle(() => {
        this.flushSoon = false;
        void this.flush(false);
      });
    }
  }

  private arm() {
    if (this.timer) this.d.cancel(this.timer);
    this.timer = this.d.schedule(() => {
      this.timer = null;
      if (this.state !== "recording" && this.state !== "paused") return;
      this.d.idle(() => void this.flush(false).finally(() => this.state === "recording" && this.arm()));
    }, this.L.flushIntervalMs);
  }

  private readPersisted(): Persisted | null {
    try {
      const raw = this.d.storage?.get(PERSIST_KEY);
      const p = raw ? (JSON.parse(raw) as Persisted) : null;
      return p && typeof p.recordingId === "string" && typeof p.token === "string" && Number.isInteger(p.seq) ? p : null;
    } catch {
      return null;
    }
  }
  private persist() {
    try {
      if (this.rec) this.d.storage?.set(PERSIST_KEY, JSON.stringify(this.rec));
    } catch {
      /* ignore */
    }
  }
  private forget() {
    this.rec = null;
    try {
      this.d.storage?.remove(PERSIST_KEY);
    } catch {
      /* ignore */
    }
  }

  /** Reuse this tab's recording for the same journey, else ask the server for a new one. */
  private async ensureRecording(): Promise<boolean> {
    const sessionId = this.d.sessionId();
    if (!sessionId) {
      this.stop("unsupported");
      return false;
    }
    const prev = this.rec ?? this.readPersisted();
    if (prev && prev.sessionId === sessionId) {
      this.rec = prev;
      return true;
    }
    try {
      const res = await this.d.fetch(`${this.d.apiBase}/analytics/replay/start`, {
        method: "POST",
        headers: { ...this.d.headers(), "content-type": "application/json" },
        body: JSON.stringify({ synthetic: true, path: this.d.path() }),
        credentials: "omit",
      });
      const body = (await res.json().catch(() => null)) as { enabled?: boolean; recordingId?: string; token?: string } | null;
      if (!res.ok || !body?.enabled || !body.recordingId || !body.token) {
        this.stop("server_disabled");
        return false;
      }
      this.rec = { recordingId: body.recordingId, token: body.token, seq: 0, sessionId };
      this.persist();
      return true;
    } catch {
      this.stop("server_disabled");
      return false;
    }
  }

  /** Upload buffered events in order, one request at a time. */
  async flush(final: boolean): Promise<void> {
    if (this.inflight) return this.inflight;
    if (!this.queue.length || !this.rec) return;
    this.inflight = this.flushLoop(final).finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async flushLoop(final: boolean) {
    while (this.queue.length && this.rec && (this.state !== "stopped" || final)) {
      let take = Math.min(this.queue.length, this.L.maxBatchEvents);
      // at most maxSnapshotsPerBatch full snapshots per upload (the server refuses more) — quick
      // client-side navigation can queue several
      for (let i = 0, snaps = 0; i < take; i++) {
        if (this.queue[i].type === 2 && ++snaps > this.L.maxSnapshotsPerBatch) {
          take = Math.max(1, i);
          break;
        }
      }
      let body: Uint8Array | null = null;
      // shrink the batch until it fits the server's limits
      for (;;) {
        const text = JSON.stringify(this.queue.slice(0, take));
        if (text.length <= this.L.maxBatchChars) {
          body = await this.d.compress(text);
          if (body === null) return this.stop("unsupported");
          if (body.byteLength <= this.L.maxUploadBytes) break;
        }
        if (take === 1) return this.stop("too_large");
        take = Math.ceil(take / 2);
      }
      if (this.uploadedBytes + body.byteLength > this.L.maxSessionBytes || this.rec.seq >= this.L.maxChunks) return this.stop("session_limit");
      const ok = await this.upload(body, final);
      if (!ok) return;
      this.queue.splice(0, take);
    }
  }

  /** true → uploaded (or duplicate). false → the session was stopped / restarted. */
  private async upload(body: Uint8Array, final: boolean): Promise<boolean> {
    const rec = this.rec!;
    for (let attempt = 0; attempt <= this.L.maxRetries; attempt++) {
      let status = 0;
      type Reply = { stop?: boolean; restart?: boolean } | null;
      let payload: Reply = null;
      try {
        const res = await this.d.fetch(`${this.d.apiBase}/analytics/replay/${encodeURIComponent(rec.recordingId)}/chunks?seq=${rec.seq}`, {
          method: "POST",
          headers: { ...this.d.headers(), "content-type": "application/octet-stream", "x-fm-replay-token": rec.token },
          body: body as BodyInit,
          credentials: "omit",
          keepalive: final && body.byteLength < 60_000,
        });
        status = res.status;
        payload = (await res.json().catch(() => null)) as Reply;
      } catch {
        status = 0; // network error → retry
      }
      if (status >= 200 && status < 300) {
        rec.seq++;
        this.uploadedChunks++;
        this.uploadedBytes += body.byteLength;
        this.persist();
        return true;
      }
      if (payload?.restart) {
        void this.restart();
        return false;
      }
      if (status >= 400 && status < 500 && status !== 429) {
        this.stop("refused");
        return false;
      }
      if (attempt < this.L.maxRetries) await new Promise<void>((r) => this.d.schedule(r, this.L.retryBaseMs * 2 ** attempt));
    }
    this.stop("upload_failed");
    return false;
  }

  /** The journey rotated: drop this recording and start a new one with a fresh snapshot. */
  private async restart() {
    if (this.restarting) return;
    this.restarting = true;
    this.detachRecorder();
    this.queue = [];
    this.forget();
    this.set("paused");
    this.restarting = false;
    this.d.idle(() => void this.start());
  }
}

/** gzip via the browser's CompressionStream (no library). null when unavailable. */
export async function gzipText(text: string): Promise<Uint8Array | null> {
  const CS = (globalThis as { CompressionStream?: new (f: string) => TransformStream<Uint8Array, Uint8Array> }).CompressionStream;
  if (!CS) return null;
  const stream = new Blob([text]).stream().pipeThrough(new CS("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
