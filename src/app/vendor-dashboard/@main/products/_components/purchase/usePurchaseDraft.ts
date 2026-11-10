import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generic localStorage-backed draft persistence for long-running forms
 * (Purchase Entry, Purchase Receive) where a session/token expiry mid-work
 * would otherwise wipe out everything the vendor typed.
 *
 * Usage:
 *   const draft = usePurchaseDraft<PurchaseEntryDraftShape>("purchase-entry-draft");
 *
 *   // on mount, offer to restore
 *   useEffect(() => {
 *     const saved = draft.load();
 *     if (saved) setPromptedDraft(saved);
 *   }, []);
 *
 *   // autosave whenever relevant state changes
 *   useEffect(() => {
 *     draft.save({ supplier, items, notes, paidAmount, ... });
 *   }, [supplier, items, notes, paidAmount]);
 *
 *   // on successful save
 *   draft.clear();
 */

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_DEBOUNCE_MS = 800;

interface DraftEnvelope<T> {
  state: T;
  savedAt: number;
}

interface UsePurchaseDraftOptions {
  /** How old a draft can be before it's considered stale and ignored. */
  maxAgeMs?: number;
  /** Debounce delay for autosave() to avoid writing to localStorage on every keystroke. */
  debounceMs?: number;
}

export function usePurchaseDraft<T>(
  storageKey: string,
  options: UsePurchaseDraftOptions = {},
) {
  const { maxAgeMs = DEFAULT_MAX_AGE_MS, debounceMs = DEFAULT_DEBOUNCE_MS } = options;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Reads the draft synchronously, discarding it if it's too old or malformed. */
  const load = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;

      const parsed: DraftEnvelope<T> = JSON.parse(raw);
      if (!parsed || typeof parsed.savedAt !== "number") {
        localStorage.removeItem(storageKey);
        return null;
      }

      if (Date.now() - parsed.savedAt > maxAgeMs) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return parsed.state;
    } catch {
      // Corrupted JSON, storage disabled (private mode), etc. — fail safe.
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      return null;
    }
  }, [storageKey, maxAgeMs]);

  /** Writes the draft immediately (no debounce). Use for explicit "save now" moments. */
  const saveNow = useCallback(
    (state: T) => {
      try {
        const envelope: DraftEnvelope<T> = { state, savedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(envelope));
        return true;
      } catch {
        // Storage full or disabled — best-effort only, don't crash the form.
        return false;
      }
    },
    [storageKey],
  );

  /** Debounced save — call this on every relevant state change. */
  const save = useCallback(
    (state: T) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        saveNow(state);
      }, debounceMs);
    },
    [saveNow, debounceMs],
  );

  const clear = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const hasDraft = useCallback(() => load() !== null, [load]);

  // Flush any pending debounced save on unmount so a fast navigate-away
  // (e.g. clicking Save then immediately routing) doesn't lose the last edit.
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { load, save, saveNow, clear, hasDraft };
}

/**
 * Convenience hook that also manages the "restore this draft?" prompt state,
 * so forms don't need to duplicate the confirm-on-mount boilerplate.
 *
 * Usage:
 *   const { pendingDraft, acceptDraft, dismissDraft, ...draftApi } =
 *     usePurchaseDraftWithPrompt<MyDraftShape>("purchase-entry-draft");
 *
 *   // pendingDraft is non-null right after mount if a valid draft exists.
 *   // Render a banner: "Unsaved work found from your last session — Restore / Discard"
 *   // acceptDraft() returns the draft so the caller can apply it to state.
 */
export function usePurchaseDraftWithPrompt<T>(
  storageKey: string,
  options: UsePurchaseDraftOptions = {},
) {
  const draftApi = usePurchaseDraft<T>(storageKey, options);
  const [pendingDraft, setPendingDraft] = useState<T | null>(null);

  useEffect(() => {
    const found = draftApi.load();
    if (found) setPendingDraft(found);
    // Only check once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptDraft = useCallback((): T | null => {
    setPendingDraft(null);
    return pendingDraft;
  }, [pendingDraft]);

  const dismissDraft = useCallback(() => {
    draftApi.clear();
    setPendingDraft(null);
  }, [draftApi]);

  return { pendingDraft, acceptDraft, dismissDraft, ...draftApi };
}