"use client";

// components/reviews/review-images.tsx
//
// Up to three review photos with a plain Tailwind lightbox (no component-library
// modal). Uses a plain <img>: review photos are absolute R2 URLs, and next/image
// would need every upload host added to next.config.ts remotePatterns.

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { MAX_REVIEW_IMAGES, type ReviewImageDto } from "./review-types";

interface ReviewImagesProps {
  images?: ReviewImageDto[] | null;
  /** Used for alt text only; never rendered. */
  authorName?: string | null;
  size?: "sm" | "md";
}

export function ReviewImages({ images, authorName, size = "sm" }: ReviewImagesProps) {
  const list = (images ?? []).filter((img) => !!img?.url).slice(0, MAX_REVIEW_IMAGES);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") setOpen((index) => (index === null ? index : (index + 1) % list.length));
      if (event.key === "ArrowLeft") setOpen((index) => (index === null ? index : (index - 1 + list.length) % list.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, list.length]);

  if (list.length === 0) return null;
  const box = size === "sm" ? "h-16 w-16" : "h-20 w-20";

  return (
    <>
      <ul className="mt-3 flex flex-wrap gap-2">
        {list.map((img, index) => (
          <li key={img.id ?? img.url}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              className={`${box} overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-blue-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
              aria-label={`Open review photo ${index + 1} of ${list.length}`}
            >
              <img
                src={img.url}
                alt={`Photo ${index + 1} from ${authorName || "a customer"}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Review photo ${open + 1} of ${list.length}`}
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setOpen(null)}
            className="absolute inset-0 cursor-zoom-out"
          />

          <div className="relative">
            <img
              src={list[open].url}
              alt={`Photo ${open + 1} from ${authorName || "a customer"}`}
              className="mx-auto max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
            />

            <button
              type="button"
              onClick={() => setOpen(null)}
              className="absolute -right-2 -top-2 rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
              aria-label="Close preview"
            >
              <X size={16} />
            </button>

            {list.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setOpen((open - 1 + list.length) % list.length)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen((open + 1) % list.length)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
                  aria-label="Next photo"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            <p className="mt-2 text-center text-xs text-white/60">
              {open + 1} / {list.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
