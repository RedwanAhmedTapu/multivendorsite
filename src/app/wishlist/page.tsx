"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Trash2,
  ShoppingCart,
  Loader2,
  ArrowRight,
  Star,
  Package,
  ShieldCheck,
  Truck,
  RotateCcw,
  Bell,
  Tag,
  Sparkles,
} from "lucide-react";

import {
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
  useMoveToCartMutation,
  useClearWishlistMutation,
  WishlistItem,
} from "@/features/cartWishApi";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  "৳ " + n.toLocaleString("en-BD", { maximumFractionDigits: 0 });

const discountPct = (orig: number, special: number) =>
  Math.round(((orig - special) / orig) * 100);

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function WishlistPage() {
  const router = useRouter();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [movingIds, setMovingIds] = useState<Set<string>>(new Set());
  const [isClearing, setIsClearing] = useState(false);

  /* ── Queries ────────────────────────────────────────────────────────────── */
  const { data: wishlistData, isLoading } = useGetWishlistQuery();

  /* ── Mutations ──────────────────────────────────────────────────────────── */
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [moveToCart] = useMoveToCartMutation();
  const [clearWishlist] = useClearWishlistMutation();

  /* ── Derived ────────────────────────────────────────────────────────────── */
  const items: WishlistItem[] = wishlistData?.data?.items || [];
  const totalItems = wishlistData?.data?.totalItems ?? 0;

  const totalValue = items.reduce((sum, item) => {
    const p = (item.product_variants as any)?.specialPrice ?? item.product_variants?.price ?? 0;
    return sum + p;
  }, 0);
  const origValue = items.reduce((sum, item) => sum + (item.product_variants?.price ?? 0), 0);
  const savings = origValue - totalValue;

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const handleRemove = async (itemId: string) => {
    setRemovingIds((p) => new Set(p).add(itemId));
    try { await removeFromWishlist(itemId).unwrap(); } catch (_) {}
    finally { setRemovingIds((p) => { const n = new Set(p); n.delete(itemId); return n; }); }
  };

  const handleMoveToCart = async (itemId: string) => {
    setMovingIds((p) => new Set(p).add(itemId));
    try {
      await moveToCart({ itemId, data: { quantity: 1 } }).unwrap();
      await removeFromWishlist(itemId).unwrap();
    } catch (_) {}
    finally { setMovingIds((p) => { const n = new Set(p); n.delete(itemId); return n; }); }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear your entire wishlist?")) return;
    setIsClearing(true);
    try { await clearWishlist().unwrap(); } catch (_) {}
    finally { setIsClearing(false); }
  };

  /* ── Loading ────────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="text-teal-600 animate-spin" />
        <p className="text-sm text-teal-400">Loading your wishlist…</p>
      </div>
    );
  }

  /* ── Empty ──────────────────────────────────────────────────────────────── */
  if (!items.length) {
    return (
      <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-dashed border-teal-300 flex items-center justify-center animate-pulse">
          <Heart size={42} className="text-red-500 fill-red-300" />
        </div>
        <h2 className="text-2xl font-bold text-teal-900 mt-2">Your wishlist is empty</h2>
        <p className="text-sm text-teal-500 leading-relaxed max-w-xs">
          Save items you love and come back to them anytime.
        </p>
        <a
          href="/"
          className="mt-2 inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-teal-200 hover:shadow-teal-300 hover:from-teal-600 hover:to-teal-700 transition-all"
        >
          Discover Products <Sparkles size={15} />
        </a>
      </div>
    );
  }

  /* ── Main ───────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-teal-50 py-8 pb-20">
      <div className="max-w-6xl mx-auto px-5">

        {/* ── Page Header ── */}
        <div className="flex items-end justify-between flex-wrap gap-3 mb-7">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Heart size={22} className="text-red-500 fill-red-500" />
              <h1 className="text-2xl font-bold text-teal-900">My Wishlist</h1>
            </div>
            <p className="text-sm text-teal-500">
              {totalItems} saved item{totalItems !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={handleClearAll}
            disabled={isClearing}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 rounded-xl bg-white text-red-500 text-xs font-bold hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isClearing
              ? <><Loader2 size={12} className="animate-spin" /> Clearing…</>
              : <><Trash2 size={12} /> Clear All</>}
          </button>
        </div>

        {/* ── Layout ── */}
        <div className="flex gap-6 items-start flex-col lg:flex-row">

          {/* ══ Wishlist Grid ══════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item, idx) => {
                const variant = item.product_variants;
                const price = variant?.price ?? 0;
                const special = (variant as any)?.specialPrice as number | undefined;
                const displayPrice = special ?? price;
                const hasDiscount = special && price > special;
                const disc = hasDiscount ? discountPct(price, special!) : 0;
                const imgSrc = variant?.variantImage || item.products.thumbnailUrl;
                const isRemoving = removingIds.has(item.id);
                const isMoving = movingIds.has(item.id);
                const attrs = variant?.attributeValues;

                return (
                  <div
                    key={item.id}
                    className="group bg-white border border-teal-100 rounded-2xl overflow-hidden hover:border-teal-300 hover:shadow-xl hover:shadow-teal-100 hover:-translate-y-0.5 transition-all duration-200"
                    style={{
                      opacity: isRemoving ? 0.3 : 1,
                      animation: `fadeUp 0.35s ease ${idx * 0.06}s both`,
                    }}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden bg-teal-50">
                      <img
                        src={imgSrc}
                        alt={item.products.name}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/220x220/f0fdfa/0d9488?text=♥";
                        }}
                      />

                      {/* Discount badge */}
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {disc}% OFF
                        </span>
                      )}

                      {/* Notify badge */}
                      {item.notifyOnDiscount && (
                        <span className="absolute top-2 right-2 bg-teal-50 border border-teal-200 text-teal-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Bell size={8} /> Alert
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 pb-0">
                      {/* Name */}
                      <p className="text-[13px] font-semibold text-teal-900 leading-snug mb-1 line-clamp-2">
                        {item.products.name}
                      </p>

                      {/* Variant attrs */}
                      {attrs && Object.keys(attrs).length > 0 && (
                        <p className="text-[10.5px] text-teal-400 mb-1.5">
                          {Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[15px] font-extrabold text-teal-600">
                          {fmt(displayPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[11px] text-slate-300 line-through">
                            {fmt(price)}
                          </span>
                        )}
                      </div>

                      {/* Priority stars */}
                      {item.priority > 0 && (
                        <div className="flex items-center gap-0.5 mb-1.5">
                          {Array.from({ length: Math.min(item.priority, 5) }).map((_, i) => (
                            <Star key={i} size={10} className="text-red-400 fill-red-400" />
                          ))}
                          <span className="text-[10px] text-teal-400 ml-1">Priority</span>
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="flex items-start gap-1 text-[10.5px] text-teal-600 italic bg-teal-50 rounded-md px-2 py-1 mb-1">
                          <Tag size={9} className="mt-0.5 flex-shrink-0 text-teal-400" />
                          {item.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 p-3">
                      <button
                        onClick={() => handleMoveToCart(item.id)}
                        disabled={isMoving || isRemoving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md hover:shadow-teal-200"
                      >
                        {isMoving
                          ? <Loader2 size={12} className="animate-spin" />
                          : <ShoppingCart size={12} />}
                        {isMoving ? "Moving…" : "Add to Cart"}
                      </button>

                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={isRemoving || isMoving}
                        title="Remove"
                        className="w-9 h-9 flex items-center justify-center border border-teal-100 rounded-xl text-teal-300 hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {isRemoving
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue shopping */}
            <div className="flex justify-end mt-3">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-teal-500 hover:text-teal-700 font-medium py-2 transition-colors"
              >
                <RotateCcw size={13} /> Continue Shopping
              </a>
            </div>
          </div>

          {/* ══ Sidebar ════════════════════════════════════════════════════ */}
          <div className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-6 space-y-3">

            {/* Summary card */}
            <div className="bg-white border border-teal-100 rounded-2xl overflow-hidden">
              <div className="p-6 pb-0">
                <h2 className="text-base font-bold text-teal-900 mb-4">Wishlist Summary</h2>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-teal-500">Saved items</span>
                    <span className="font-bold text-teal-800">{totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-teal-500">Total value</span>
                    <span className="font-bold text-teal-800">{fmt(totalValue)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-teal-400">Potential savings</span>
                      <span className="font-bold text-red-500">{fmt(savings)}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-teal-100 my-4" />

                {/* Total row */}
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-teal-900">Total</span>
                  <span className="text-xl font-extrabold text-teal-600">{fmt(totalValue)}</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="px-6 pb-5 space-y-2.5">
                <button
                  onClick={() => router.push("/products")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-teal-100 hover:shadow-teal-200 transition-all"
                >
                  <Sparkles size={15} /> Keep Exploring
                </button>

                <button
                  onClick={() => router.push("/cart")}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-teal-200 hover:border-teal-400 hover:text-teal-600 bg-white text-teal-500 text-sm font-semibold rounded-2xl transition-all"
                >
                  <ShoppingCart size={14} /> View Cart <ArrowRight size={13} />
                </button>
              </div>

              {/* Trust badges */}
              <div className="border-t border-teal-100 px-6 py-3.5 flex justify-around">
                {[
                  { icon: <ShieldCheck size={13} />, label: "Secure" },
                  { icon: <Truck size={13} />, label: "Fast" },
                  { icon: <Package size={13} />, label: "Returns" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[11.5px] text-teal-400 font-medium">
                    <span className="text-teal-500">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Price drop alert tip */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={14} className="text-teal-600" />
                <span className="text-sm font-bold text-teal-700">Price Drop Alerts</span>
              </div>
              <p className="text-xs text-teal-600 leading-relaxed">
                Items with the <strong>Alert</strong> badge will notify you when the price drops.
              </p>
            </div>

            {/* Payment methods */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[
                { label: "bKash", cls: "bg-[#e2136e]" },
                { label: "Nagad", cls: "bg-[#f47b20]" },
                { label: "Rocket", cls: "bg-[#8B2FC9]" },
                { label: "VISA", cls: "bg-[#1a1f71]" },
                { label: "MC", cls: "bg-[#eb001b]" },
                { label: "COD", cls: "bg-teal-500" },
              ].map(({ label, cls }) => (
                <span key={label} className={`${cls} text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wide`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fade-up animation */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}