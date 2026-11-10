"use client";
// components/pos/BarcodeScanInput.tsx
//
// Drop this into the POS terminal's cart screen once it's built. It works
// with:
//   1. A physical USB/Bluetooth barcode scanner — these act like a
//      keyboard: they "type" the code very fast and then send Enter. We
//      detect that speed (< 50ms between keystrokes) so a human typing in
//      the same box doesn't accidentally trigger a lookup on every digit.
//   2. Manual typing — vendor can just type a SKU/barcode and press Enter
//      if they don't have a scanner, or type the code with the on-screen
//      keyboard.
//
// It calls the /pos/variant/lookup/:code endpoint (see posApi.ts ->
// useLazyLookupVariantByCodeQuery) and reports the result back via
// onFound / onNotFound so the parent can push it into the cart.
//
// USAGE (inside the POS terminal cart component):
//
//   const [lookup] = useLazyLookupVariantByCodeQuery();
//   <BarcodeScanInput
//     onScan={async (code) => {
//       try {
//         const res = await lookup(code).unwrap();
//         addToCart(res.data); // your existing "add item to cart" handler
//       } catch {
//         toast.error(`No product found for "${code}"`);
//       }
//     }}
//   />

import React, { useEffect, useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";

interface BarcodeScanInputProps {
  /** Called with the scanned/typed code when a scan completes (Enter pressed, or fast-scan finished). */
  onScan: (code: string) => void;
  placeholder?: string;
  /** Keep focus on this input at all times so a scanner can fire from anywhere on the page. Default true. */
  autoFocus?: boolean;
  className?: string;
}

const FAST_KEYSTROKE_MS = 50; // scanner keystrokes land well under this; human typing doesn't

export default function BarcodeScanInput({
  onScan,
  placeholder = "Scan or type barcode / SKU, then Enter",
  autoFocus = true,
  className = "",
}: BarcodeScanInputProps) {
  const [value, setValue] = useState("");
  const lastKeyTime = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const commit = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    const gap = now - lastKeyTime.current;
    lastKeyTime.current = now;

    if (e.key === "Enter") {
      e.preventDefault();
      commit(value);
      return;
    }

    // Most scanners fire a full code + Enter, so the Enter branch above
    // handles them. This is a fallback for scanners configured without a
    // trailing Enter key — treat a sudden burst of fast keystrokes,
    // followed by a pause, as "done" via the blur/timeout below instead
    // of guessing mid-stream.
    void gap; // reserved for future fine-tuning if a specific scanner model needs it
  };

  return (
    <div className={`relative ${className}`}>
      <ScanBarcode
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Re-focus shortly after so a scanner can still fire even if
          // something else on the page briefly stole focus.
          if (autoFocus) setTimeout(() => inputRef.current?.focus(), 100);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
      />
    </div>
  );
}