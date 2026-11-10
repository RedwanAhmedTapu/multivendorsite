"use client";

// components/reviews/star-rating.tsx
//
// Read-only and interactive star widgets. No rating component existed in the
// project (the product page inlined its own loop), so this is the shared one.

import { useState, type KeyboardEvent } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  /** Storefront = amber, dashboard = amber too; slate variant for muted rows. */
  muted?: boolean;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  value,
  max = 5,
  size = 16,
  muted = false,
  showValue = false,
  className = "",
}: StarRatingProps) {
  const safe = Math.max(0, Math.min(max, Number(value) || 0));
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`Rated ${safe.toFixed(1)} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(safe);
        return (
          <Star
            key={i}
            width={size}
            height={size}
            className={
              filled
                ? muted
                  ? "fill-slate-300 text-slate-300"
                  : "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            }
          />
        );
      })}
      {showValue && (
        <span className="ml-1 text-xs font-semibold text-slate-600 tabular-nums">
          {safe.toFixed(1)}
        </span>
      )}
    </span>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: number;
  name?: string;
  error?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  size = 28,
  name = "rating",
  error = false,
}: StarRatingInputProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(Math.max(1, (value || 0) - 1));
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1 ${error ? "rounded-lg ring-2 ring-rose-200" : ""}`}
      role="radiogroup"
      aria-label="Rating"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKey}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= shown;
        return (
          <button
            key={star}
            type="button"
            name={name}
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            disabled={disabled}
            onMouseEnter={() => !disabled && setHover(star)}
            onFocus={() => !disabled && setHover(star)}
            onClick={() => !disabled && onChange(star)}
            className={`rounded-md p-0.5 transition-transform ${
              disabled ? "cursor-not-allowed opacity-60" : "hover:scale-110 active:scale-95"
            }`}
          >
            <Star
              width={size}
              height={size}
              className={active ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
            />
          </button>
        );
      })}
    </div>
  );
}
