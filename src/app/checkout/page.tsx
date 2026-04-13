"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Package,
  Truck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Store,
} from "lucide-react";

import {
  useGetCartQuery,
  useCalculateDeliveryFeesMutation,
  CartItem,
  CartItemVariant,
} from "@/features/cartWishApi";
import {
  useGetAddressesQuery,
  useGetDefaultAddressQuery,
} from "@/features/userAddressApi";
import { usePlaceOrderMutation } from "@/features/userorderApi";
import AddressModal from "@/components/addressmodalcart/AddressModal";

/* ─── Types ──────────────────────────────────────────────────────────────── */
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

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const router = useRouter();

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  /* ── Queries ──────────────────────────────────────────────────────────── */
  const { data: cartData, isLoading: loadingCart } = useGetCartQuery();
  const { data: addressesData } = useGetAddressesQuery();
  const { data: defaultAddressData } = useGetDefaultAddressQuery();

  /* ── Mutations ────────────────────────────────────────────────────────── */
  const [calculateFees, { data: feesData, isLoading: calcFees }] =
    useCalculateDeliveryFeesMutation();
  const [placeOrder, { isLoading: placingOrder }] = usePlaceOrderMutation();

  /* ── Derived ──────────────────────────────────────────────────────────── */
  const allItems = (cartData?.data.items || []).filter(isExtended);
  const selectedItems = allItems.filter((i) => i.isSelected);
  const addresses = addressesData?.data || [];
  const deliveryCalcs = feesData?.data?.deliveryCalculations ?? [];
  const subtotal = cartData?.data.selectedSubtotal ?? 0;
  const totalDelivery = feesData?.data?.totalDeliveryFee ?? 0;
  const grandTotal = subtotal + totalDelivery;

  const byVendor = selectedItems.reduce(
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
    {} as Record<string, { name: string; items: ExtendedCartItem[] }>
  );

  /* ── Effects ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (defaultAddressData?.data && !selectedAddressId) {
      setSelectedAddressId(defaultAddressData.data.id);
    }
  }, [defaultAddressData]);

  const recalcFees = useCallback(async () => {
    if (!selectedAddressId || !selectedItems.length) return;
    try {
      await calculateFees({
        userAddressId: selectedAddressId,
        codEnabled: false,
      }).unwrap();
    } catch (_) {}
  }, [selectedAddressId, selectedItems.length, calculateFees]);

  useEffect(() => {
    recalcFees();
  }, [selectedAddressId]);

  useEffect(() => {
    if (!loadingCart && selectedItems.length === 0 && allItems.length > 0) {
      router.replace("/cart");
    }
  }, [loadingCart, selectedItems.length, allItems.length]);

  /* ── Place order ──────────────────────────────────────────────────────── */
  const handlePlaceOrder = async () => {
    setOrderError(null);
    if (!selectedAddressId) {
      setOrderError("Please select a delivery address.");
      return;
    }
    if (!agreedToTerms) {
      setOrderError("Please agree to the Terms & Conditions.");
      return;
    }
    try {
      // ✅ FIXED: was `addressId`, must be `userAddressId` per PlaceOrderRequest
      const res = await placeOrder({ userAddressId: selectedAddressId }).unwrap();
      setOrderSuccess(res.data.orderNumber ?? res.data.id);
    } catch (err: any) {
      console.log("place order", err);
      setOrderError(
        err?.data?.error ?? "Failed to place order. Please try again."
      );
    }
  };

  /* ── Success screen ───────────────────────────────────────────────────── */
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50/60 to-green-50 px-4">
        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pop { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
          .anim-fadeup { animation: fadeUp .6s ease both; }
          .anim-pop    { animation: pop .5s cubic-bezier(.34,1.56,.64,1) .2s both; }
        `}</style>
        <div className="text-center py-12 px-6 anim-fadeup">
          <div className="anim-pop w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_16px_40px_rgba(20,184,166,0.35)]">
            <CheckCircle2 size={48} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Order Confirmed!
          </h1>
          <p className="text-sm text-slate-500 mb-5">
            Your order has been placed successfully.
          </p>
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-5 py-2.5 mb-10">
            <span className="text-sm font-semibold text-teal-600">Order #</span>
            <span className="text-lg font-extrabold text-teal-700">{orderSuccess}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/orders"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl font-bold text-sm shadow-[0_8px_20px_rgba(20,184,166,0.3)] hover:brightness-105 transition-all"
            >
              View My Orders <ArrowRight size={15} />
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-semibold text-sm hover:bg-slate-50 transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loadingCart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={32} className="text-teal-500 animate-spin" />
      </div>
    );
  }

  /* ── Main ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .au  { animation: fadeUp .35s ease both; }
        .au1 { animation-delay:.07s }
        .au2 { animation-delay:.14s }
        .au3 { animation-delay:.21s }
        .au4 { animation-delay:.28s }
      `}</style>

      <div className="min-h-screen bg-slate-50 pb-24 pt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Page Header ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-8 au">
            <button
              onClick={() => router.push("/cart")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} /> Back to Cart
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                Checkout
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>

          {/* ── Two-column layout ─────────────────────────────────────────── */}
          <div className="flex flex-col xl:flex-row gap-6 items-start">

            {/* ══ LEFT COLUMN ══════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">

              {/* ── Delivery Address Card ─────────────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm au au1">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                      <MapPin size={15} className="text-teal-500" />
                    </div>
                    <span className="font-bold text-slate-900 text-[15px]">
                      Delivery Address
                    </span>
                    <span className="text-[10.5px] font-bold bg-teal-50 text-teal-600 px-2.5 py-0.5 rounded-full border border-teal-100">
                      {addresses.length}/10
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="flex items-center gap-1.5 text-[13px] font-bold text-teal-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    <Plus size={12} /> Add New
                  </button>
                </div>

                {/* Address grid */}
                <div className="p-5">
                  {addresses.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      No saved addresses.{" "}
                      <button
                        onClick={() => setIsAddressModalOpen(true)}
                        className="text-teal-500 font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Add one
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr) => {
                        const sel = addr.id === selectedAddressId;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                              sel
                                ? "border-teal-400 bg-teal-50/50 shadow-sm"
                                : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
                            }`}
                          >
                            {sel && (
                              <CheckCircle2
                                size={17}
                                className="absolute top-3.5 right-3.5 text-teal-500 shrink-0"
                              />
                            )}
                            <div className="flex items-center gap-2 mb-1.5 pr-6">
                              <span className="text-[13.5px] font-bold text-slate-900 leading-snug">
                                {addr.fullName}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] font-extrabold bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100 uppercase tracking-wide">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mb-1">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                            </p>
                            <p className="text-[11.5px] text-slate-400">
                              📞 {addr.phone}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Order Items Card ──────────────────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm au au2">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Package size={15} className="text-teal-500" />
                  </div>
                  <span className="font-bold text-slate-900 text-[15px]">
                    Order Items
                  </span>
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                    {selectedItems.length}
                  </span>
                </div>

                {/* Items grouped by vendor */}
                {Object.entries(byVendor).map(([vendorId, { name, items }]) => {
                  const vd = deliveryCalcs.find((c) => c.vendorId === vendorId);
                  return (
                    <div key={vendorId} className="border-b border-slate-100 last:border-b-0">
                      {/* Vendor strip */}
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                        <Store size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                          {name}
                        </span>
                      </div>

                      {/* Item rows */}
                      {items.map((item) => {
                        const dp =
                          item.product_variants.specialPrice ??
                          item.product_variants.price;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3.5 px-5 py-3.5 border-b border-slate-50 last:border-b-0"
                          >
                            <img
                              src={item.product_variants.variantImage}
                              alt={item.products.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/56x56/f0fdfa/2dd4bf?text=img";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13.5px] font-semibold text-slate-900 leading-snug line-clamp-2 mb-0.5">
                                {item.products.name}
                              </p>
                              <p className="text-[11.5px] text-slate-400">
                                Qty: {item.quantity}
                                {item.product_variants.attributeValues &&
                                  Object.keys(
                                    item.product_variants.attributeValues
                                  ).length > 0 && (
                                    <>
                                      {" · "}
                                      {Object.entries(
                                        item.product_variants.attributeValues
                                      )
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(", ")}
                                    </>
                                  )}
                              </p>
                            </div>
                            <span className="text-[14px] font-bold text-slate-900 shrink-0">
                              {fmt(dp * item.quantity)}
                            </span>
                          </div>
                        );
                      })}

                      {/* Delivery info row */}
                      <div className="flex items-center justify-between px-5 py-3 bg-teal-50/60 border-t border-dashed border-teal-200">
                        <div className="flex items-center gap-2 text-[12.5px] text-teal-700 font-semibold">
                          <Truck size={13} className="shrink-0" />
                          {vd?.courierProvider ?? "Standard"} Delivery
                          {vd?.estimatedDeliveryDays && (
                            <span className="text-slate-400 font-normal">
                              · Est. {vd.estimatedDeliveryDays}d
                            </span>
                          )}
                        </div>
                        {calcFees ? (
                          <Loader2 size={14} className="text-teal-500 animate-spin" />
                        ) : (
                          <span className="text-[13px] font-bold text-slate-800">
                            {vd ? fmt(vd.deliveryCharge) : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ SIDEBAR ══════════════════════════════════════════════════ */}
            <div className="w-full xl:w-[330px] shrink-0 xl:sticky xl:top-6 flex flex-col gap-4 au au3">

              {/* ── Payment Summary ───────────────────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

                {/* Totals */}
                <div className="px-6 pt-6 pb-4">
                  <h2 className="font-extrabold text-slate-900 text-[17px] mb-5">
                    Payment Summary
                  </h2>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[13.5px]">
                      <span className="text-slate-500">
                        Subtotal ({selectedItems.length} item
                        {selectedItems.length !== 1 ? "s" : ""})
                      </span>
                      <span className="font-bold text-slate-900">{fmt(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[13.5px]">
                      <span className="text-slate-500">Delivery Charge</span>
                      {calcFees ? (
                        <Loader2 size={13} className="text-teal-500 animate-spin" />
                      ) : (
                        <span
                          className={`font-bold ${
                            totalDelivery === 0 ? "text-slate-300" : "text-slate-900"
                          }`}
                        >
                          {totalDelivery === 0 ? "—" : fmt(totalDelivery)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-4" />

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-base">Total</span>
                    <span className="font-extrabold text-teal-500 text-[26px] leading-none tracking-tight">
                      {fmt(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Terms */}
                <div className="px-6 py-4 border-t border-slate-100">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 accent-teal-500 shrink-0 cursor-pointer"
                    />
                    <span className="text-[11.5px] text-slate-400 leading-relaxed">
                      I agree to the{" "}
                      <a href="/terms" className="text-teal-500 font-semibold hover:underline">
                        Terms
                      </a>
                      ,{" "}
                      <a href="/privacy" className="text-teal-500 font-semibold hover:underline">
                        Privacy Policy
                      </a>{" "}
                      &amp;{" "}
                      <a href="/returns" className="text-teal-500 font-semibold hover:underline">
                        Return Policy
                      </a>
                    </span>
                  </label>
                </div>

                {/* Error */}
                {orderError && (
                  <div className="mx-5 mb-3 flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-[13px] text-rose-700">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* CTA */}
                <div className="px-5 pb-5 pt-1">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!selectedAddressId || !agreedToTerms || placingOrder}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold text-[15px] shadow-[0_6px_20px_rgba(20,184,166,0.3)] hover:brightness-105 hover:shadow-[0_10px_28px_rgba(20,184,166,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Placing Order…
                      </>
                    ) : (
                      <>
                        Place Order · {fmt(grandTotal)}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {!selectedAddressId && (
                    <p className="text-center text-[11.5px] text-slate-400 mt-2">
                      Select a delivery address to continue
                    </p>
                  )}
                </div>

                {/* Trust badges */}
                <div className="flex justify-around border-t border-slate-100 px-4 py-3.5">
                  {[
                    { icon: <ShieldCheck size={13} />, label: "Secure Pay" },
                    { icon: <Truck size={13} />, label: "Fast Delivery" },
                    { icon: <Package size={13} />, label: "Easy Returns" },
                  ].map(({ icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 text-[11.5px] text-slate-400 font-medium"
                    >
                      <span className="text-teal-500">{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Payment method badges ─────────────────────────────────── */}
              <div className="flex flex-wrap gap-2 justify-center au au4">
                {[
                  { label: "bKash",  cls: "bg-[#e2136e]" },
                  { label: "Nagad",  cls: "bg-[#f47b20]" },
                  { label: "Rocket", cls: "bg-[#8B2FC9]" },
                  { label: "VISA",   cls: "bg-[#1a1f71]" },
                  { label: "MC",     cls: "bg-[#eb001b]" },
                  { label: "COD",    cls: "bg-teal-500"  },
                ].map((p) => (
                  <span
                    key={p.label}
                    className={`${p.cls} text-white text-[10px] font-extrabold px-3 py-1 rounded-md tracking-wider`}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {isAddressModalOpen && (
        <AddressModal
          onClose={() => setIsAddressModalOpen(false)}
          onSelectAddress={(id) => {
            setSelectedAddressId(id);
            setIsAddressModalOpen(false);
          }}
          selectedAddressId={selectedAddressId}
        />
      )}
    </>
  );
}