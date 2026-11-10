"use client";

// components/analytics/SessionReplayBoot.tsx
//
// Starts visual session replay in the background — only when the build sets
// NEXT_PUBLIC_SESSION_REPLAY=synthetic and this browser opted in as a test
// browser (replay-config.ts). Otherwise it renders nothing and loads nothing:
// the recorder (lib/analytics/replay/replay-session.ts) and rrweb are
// separate chunks fetched only after the page has loaded and gone idle.
// Staff accounts are never recorded. Signed-in customers are not recorded either
// (fail closed) — the only exception is a synthetic TEST account on the reserved
// test.invalid domain, and even then the SERVER decides against its own allowlist
// (SESSION_REPLAY_SYNTHETIC_ACCOUNTS, never in production). The navbar identity is
// masked (data-replay-mask) regardless. Failures are swallowed.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { REPLAY_CLIENT_LIMITS, isSyntheticBrowser, isSyntheticTestEmail, replayClientMode } from "@/lib/analytics/replay/replay-config";
import type { ReplaySession } from "@/lib/analytics/replay/replay-session";
import { ANALYTICS_SESSION_HEADER, ANALYTICS_VISITOR_HEADER, getVisitorId, isShopper, peekSessionId } from "@/lib/analytics/tracker";

const MODE = replayClientMode();
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/** Runs fn once the page has loaded, the main thread is idle and a short delay has passed. */
function whenSettled(fn: () => void): () => void {
  let cancelled = false;
  let t: ReturnType<typeof setTimeout> | undefined;
  const go = () => {
    t = setTimeout(() => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void };
      if (cancelled) return;
      if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(() => !cancelled && fn(), { timeout: 5_000 });
      else fn();
    }, REPLAY_CLIENT_LIMITS.startDelayMs);
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
  return () => {
    cancelled = true;
    if (t) clearTimeout(t);
    window.removeEventListener("load", go);
  };
}

const sessionStore = {
  get: (k: string) => {
    try {
      return window.sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      window.sessionStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  remove: (k: string) => {
    try {
      window.sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

/** The recorder lifecycle (exported for tests); the default export only mounts it when the build enables replay. */
export function SessionReplayRecorder() {
  const pathname = usePathname();
  const role = useSelector((s: RootState) => (s.auth?.user as { role?: string } | null)?.role);
  const accessToken = useSelector((s: RootState) => s.auth?.accessToken ?? null);
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;
  const session = useRef<ReplaySession | null>(null);

  const email = useSelector((s: RootState) => (s.auth?.user as { email?: string | null } | null)?.email ?? null);
  // signed in as anyone but a synthetic test account → not recordable (the server re-checks)
  const signedIn = !!accessToken && !isSyntheticTestEmail(email);

  useEffect(() => {
    if (!isShopper(role)) {
      session.current?.stop("staff");
      return;
    }
    if (signedIn) {
      session.current?.stop("signed_in");
      return;
    }
    if (session.current || !isSyntheticBrowser()) return;
    let cancelled = false;
    const cancelWait = whenSettled(() => {
      import("@/lib/analytics/replay/replay-session")
        .then(({ ReplaySession, gzipText }) => {
          if (cancelled || session.current) return;
          const s = new ReplaySession({
            apiBase: API_BASE,
            loadRecord: () => import("@rrweb/record").then((m) => m.record as unknown as import("@/lib/analytics/replay/replay-session").RecordFn),
            fetch: (input, init) => fetch(input, init),
            compress: gzipText,
            headers: () => ({
              [ANALYTICS_VISITOR_HEADER]: getVisitorId(),
              [ANALYTICS_SESSION_HEADER]: peekSessionId(),
              ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
            }),
            sessionId: peekSessionId,
            storage: sessionStore,
            win: window,
          });
          session.current = s;
          void s.start();
        })
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
      cancelWait();
    };
  }, [role, signedIn]);

  useEffect(() => {
    session.current?.onRoute(pathname ?? "/");
  }, [pathname]);

  useEffect(() => {
    const onHide = () => session.current?.pageHide();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      session.current?.stop("disposed");
      session.current = null;
    };
  }, []);

  return null;
}

export default function SessionReplayBoot() {
  return MODE === "off" ? null : <SessionReplayRecorder />;
}
