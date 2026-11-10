"use client";

// components/cart/CartView.tsx
//
// Presentational cart page (no data fetching or mutations — app/cart/page.tsx
// keeps the existing cartWishApi hooks and handlers and passes them in).
// Same visual language as the wishlist: warm stone neutrals, white panels with
// hairline borders, teal only for actions and accents.
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Heart,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import { PageBreadcrumb } from "./PageBreadcrumb";
import {
  cartCheckoutBlock,
  formatBDT,
  groupByVendor,
  isShortStock,
  isUnavailable,
  lineImage,
  totalSavings,
  unavailableLabel,
  variantLabels,
  type CartLine,
} from "@/lib/cart/display";

export type CartStatus = "signedOut" | "loading" | "error" | "ready";

export interface CartViewProps {
  status: CartStatus;
  items: CartLine[];
  /** Server's selectedSubtotal. */
  subtotal: number;
  errorMessage?: string | null;
  updatingIds: ReadonlySet<string>;
  removingIds: ReadonlySet<string>;
  wishlistingIds: ReadonlySet<string>;
  bulkDeleting: boolean;
  onQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  onSaveForLater: (item: CartLine) => void;
  onToggle: (itemId: string) => void;
  onToggleVendor: (items: CartLine[]) => void;
  onToggleAll: () => void;
  onRemoveSelected: () => void;
  onCheckout: () => void;
  onRetry: () => void;
  onSignIn: () => void;
}

const PAGE = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-teal-700 font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500";

