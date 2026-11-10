"use client";

// components/wishlist/WishlistView.tsx
//
// Presentational wishlist page (no data fetching — app/wishlist/page.tsx
// wires the existing cartWishApi hooks, auth and dialogs). Every product is
// the shared SharedProductCard, so the global Product Card Design (title,
// price, discount, rating, Add to Cart, colors, sizes) applies here too; the
// page only adds layout and a small meta row UNDER each card (status + remove).
// The remove control is outside the card, so the card's product link and its
// Add to Cart can never remove an item.
import Link from "next/link";
import { AlertTriangle, ArrowRight, Heart, RotateCcw, Sparkles, Trash2, TrendingDown } from "lucide-react";
import { SharedProductCard } from "@/components/product/card/SharedProductCard";
import type { WishlistItem } from "@/features/cartWishApi";
import {
  formatSavedDate,
  formatTaka,
  wishlistItemToCardProduct,
  wishlistNote,
  wishlistSummary,
} from "@/lib/wishlist/card";

export type WishlistStatus = "signedOut" | "loading" | "error" | "ready";

export interface WishlistViewProps {
  status: WishlistStatus;
  items: WishlistItem[];
  errorMessage?: string | null;
  removingIds?: ReadonlySet<string>;
  clearing?: boolean;
  onRemove: (item: WishlistItem) => void;
  onRetry: () => void;
  onSignIn: () => void;
  onClearAll: () => void;
}

/** Cards per row: 2 → 3 (md) → 4 (lg) → 5 (xl). Static classes only. */
const GRID = "grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
const IMAGE_SIZES = "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw";

