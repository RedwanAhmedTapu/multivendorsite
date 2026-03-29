"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Loader2,
  ArrowRight,
  Store,
  ShieldCheck,
  Truck,
  Package,
  RotateCcw,
  Heart,
  HomeIcon,
  ChevronRight,
} from "lucide-react";

import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useToggleItemSelectionMutation,
  useToggleAllItemsMutation,
  CartItem,
  CartItemVariant,
} from "@/features/cartWishApi";
import Link from "next/link";
import { Container } from "@/components/Container";

/* ─── Extended cart item type ────────────────────────────────────────────── */
interface ExtendedCartItem extends Omit<CartItem, "product_variants"> {
  itemTotal: number;
  isInStock: boolean;
  availableStock: number;
  product_variants: CartItemVariant & {
    specialPrice?: number;
    variantImage: string;
    attributeValues?: Record<string, string>;
  };
}

const isExtended = (item: CartItem): item is ExtendedCartItem =>
  "itemTotal" in item && "isInStock" in item;

const fmt = (n: number) =>
  "৳ " + n.toLocaleString("en-BD", { maximumFractionDigits: 0 });

/* ─── Custom Checkbox ────────────────────────────────────────────────────── */
function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={onChange}
      className={`w-[18px] h-[18px] min-w-[18px] rounded-[5px] flex items-center justify-center cursor-pointer flex-shrink-0 transition-all duration-150 ${
        checked
          ? "bg-teal-500 border-2 border-teal-500"
          : "bg-white border-2 border-slate-300 hover:border-teal-400"
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CartPage() {
  const router = useRouter();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const { data: cartData, isLoading } = useGetCartQuery();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [toggleItemSelection] = useToggleItemSelectionMutation();
  const [toggleAllItems] = useToggleAllItemsMutation();

  const allItems = (cartData?.data.items || []).filter(isExtended);
  const selectedItems = allItems.filter((i) => i.isSelected);
  const allSelected =
    allItems.length > 0 && allItems.every((i) => i.isSelected);
  const subtotal = cartData?.data.selectedSubtotal ?? 0;

  const allByVendor = allItems.reduce(
    (acc, item) => {
      const vid = item.products.vendorId;
      if (!acc[vid])
        acc[vid] = {
          name: (item.products as any).vendorName ?? "Seller",
          items: [],
        };
      acc[vid].items.push(item);
      return acc;
    },
    {} as Record<string, { name: string; items: ExtendedCartItem[] }>,
  );

  const vendorIds = Object.keys(allByVendor);

  const handleQty = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    setUpdatingIds((p) => new Set(p).add(itemId));
    try {
      await updateCartItem({ itemId, data: { quantity: qty } }).unwrap();
    } catch (_) {
    } finally {
      setUpdatingIds((p) => {
        const n = new Set(p);
        n.delete(itemId);
        return n;
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    setRemovingIds((p) => new Set(p).add(itemId));
    try {
      await removeFromCart(itemId).unwrap();
    } catch (_) {
    } finally {
      setRemovingIds((p) => {
        const n = new Set(p);
        n.delete(itemId);
        return n;
      });
    }
  };

  const handleToggle = async (itemId: string) => {
    try {
      await toggleItemSelection(itemId).unwrap();
    } catch (_) {}
  };

  const handleToggleAll = async () => {
    try {
      await toggleAllItems({ isSelected: !allSelected }).unwrap();
    } catch (_) {}
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;
    router.push("/checkout");
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 size={34} className="text-teal-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading your cart…</p>
      </div>
    );
  }

  /* ── Empty ── */
  if (!allItems.length) {
    return (
      <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-2 border-dashed border-teal-200 flex items-center justify-center">
          <ShoppingBag size={36} className="text-teal-400 sm:hidden" />
          <ShoppingBag size={40} className="text-teal-400 hidden sm:block" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">
          Your cart is empty
        </h2>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          Looks like you haven't added anything yet.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-200 transition-all"
        >
          Explore Products <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-teal-50 py-4 sm:py-6 lg:py-8 pb-28 lg:pb-12">
      <Container >
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          {/* Breadcrumb trail */}
          <div className="flex items-center gap-1.5 mb-2">
            <Link
              href="/"
              className="w-[30px] h-[30px] flex items-center justify-center rounded-lg bg-teal-50 border border-teal-200 text-teal-600 hover:bg-teal-100 hover:border-teal-300 transition-all flex-shrink-0"
              title="Home"
            >
              <HomeIcon size={14} />
            </Link>

            <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
            <span className="text-[13px] font-bold text-slate-800 whitespace-nowrap">
              Cart
            </span>
          </div>

          {/* Teal accent divider */}
          <div className="mt-3 h-[1.5px] rounded-full bg-gradient-to-r from-teal-200 via-slate-200 to-transparent" />
        </div>

        {/* Layout: stacked on mobile, side-by-side on lg+ */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start">
          {/* ══ LEFT: Cart Items ══ */}
          <div className="w-full lg:flex-1 lg:min-w-0">
            {/* Select-all bar */}
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-3 bg-white border border-slate-200 rounded-t-2xl border-b border-b-slate-100">
              <Checkbox checked={allSelected} onChange={handleToggleAll} />
              <span className="text-xs sm:text-[13px] font-semibold text-slate-600">
                Select All ({allItems.length})
              </span>
              {selectedItems.length > 0 && (
                <span className="ml-auto text-xs font-bold text-red-500 whitespace-nowrap">
                  {selectedItems.length} selected
                </span>
              )}
              <button
                className={`flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors whitespace-nowrap ${
                  selectedItems.length > 0 ? "ml-2" : "ml-auto"
                }`}
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>

            {/* Vendor groups */}
            {vendorIds.map((vendorId, gi) => {
              const { name, items } = allByVendor[vendorId];
              const isLast = gi === vendorIds.length - 1;

              return (
                <div
                  key={vendorId}
                  className={`bg-white border border-t-0 border-slate-200 ${isLast ? "rounded-b-2xl" : ""}`}
                >
                  {/* Vendor header */}
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-slate-50 border-y border-slate-100">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <Checkbox
                        checked={items.every((i) => i.isSelected)}
                        onChange={async () => {
                          for (const item of items) {
                            if (!item.isSelected)
                              await toggleItemSelection(item.id)
                                .unwrap()
                                .catch(() => {});
                          }
                        }}
                      />
                      <Store
                        size={13}
                        className="text-teal-500 flex-shrink-0"
                      />
                      <span className="text-[12px] sm:text-[12.5px] font-bold text-slate-800 truncate">
                        {name}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  {items.map((item, idx) => {
                    const sp = item.product_variants.specialPrice;
                    const dp = sp ?? item.product_variants.price;
                    const hasDiscount = sp && item.product_variants.price > sp;
                    const isRemoving = removingIds.has(item.id);
                    const isUpdating = updatingIds.has(item.id);
                    const attrs = item.product_variants.attributeValues;

                    return (
                      <div
                        key={item.id}
                        className={`
                          px-3 sm:px-5 py-3 sm:py-4
                          ${idx < items.length - 1 ? "border-b border-slate-100" : ""}
                          hover:bg-teal-50/30 transition-colors duration-150
                          ${isRemoving ? "opacity-30" : "opacity-100"}
                        `}
                      >
                        {/* ── Top row: checkbox + image + info + actions ── */}
                        <div className="flex items-start gap-2.5 sm:gap-4">
                          {/* Checkbox (aligned to top of image) */}
                          <div className="pt-1">
                            <Checkbox
                              checked={item.isSelected}
                              onChange={() => handleToggle(item.id)}
                            />
                          </div>

                          {/* Image */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-50">
                            <img
                              src={item.product_variants.variantImage}
                              alt={item.products.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/80x80/f0fdfa/2dd4bf?text=img";
                              }}
                            />
                          </div>

                          {/* Info block */}
                          <div className="flex-1 min-w-0">
                            {/* Name + price on mobile: side by side */}
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[12.5px] sm:text-[13.5px] font-semibold text-slate-800 leading-snug flex-1 min-w-0 pr-1">
                                {item.products.name}
                              </p>
                              {/* Price — visible always on right */}
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm sm:text-base font-extrabold text-red-500 whitespace-nowrap">
                                  ৳
                                  {dp.toLocaleString("en-BD", {
                                    maximumFractionDigits: 0,
                                  })}
                                </div>
                                {hasDiscount && (
                                  <div className="text-[10px] sm:text-xs text-slate-300 line-through whitespace-nowrap">
                                    ৳
                                    {item.product_variants.price.toLocaleString(
                                      "en-BD",
                                      { maximumFractionDigits: 0 },
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Attrs */}
                            {attrs && Object.keys(attrs).length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1 mb-1.5 flex-wrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                                <span className="text-[10.5px] sm:text-[11.5px] text-slate-500">
                                  {Object.entries(attrs)
                                    .map(([k, v]) => `${k}-${v}`)
                                    .join(", ")}
                                </span>
                                <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">
                                  Fulfilled by Seller
                                </span>
                              </div>
                            )}

                            {/* Qty + More Items + action icons in one flex row */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {/* Qty stepper */}
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <button
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-teal-400 hover:text-teal-500 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
                                  disabled={item.quantity <= 1 || isUpdating}
                                  onClick={() =>
                                    handleQty(item.id, item.quantity - 1)
                                  }
                                >
                                  <Minus size={9} />
                                </button>
                                <span className="text-xs sm:text-[13px] font-bold text-slate-800 min-w-[20px] sm:min-w-[24px] text-center">
                                  {isUpdating ? (
                                    <Loader2
                                      size={11}
                                      className="animate-spin text-teal-500 inline"
                                    />
                                  ) : (
                                    item.quantity
                                  )}
                                </span>
                                <button
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-teal-400 hover:text-teal-500 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
                                  disabled={
                                    item.quantity >=
                                      (item.availableStock ?? 99) || isUpdating
                                  }
                                  onClick={() =>
                                    handleQty(item.id, item.quantity + 1)
                                  }
                                >
                                  <Plus size={9} />
                                </button>
                              </div>

                              {/* More Items — hidden on xs, visible sm+ */}
                              <button className="hidden sm:inline-flex text-[10.5px] sm:text-[11px] font-semibold text-teal-500 border border-teal-400 bg-white hover:bg-teal-50 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full transition-all">
                                More Items Like This
                              </button>

                              {/* Spacer */}
                              <div className="flex-1" />

                              {/* Action icons — always visible, compact on mobile */}
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <button
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                  onClick={() => handleRemove(item.id)}
                                  disabled={isRemoving}
                                  title="Remove"
                                >
                                  {isRemoving ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={12} />
                                  )}
                                </button>
                                <button
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-400 transition-all"
                                  title="Save to Wishlist"
                                >
                                  <Heart size={12} />
                                </button>
                              </div>
                            </div>

                            {/* More Items — xs only, shown below */}
                            <button className="sm:hidden mt-2 text-[10px] font-semibold text-teal-500 border border-teal-400 bg-white hover:bg-teal-50 px-2.5 py-0.5 rounded-full transition-all">
                              More Items Like This
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Vendor footer */}
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-teal-50/50 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-teal-600">
                      <Truck size={12} />
                      Standard Delivery
                    </div>
                    {items.every((i) => !i.isSelected) && (
                      <span className="text-[10px] sm:text-[11px] font-semibold text-teal-500 border border-teal-400 bg-white px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
                        No Product Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Continue shopping */}
            <div className="flex justify-end mt-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-700 font-medium py-2 transition-colors"
              >
                <RotateCcw size={12} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* ══ SIDEBAR ══
              – On mobile/tablet: shown below cart items (normal flow)
              – On lg+: sticky on the right
              – On mobile: also has a fixed bottom checkout bar
          */}
          <div className="w-full lg:w-[300px] lg:flex-shrink-0 lg:sticky lg:top-6">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {/* Summary */}
              <div className="p-4 sm:p-5 pb-0">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">
                  Order Summary:
                </h2>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs sm:text-[13.5px] text-slate-500">
                    Product Price:
                  </span>
                  <span className="text-xs sm:text-[13.5px] font-bold text-slate-800">
                    {fmt(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[11px] sm:text-[12.5px] text-slate-400">
                    Delivery Charge:
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    Calculated at checkout
                  </span>
                </div>

                <div className="border-t border-slate-100 my-2.5 sm:my-3" />

                <div className="flex justify-between items-center pb-3 sm:pb-4">
                  <span className="text-sm sm:text-[15px] font-bold text-slate-900">
                    Total Payment:
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-teal-500">
                    {fmt(subtotal)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA — hidden on mobile (use fixed bar), visible sm+ */}
              <div className="hidden sm:block px-4 sm:px-5 pb-4 sm:pb-5">
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-sm sm:text-[15px] font-bold rounded-xl shadow-md shadow-teal-100 hover:shadow-teal-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  disabled={selectedItems.length === 0}
                  onClick={handleProceedToCheckout}
                >
                  Checkout <ArrowRight size={16} />
                </button>
                {selectedItems.length === 0 && (
                  <p className="text-center text-[11px] sm:text-[11.5px] text-slate-400 mt-2">
                    Select at least one item to continue
                  </p>
                )}
              </div>

              {/* Trust badges */}
              <div className="border-t border-slate-100 px-4 sm:px-5 py-2.5 sm:py-3 flex justify-around">
                {[
                  { icon: <ShieldCheck size={12} />, label: "Secure" },
                  { icon: <Truck size={12} />, label: "Fast" },
                  { icon: <Package size={12} />, label: "Returns" },
                ].map(({ icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1 sm:gap-1.5 text-[10.5px] sm:text-[11.5px] text-slate-400 font-medium"
                  >
                    <span className="text-teal-500">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* ── Fixed bottom bar on mobile/tablet (< sm breakpoint hides sidebar CTA) ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <span className="text-xs text-slate-500 font-medium">
            Total
            {selectedItems.length > 0
              ? ` (${selectedItems.length} item${selectedItems.length !== 1 ? "s" : ""})`
              : ""}
            :
          </span>
          <span className="text-base font-extrabold text-teal-500">
            {fmt(subtotal)}
          </span>
        </div>
        <button
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          disabled={selectedItems.length === 0}
          onClick={handleProceedToCheckout}
        >
          Checkout <ArrowRight size={16} />
        </button>
        {selectedItems.length === 0 && (
          <p className="text-center text-[10.5px] text-slate-400 mt-1.5">
            Select at least one item to continue
          </p>
        )}
      </div>
    </div>
  );
}