export function CartView(props: CartViewProps) {
  const { status, items } = props;
  const selected = items.filter((i) => i.isSelected);
  const groups = groupByVendor(items);
  const block = cartCheckoutBlock(selected);
  const allSelected = items.length > 0 && items.every((i) => i.isSelected);
  const ready = status === "ready" && items.length > 0;

  return (
    <div className={`min-h-[70vh] bg-stone-50 ${ready ? "pb-40 md:pb-16" : "pb-16"}`} data-fm-cart-page={status}>
      <div className={`${PAGE} pt-5 md:pt-6`}>
        <PageBreadcrumb
          current="Cart"
          note={ready ? `· ${items.length} ${items.length === 1 ? "item" : "items"} from ${groups.length} ${groups.length === 1 ? "seller" : "sellers"}` : undefined}
          action={
            ready ? (
              <Link href="/" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Continue shopping
              </Link>
            ) : undefined
          }
        />

        <div className="mt-5">
          {status === "loading" && <CartSkeleton />}
          {status === "error" && <ErrorState message={props.errorMessage} onRetry={props.onRetry} />}
          {status === "signedOut" && <SignedOutState onSignIn={props.onSignIn} />}
          {status === "ready" && items.length === 0 && <EmptyState />}

          {ready && (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
              <div className="min-w-0 space-y-4">
                {/* Selection toolbar */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2.5 text-sm text-stone-700">
                    <Checkbox checked={allSelected} onChange={props.onToggleAll} label="Select all items" />
                    <span aria-hidden="true">
                      Select all <span className="text-stone-400">({items.length})</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={props.onRemoveSelected}
                    disabled={selected.length === 0 || props.bulkDeleting}
                    className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-500"
                  >
                    {props.bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                    Remove selected
                  </button>
                </div>

                {groups.map((group) => (
                  <section key={group.vendorId} className="overflow-hidden rounded-xl border border-stone-200 bg-white" aria-label={`Items from ${group.name}`}>
                    <div className="flex items-center gap-3 border-b border-stone-100 bg-stone-50/60 px-4 py-3">
                      <Checkbox
                        checked={group.items.every((i) => i.isSelected)}
                        onChange={() => props.onToggleVendor(group.items)}
                        label={`Select all items from ${group.name}`}
                      />
                      <Store className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
                      <span className="truncate text-sm font-semibold text-stone-800">{group.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-stone-400">
                        {group.items.length} {group.items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <ul className="divide-y divide-stone-100">
                      {group.items.map((item) => (
                        <CartLineRow key={item.id} item={item} {...props} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <aside className="lg:sticky lg:top-6" aria-label="Order summary">
                <Summary
                  selectedCount={selected.length}
                  subtotal={props.subtotal}
                  savings={totalSavings(selected)}
                  block={block}
                  onCheckout={props.onCheckout}
                />
              </aside>
            </div>
          )}
        </div>
      </div>

      {/* Mobile action bar — sits above the site's 64px bottom navigation (both hidden from md). */}
      {ready && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden" data-fm-cart-mobilebar="">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-stone-500">
                Total{selected.length > 0 ? ` · ${selected.length} ${selected.length === 1 ? "item" : "items"}` : ""}
              </p>
              <p className="truncate text-lg font-semibold tabular-nums text-stone-900">{formatBDT(props.subtotal)}</p>
              {/* The amount is the server subtotal — delivery is quoted at checkout,
                  so it is not part of this number. Say so here exactly as the
                  desktop summary does, instead of presenting it as the order Total. */}
              <p className="text-[11px] leading-tight text-stone-400">Excluding delivery · calculated at checkout</p>
            </div>
            <button type="button" className={`${primaryBtn} h-11 shrink-0 px-6 text-sm`} disabled={block !== null} onClick={props.onCheckout}>
              Checkout
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {block && <p className="mt-1.5 text-xs text-stone-500">{block}</p>}
        </div>
      )}
    </div>
  );
}

function CartLineRow({ item, ...p }: { item: CartLine } & CartViewProps) {
  const unavailable = isUnavailable(item);
  const short = isShortStock(item);
  const updating = p.updatingIds.has(item.id);
  const removing = p.removingIds.has(item.id);
  const saving = p.wishlistingIds.has(item.id);
  const labels = variantLabels(item);
  const img = lineImage(item);
  const discounted = item.compareAtPrice != null && item.compareAtPrice > item.price;
  const name = item.products?.name ?? "Product";
  const href = item.products?.slug ? `/products/${item.products.slug}` : null;

  return (
    <li className={`flex gap-3 px-4 py-4 transition-opacity sm:gap-4 ${removing ? "opacity-40" : ""}`} data-fm-cart-line={item.id} aria-busy={removing || updating || undefined}>
      <div className="pt-1">
        <Checkbox checked={item.isSelected} onChange={() => p.onToggle(item.id)} label={`Select ${name}`} />
      </div>

      <div className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 sm:h-24 sm:w-24 ${unavailable ? "opacity-60" : ""}`}>
        {img ? (
          <img
            src={img}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {href ? (
              <Link href={href} prefetch={false} className="line-clamp-2 text-sm font-medium leading-snug text-stone-900 hover:text-teal-700 sm:text-[15px]">
                {name}
              </Link>
            ) : (
              <p className="line-clamp-2 text-sm font-medium leading-snug text-stone-900 sm:text-[15px]">{name}</p>
            )}
            {labels.length > 0 && <p className="mt-1 truncate text-xs text-stone-500">{labels.join(" · ")}</p>}
          </div>
          <div className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0.5">
            <span className="text-sm font-semibold tabular-nums text-stone-900 sm:text-base">{formatBDT(item.price)}</span>
            {discounted && <span className="text-xs tabular-nums text-stone-400 line-through">{formatBDT(item.compareAtPrice!)}</span>}
          </div>
        </div>

        {(unavailable || short) && (
          <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${unavailable ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {unavailable ? unavailableLabel(item) : `Only ${item.availableStock} left — reduce the quantity`}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="inline-flex h-10 items-center rounded-full border border-stone-300 bg-white sm:h-9" role="group" aria-label={`Quantity for ${name}`}>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-l-full sm:h-9 sm:w-9 text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={item.quantity <= 1 || updating || unavailable}
              onClick={() => p.onQty(item.id, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="flex w-9 items-center justify-center text-sm font-semibold tabular-nums text-stone-900" aria-live="polite">
              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" aria-label="Updating" /> : item.quantity}
            </span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-r-full sm:h-9 sm:w-9 text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
              disabled={item.quantity >= (item.availableStock ?? 0) || updating || unavailable}
              onClick={() => p.onQty(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <span className="text-sm text-stone-500">
            Total <b className="font-semibold tabular-nums text-stone-900">{formatBDT(item.itemTotal)}</b>
          </span>

          <div className="ml-auto flex items-center">
            <button
              type="button"
              onClick={() => p.onSaveForLater(item)}
              disabled={saving}
              aria-label={`Save ${name} to wishlist`}
              className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-teal-700 sm:h-9 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Heart className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              type="button"
              onClick={() => p.onRemove(item.id)}
              disabled={removing}
              aria-label={`Remove ${name} from cart`}
              className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600 sm:h-9 disabled:opacity-40"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function Summary({ selectedCount, subtotal, savings, block, onCheckout }: { selectedCount: number; subtotal: number; savings: number; block: string | null; onCheckout: () => void }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <div className="px-5 pb-5 pt-5">
        <h2 className="text-base tracking-tight text-stone-900">Order summary</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">
              Subtotal · {selectedCount} {selectedCount === 1 ? "item" : "items"}
            </dt>
            <dd className="font-medium tabular-nums text-stone-900">{formatBDT(subtotal)}</dd>
          </div>
          {savings > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">You save</dt>
              <dd className="font-medium tabular-nums text-teal-700">{formatBDT(savings)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Delivery</dt>
            <dd className="text-right text-stone-400">Calculated at checkout</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-stone-200 pt-4">
          <span className="text-sm font-semibold text-stone-900">Total</span>
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-stone-900">{formatBDT(subtotal)}</span>
        </div>
        <p className="mt-1 text-right text-xs text-stone-400">Excluding delivery</p>

        <button type="button" className={`${primaryBtn} mt-5 hidden h-12 w-full text-[15px] md:flex`} disabled={block !== null} onClick={onCheckout}>
          Checkout
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        {block && <p className="mt-2 hidden text-center text-xs text-stone-500 md:block">{block}</p>}
      </div>
      <p className="flex items-center justify-center gap-1.5 border-t border-stone-100 px-5 py-3 text-xs text-stone-500">
        <ShieldCheck className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
        Secure checkout · prices confirmed at the next step
      </p>
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        onChange();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange();
        }
      }}
      className={`flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
        checked ? "border-teal-700 bg-teal-700" : "border-stone-300 bg-white hover:border-teal-700"
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
          <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

// ── states ───────────────────────────────────────────────────────────────────

function StatePanel({ icon, title, children, actions }: { icon: React.ReactNode; title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-2 py-12 text-center sm:py-16">
      {icon}
      <h2 className="mt-5 text-xl tracking-tight text-stone-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{children}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
    </section>
  );
}

const ringIcon = (node: React.ReactNode, tone: "teal" | "amber" = "teal") => (
  <span
    className={`inline-flex h-16 w-16 items-center justify-center rounded-full ring-1 ${tone === "teal" ? "bg-teal-50 ring-teal-100 text-teal-700" : "bg-amber-50 ring-amber-100 text-amber-600"}`}
    aria-hidden="true"
  >
    {node}
  </span>
);

function EmptyState() {
  return (
    <StatePanel
      icon={ringIcon(<ShoppingBag className="h-7 w-7" strokeWidth={1.75} />)}
      title="Your cart is empty"
      actions={
        <>
          <Link href="/products" className={`${primaryBtn} h-11 px-6 text-sm`}>
            Explore products
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/wishlist" className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
            <Heart className="h-4 w-4" aria-hidden="true" />
            View wishlist
          </Link>
        </>
      }
    >
      Nothing here yet. Browse the shop, or move something over from your wishlist.
    </StatePanel>
  );
}

function SignedOutState({ onSignIn }: { onSignIn: () => void }) {
  return (
    <StatePanel
      icon={ringIcon(<ShoppingBag className="h-7 w-7" strokeWidth={1.75} />)}
      title="Sign in to see your cart"
      actions={
        <>
          <button type="button" onClick={onSignIn} className={`${primaryBtn} h-11 px-6 text-sm`}>
            Sign in
          </button>
          <Link href="/products" className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
            Explore products
          </Link>
        </>
      }
    >
      Your cart is saved with your account, so it follows you on every device.
    </StatePanel>
  );
}

function ErrorState({ message, onRetry }: { message?: string | null; onRetry: () => void }) {
  return (
    <StatePanel
      icon={ringIcon(<AlertTriangle className="h-7 w-7" strokeWidth={1.75} />, "amber")}
      title="We couldn’t load your cart"
      actions={
        <button type="button" onClick={onRetry} className={`${primaryBtn} h-11 px-6 text-sm`}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      }
    >
      {message || "Something went wrong on our side."} Your cart is safe — please try again.
    </StatePanel>
  );
}

function CartSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8" role="status" aria-label="Loading your cart">
      <div className="space-y-4" aria-hidden="true">
        {[0, 1].map((g) => (
          <div key={g} className="animate-pulse overflow-hidden rounded-xl border border-stone-200 bg-white">
            <div className="h-11 border-b border-stone-100 bg-stone-50" />
            {[0, 1].map((r) => (
              <div key={r} className="flex gap-4 border-b border-stone-100 p-4 last:border-0">
                <div className="h-20 w-20 rounded-lg bg-stone-100 sm:h-24 sm:w-24" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-4 w-3/5 rounded bg-stone-200" />
                  <div className="h-3 w-1/4 rounded bg-stone-100" />
                  <div className="h-9 w-28 rounded-full bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-stone-200 bg-white" aria-hidden="true" />
      <span className="sr-only">Loading your cart…</span>
    </div>
  );
}