export function WishlistView(props: WishlistViewProps) {
  const { status, items } = props;
  const summary = wishlistSummary(items);
  const hasItems = status === "ready" && items.length > 0;

  return (
    <div className="min-h-[70vh] bg-stone-50" data-fm-wishlist={status}>
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-8 sm:px-6 md:pt-10 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
              <Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              Saved for later
            </p>
            <h1 className="mt-2 text-[28px] tracking-tight text-stone-900 sm:text-[32px]">My Wishlist</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-stone-500">
              Everything you’ve saved, in one place. Prices and availability stay current, so you’ll know when it’s the right time to buy.
            </p>
          </div>

          {hasItems && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex h-10 items-center rounded-full border border-stone-200 bg-white px-4 text-sm text-stone-600" aria-live="polite">
                <b className="mr-1 font-semibold tabular-nums text-stone-900">{summary.count}</b>
                saved {summary.count === 1 ? "item" : "items"}
              </span>
              <button
                type="button"
                onClick={props.onClearAll}
                disabled={props.clearing}
                className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
              >
                {props.clearing ? "Clearing…" : "Clear all"}
              </button>
            </div>
          )}
        </header>

        {hasItems && (summary.priceDrops > 0 || summary.unavailable > 0) && (
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
            {summary.priceDrops > 0 && (
              <span className="inline-flex items-center gap-1.5 text-teal-700">
                <TrendingDown className="h-4 w-4" aria-hidden="true" />
                {summary.priceDrops} {summary.priceDrops === 1 ? "price has" : "prices have"} dropped since you saved
              </span>
            )}
            {summary.unavailable > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-stone-400" aria-hidden="true" />
                {summary.unavailable} currently unavailable
              </span>
            )}
          </p>
        )}

        <section className="mt-8" aria-label="Wishlist items">
          {status === "loading" && <WishlistSkeleton />}
          {status === "error" && <ErrorState message={props.errorMessage} onRetry={props.onRetry} />}
          {status === "signedOut" && <SignedOutState onSignIn={props.onSignIn} />}
          {status === "ready" && items.length === 0 && <EmptyState />}
          {hasItems && (
            <ul className={GRID} aria-label="Saved products">
              {items.map((item) => (
                <WishlistCell key={item.id} item={item} removing={props.removingIds?.has(item.id) ?? false} onRemove={props.onRemove} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function WishlistCell({ item, removing, onRemove }: { item: WishlistItem; removing: boolean; onRemove: (item: WishlistItem) => void }) {
  const product = wishlistItemToCardProduct(item);
  const note = wishlistNote(item);
  const name = product.name || "this item";
  return (
    <li className={`flex min-w-0 flex-col transition-opacity duration-200 ${removing ? "pointer-events-none opacity-40" : ""}`} data-fm-wishlist-item={item.id} aria-busy={removing || undefined}>
      <div className="min-w-0 flex-1">
        <SharedProductCard product={product} imageSizes={IMAGE_SIZES} unoptimizedImage />
      </div>
      <div className="mt-2 flex min-h-10 items-center justify-between gap-2 border-t border-stone-200/80 pt-1.5">
        <NoteText note={note} />
        <button
          type="button"
          onClick={() => onRemove(item)}
          disabled={removing}
          aria-label={`Remove ${name} from wishlist`}
          title="Remove from wishlist"
          data-fm-wishlist-remove=""
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function NoteText({ note }: { note: ReturnType<typeof wishlistNote> }) {
  if (note.kind === "priceDrop") {
    return (
      <span
        className="inline-flex min-w-0 items-center gap-1 truncate text-xs font-medium text-teal-700"
        title={`${formatTaka(note.amount)} lower than when you saved it`}
      >
        <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Now {formatTaka(note.amount)} lower
      </span>
    );
  }
  if (note.kind === "unavailable") {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-stone-500">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" aria-hidden="true" />
        Currently unavailable
      </span>
    );
  }
  return <span className="truncate text-xs text-stone-400">{note.date ? formatSavedDate(note.date) : "Saved"}</span>;
}

// ── states ───────────────────────────────────────────────────────────────────

function StatePanel({ icon, title, children, actions }: { icon: React.ReactNode; title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-2 py-10 text-center sm:py-14">
      {icon}
      <h2 className="mt-5 text-xl tracking-tight text-stone-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{children}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
    </section>
  );
}

const primaryAction =
  "inline-flex h-11 items-center gap-2 rounded-full bg-teal-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
const secondaryAction =
  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";

function HeartMark() {
  return (
    <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-100" aria-hidden="true">
      <Heart className="h-7 w-7 text-teal-700" strokeWidth={1.75} />
      <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-amber-500" strokeWidth={2} />
    </span>
  );
}

function EmptyState() {
  return (
    <StatePanel
      icon={<HeartMark />}
      title="Your wishlist is waiting"
      actions={
        <Link href="/products" className={primaryAction}>
          Explore products
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      Tap the heart on anything you love and it will be saved here, ready when you are.
    </StatePanel>
  );
}

function SignedOutState({ onSignIn }: { onSignIn: () => void }) {
  return (
    <StatePanel
      icon={<HeartMark />}
      title="Sign in to see your wishlist"
      actions={
        <>
          <button type="button" onClick={onSignIn} className={primaryAction}>
            Sign in
          </button>
          <Link href="/products" className={secondaryAction}>
            Explore products
          </Link>
        </>
      }
    >
      Your saved items are kept with your account, so they’re here on every device.
    </StatePanel>
  );
}

function ErrorState({ message, onRetry }: { message?: string | null; onRetry: () => void }) {
  return (
    <StatePanel
      icon={
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-100" aria-hidden="true">
          <AlertTriangle className="h-7 w-7 text-amber-600" strokeWidth={1.75} />
        </span>
      }
      title="We couldn’t load your wishlist"
      actions={
        <button type="button" onClick={onRetry} className={primaryAction}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      }
    >
      {message || "Something went wrong while loading your saved items."} Your items are safe — please try again.
    </StatePanel>
  );
}

function WishlistSkeleton() {
  return (
    <div role="status" aria-label="Loading your wishlist">
      <ul className={GRID} aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <li key={i} className="flex flex-col">
            <div className="animate-pulse overflow-hidden rounded-[10px] border border-stone-200 bg-white">
              <div className="h-[150px] bg-stone-100 md:h-44" />
              <div className="space-y-2.5 p-3">
                <div className="h-3.5 w-4/5 rounded bg-stone-200" />
                <div className="h-5 w-2/5 rounded bg-stone-200" />
                <div className="h-3 w-1/4 rounded bg-stone-100" />
              </div>
            </div>
            <div className="mt-2 h-10 border-t border-stone-200/80" />
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading your wishlist…</span>
    </div>
  );
}
