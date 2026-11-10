// lib/analytics/replay/demo-gate.ts
//
// Opt-in gate for the fictional replay demo (lib/analytics/replay/demo-replay.ts).
// Two independent switches must both be on, mirroring the existing synthetic
// recorder convention in replay-config.ts:
//
//   1. NEXT_PUBLIC_REPLAY_DEMO === "1"           (build/bundle decision)
//   2. localStorage["fm_replay_demo"] === "1"    (this browser, this origin)
//
// Deliberately a SEPARATE key from fm_replay_synthetic: opting into a demo must
// never be the same act as opting into real recording. Disabled by default: an
// unset or malformed environment value yields false, as does any storage error.

export const DEMO_ENV_FLAG = "NEXT_PUBLIC_REPLAY_DEMO";
export const DEMO_OPT_IN_KEY = "fm_replay_demo";

type StorageLike = { getItem: (k: string) => string | null };

/** The build-time half of the gate. Only the exact string "1" enables it. */
export function demoEnvOn(raw: unknown = process.env.NEXT_PUBLIC_REPLAY_DEMO): boolean {
  return String(raw ?? "").trim() === "1";
}

/** The per-browser half of the gate. Storage errors mean "not opted in". */
export function demoOptedIn(storage?: StorageLike): boolean {
  try {
    const s = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
    return !!s && s.getItem(DEMO_OPT_IN_KEY) === "1";
  } catch {
    return false;
  }
}

/** Both switches, and nothing else. False unless the demo is explicitly enabled. */
export function demoModeEnabled(raw: unknown = process.env.NEXT_PUBLIC_REPLAY_DEMO, storage?: StorageLike): boolean {
  return demoEnvOn(raw) && demoOptedIn(storage);
}

/**
 * Enables the demo for this browser only. Returns false (and writes nothing)
 * unless the build was compiled with NEXT_PUBLIC_REPLAY_DEMO=1.
 */
export function enableDemoForThisBrowser(raw: unknown = process.env.NEXT_PUBLIC_REPLAY_DEMO, storage?: StorageLike): boolean {
  if (!demoEnvOn(raw)) return false;
  try {
    const s = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!s) return false;
    (s as any).setItem(DEMO_OPT_IN_KEY, "1");
    return true;
  } catch {
    return false;
  }
}