"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
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
import baseQueryWithReauth from "@/features/baseQueryWithReauth"; // used only for direct fetch fallback

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

  // Checkout session state — created on demand
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const sessionCreatedRef = useRef(false); // prevent double-creation in strict mode

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

  // Group selected items by vendor
  const byVendor = selectedItems.reduce(
    (acc, item) => {
      const vid = item.products.vendorId;
      if (!acc[vid])
        acc[vid] = { name: (item.products as any).vendorName ?? "Seller", items: [] };
      acc[vid].items.push(item);
      return acc;
    },
    {} as Record<string, { name: string; items: ExtendedCartItem[] }>
  );

  /* ── Create checkout session on mount ────────────────────────────────── */
  /**
   * CheckoutSession is a separate DB record that must be created before
   * an order can be placed. We create it here (POST /checkout/session)
   * as soon as the page loads and we know which items are selected.
   *
   * If your backend already attaches a checkoutSession to the cart
   * response, remove this block and read it from cartData instead.
   */
  const createSession = useCallback(async () => {
    if (sessionCreatedRef.current) return;
    if (!selectedItems.length) return;

    sessionCreatedRef.current = true;
    setCreatingSession(true);
    setOrderError(null);

    try {
      // Build payload — send selected item IDs and basic pricing
      const payload = {
        selectedItemIds: selectedItems.map((i) => i.id),
        subtotal,
        discount: 0,
        tax: 0,
        shippingCost: 0,          // will be updated after fee calc
        total: subtotal,           // will be recalculated server-side
      };

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }

      const json = await res.json();
      // Accept either { data: { id } } or { id } shapes
      const sessionId = json?.data?.id ?? json?.id;
      if (!sessionId) throw new Error("No session ID in response");

      setCheckoutSessionId(sessionId);
    } catch (err: any) {
      sessionCreatedRef.current = false; // allow retry
      setOrderError(
        `Could not start checkout session: ${err.message}. Please go back and try again.`
      );
    } finally {
      setCreatingSession(false);
    }
  }, [selectedItems.length, subtotal]);

  /* ── Effects ──────────────────────────────────────────────────────────── */
  // Auto-select default address
  useEffect(() => {
    if (defaultAddressData?.data && !selectedAddressId) {
      setSelectedAddressId(defaultAddressData.data.id);
    }
  }, [defaultAddressData]);

  // Create session once cart data is loaded
  useEffect(() => {
    if (!loadingCart && selectedItems.length > 0) {
      createSession();
    }
  }, [loadingCart]);

  // Recalculate delivery fees when address changes
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

  // Guard: no selected items → back to cart
  useEffect(() => {
    if (!loadingCart && selectedItems.length === 0 && allItems.length > 0) {
      router.replace("/cart");
    }
  }, [loadingCart, selectedItems.length, allItems.length]);

  /* ── Place order ──────────────────────────────────────────────────────── */
  const handlePlaceOrder = async () => {
    setOrderError(null);

    if (!checkoutSessionId) {
      // Try creating the session one more time
      await createSession();
      if (!checkoutSessionId) {
        setOrderError("Checkout session not ready. Please wait a moment and try again.");
        return;
      }
    }
    if (!selectedAddressId) {
      setOrderError("Please select a delivery address.");
      return;
    }
    if (!agreedToTerms) {
      setOrderError("Please agree to the Terms & Conditions.");
      return;
    }

    try {
      const res = await placeOrder({ checkoutSessionId }).unwrap();
      setOrderSuccess(res.data.orderNumber ?? res.data.id);
    } catch (err: any) {
      setOrderError(
        err?.data?.error ?? "Failed to place order. Please try again."
      );
    }
  };

  /* ── Success screen ───────────────────────────────────────────────────── */
  if (orderSuccess) {
    return (
      <>
        <style>{`
          ${FONTS}
          @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pop{0%{transform:scale(.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        `}</style>
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#f0fdfa 0%,#e6f7f4 50%,#f0fdf4 100%)",
          fontFamily: FONT_BODY,
        }}>
          <div style={{ textAlign: "center", padding: "48px 24px", animation: "fadeUp .6s ease both" }}>
            <div style={{
              width: 88, height: 88, borderRadius: "50%",
              background: "linear-gradient(135deg,#14b8a6,#10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", boxShadow: "0 16px 40px #14b8a640",
              animation: "pop .5s cubic-bezier(.34,1.56,.64,1) .2s both",
            }}>
              <CheckCircle2 size={44} color="#fff" />
            </div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
              Order Confirmed!
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 12px", fontFamily: FONT_BODY }}>
              Your order has been placed successfully.
            </p>
            <div style={{
              display: "inline-block", background: "#f0fdfa",
              border: "1.5px solid #99f6e4", borderRadius: 10,
              padding: "8px 20px", margin: "0 0 36px",
            }}>
              <span style={{ fontSize: 13, color: "#0d9488", fontWeight: 600, fontFamily: FONT_BODY }}>Order # </span>
              <span style={{ fontSize: 17, color: "#0f766e", fontWeight: 800, fontFamily: FONT_DISPLAY }}>
                {orderSuccess}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <a href="/orders" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "13px 26px",
                background: "linear-gradient(135deg,#14b8a6,#0d9488)",
                color: "#fff", borderRadius: 14, fontWeight: 700,
                fontSize: 14, textDecoration: "none", fontFamily: FONT_BODY,
                boxShadow: "0 8px 20px #14b8a630",
              }}>
                View My Orders <ArrowRight size={15} />
              </a>
              <a href="/" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "13px 26px", background: "#fff",
                border: "1.5px solid #e2e8f0", color: "#475569",
                borderRadius: 14, fontWeight: 600,
                fontSize: 14, textDecoration: "none", fontFamily: FONT_BODY,
              }}>
                Continue Shopping
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loadingCart) {
    return (
      <>
        <style>{`${FONTS}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
          <Loader2 size={32} color="#14b8a6" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </>
    );
  }

  /* ── Main ─────────────────────────────────────────────────────────────── */
  const sessionReady = !!checkoutSessionId;
  const isWorking = creatingSession || placingOrder || calcFees;

  return (
    <>
      <style>{`
        ${FONTS}
        *{box-sizing:border-box;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .co-root{font-family:'${FONT_BODY_RAW}',sans-serif;background:#f8fafc;min-height:100vh;padding:28px 0 80px;}
        .co-inner{max-width:1140px;margin:0 auto;padding:0 20px;}
        .co-layout{display:flex;gap:24px;align-items:flex-start;}
        .co-left{flex:1;min-width:0;display:flex;flex-direction:column;gap:20px;}
        .co-sidebar{width:320px;flex-shrink:0;position:sticky;top:24px;}
        @media(max-width:960px){.co-layout{flex-direction:column!important;}.co-sidebar{width:100%!important;position:static!important;}}
        .co-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;}
        .co-card-hd{padding:16px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;}
        .co-card-title{font-family:'${FONT_DISPLAY_RAW}',sans-serif;font-size:16px;font-weight:700;color:#0f172a;}
        .co-addr{border:1.5px solid #e2e8f0;border-radius:13px;padding:14px 16px;cursor:pointer;position:relative;margin-bottom:10px;transition:border-color .2s,background .2s;}
        .co-addr.sel{border-color:#14b8a6;background:#f0fdfa;}
        .co-addr:hover:not(.sel){border-color:#7dd3c8;}
        .co-vendor{background:#f8fafc;padding:10px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;}
        .co-vendor-name{font-size:11px;font-weight:800;color:#64748b;letter-spacing:.07em;text-transform:uppercase;}
        .co-item{display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid #f8fafc;}
        .co-item:last-of-type{border-bottom:none;}
        .co-del{display:flex;justify-content:space-between;align-items:center;padding:10px 22px;background:#f0fdfa;border-top:1px dashed #a7f3d0;}
        .co-sb-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13.5px;}
        .co-err{background:#fff1f2;border:1.5px solid #fecdd3;border-radius:10px;padding:11px 14px;display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#be123c;margin-bottom:14px;}
        .co-cta{width:100%;padding:15px;border:none;border-radius:14px;font-family:'${FONT_BODY_RAW}',sans-serif;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;}
        .co-cta-primary{background:linear-gradient(135deg,#14b8a6,#0d9488);color:#fff;}
        .co-cta-primary:hover:not(:disabled){box-shadow:0 8px 24px #14b8a640;filter:brightness(1.04);}
        .co-cta-primary:disabled{opacity:.4;cursor:not-allowed;}
        .co-trust{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#94a3b8;font-weight:500;}
        /* Session banner */
        .session-banner{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;font-size:12.5px;font-family:'${FONT_BODY_RAW}',sans-serif;margin-bottom:14px;}
        .session-banner.loading{background:#f0fdfa;border:1.5px solid #99f6e4;color:#0d9488;}
        .session-banner.ready{background:#f0fdf4;border:1.5px solid #86efac;color:#15803d;}
        .fu{animation:fadeUp .3s ease both;}
        .fu1{animation-delay:.06s}.fu2{animation-delay:.12s}.fu3{animation-delay:.18s}
      `}</style>

      <div className="co-root">
        <div className="co-inner">

          {/* Header */}
          <div className="fu" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <button
              onClick={() => router.push("/cart")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                border: "1.5px solid #e2e8f0", background: "#fff",
                fontSize: 13, fontWeight: 600, color: "#475569",
                cursor: "pointer", fontFamily: FONT_BODY,
              }}
            >
              <ArrowLeft size={14} /> Back to Cart
            </button>
            <div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Checkout
              </h1>
              <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "2px 0 0", fontFamily: FONT_BODY }}>
                {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>

          <div className="co-layout fu fu1">

            {/* ══ LEFT ══════════════════════════════════════════════════ */}
            <div className="co-left">

              {/* Delivery Address */}
              <div className="co-card fu">
                <div className="co-card-hd">
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "#f0fdfa",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <MapPin size={15} color="#14b8a6" />
                    </div>
                    <span className="co-card-title">Delivery Address</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700,
                      background: "#f0fdfa", color: "#0d9488",
                      padding: "2px 8px", borderRadius: 99, letterSpacing: ".04em",
                    }}>
                      {addresses.length}/10
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      fontSize: 13, fontWeight: 700, color: "#14b8a6",
                      background: "#f0fdfa", border: "1.5px solid #99f6e4",
                      borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                      fontFamily: FONT_BODY,
                    }}
                  >
                    <Plus size={12} /> Add New
                  </button>
                </div>

                <div style={{ padding: "16px 22px" }}>
                  {addresses.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#cbd5e1", fontSize: 13, fontFamily: FONT_BODY }}>
                      No saved addresses.{" "}
                      <button
                        onClick={() => setIsAddressModalOpen(true)}
                        style={{ color: "#14b8a6", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY }}
                      >
                        Add one
                      </button>
                    </div>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`co-addr ${addr.id === selectedAddressId ? "sel" : ""}`}
                        onClick={() => setSelectedAddressId(addr.id)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", fontFamily: FONT_BODY }}>
                              {addr.fullName}
                            </span>
                            {addr.isDefault && (
                              <span style={{
                                fontSize: 10, fontWeight: 700,
                                background: "#f0fdfa", color: "#0d9488",
                                padding: "1px 7px", borderRadius: 99, letterSpacing: ".04em",
                              }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          {addr.id === selectedAddressId && (
                            <CheckCircle2 size={17} color="#14b8a6" style={{ flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.65, fontFamily: FONT_BODY }}>
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: FONT_BODY }}>
                          📞 {addr.phone}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Order Items read-only */}
              <div className="co-card fu fu1">
                <div className="co-card-hd">
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "#f0fdfa",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Package size={15} color="#14b8a6" />
                    </div>
                    <span className="co-card-title">
                      Order Items · {selectedItems.length}
                    </span>
                  </div>
                </div>

                {Object.entries(byVendor).map(([vendorId, { name, items }]) => {
                  const vd = deliveryCalcs.find((c) => c.vendorId === vendorId);
                  return (
                    <div key={vendorId}>
                      <div className="co-vendor">
                        <Store size={12} color="#94a3b8" />
                        <span className="co-vendor-name">{name}</span>
                      </div>
                      {items.map((item) => {
                        const dp =
                          item.product_variants.specialPrice ??
                          item.product_variants.price;
                        return (
                          <div className="co-item" key={item.id}>
                            <img
                              src={item.product_variants.variantImage}
                              alt={item.products.name}
                              style={{
                                width: 52, height: 52, borderRadius: 9,
                                objectFit: "cover",
                                border: "1.5px solid #e2e8f0", flexShrink: 0,
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/52x52/f0fdfa/2dd4bf?text=img";
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", marginBottom: 2, lineHeight: 1.4 }}>
                                {item.products.name}
                              </div>
                              <div style={{ fontSize: 11.5, color: "#94a3b8", fontFamily: FONT_BODY }}>
                                Qty: {item.quantity}
                                {item.product_variants.attributeValues &&
                                  Object.keys(item.product_variants.attributeValues).length > 0 && (
                                    <> ·{" "}
                                      {Object.entries(item.product_variants.attributeValues)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(", ")}
                                    </>
                                  )}
                              </div>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {fmt(dp * item.quantity)}
                            </div>
                          </div>
                        );
                      })}
                      {/* Per-vendor delivery */}
                      <div className="co-del">
                        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#0d9488", fontWeight: 600, fontFamily: FONT_BODY }}>
                          <Truck size={13} />
                          {vd?.courierProvider ?? "Standard"} Delivery
                          {vd?.estimatedDeliveryDays && (
                            <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                              · Est. {vd.estimatedDeliveryDays}d
                            </span>
                          )}
                        </div>
                        {calcFees ? (
                          <Loader2 size={14} color="#14b8a6" style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: FONT_BODY }}>
                            {vd ? fmt(vd.deliveryCharge) : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ SIDEBAR ════════════════════════════════════════════════ */}
            <div className="co-sidebar fu fu2">
              <div className="co-card" style={{ marginBottom: 14 }}>
                <div style={{ padding: "22px 24px 0" }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
                    Payment Summary
                  </div>

                  {/* Session status indicator */}
                  {creatingSession && (
                    <div className="session-banner loading" style={{ marginBottom: 14 }}>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                      Preparing your checkout session…
                    </div>
                  )}
                  {sessionReady && !creatingSession && (
                    <div className="session-banner ready" style={{ marginBottom: 14 }}>
                      <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                      Checkout session ready
                    </div>
                  )}

                  <div className="co-sb-row">
                    <span style={{ color: "#64748b" }}>
                      Subtotal ({selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""})
                    </span>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{fmt(subtotal)}</span>
                  </div>

                  <div className="co-sb-row">
                    <span style={{ color: "#64748b" }}>Delivery Charge</span>
                    {calcFees ? (
                      <Loader2 size={13} color="#14b8a6" style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <span style={{ fontWeight: 700, color: totalDelivery === 0 ? "#cbd5e1" : "#0f172a" }}>
                        {totalDelivery === 0 ? "—" : fmt(totalDelivery)}
                      </span>
                    )}
                  </div>

                  <div style={{ borderTop: "1.5px solid #f1f5f9", margin: "12px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Total</span>
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: "#14b8a6" }}>
                      {fmt(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Terms */}
                <div style={{ padding: "16px 24px 0", borderTop: "1px solid #f1f5f9", marginTop: 18 }}>
                  <label style={{
                    display: "flex", alignItems: "flex-start", gap: 9,
                    cursor: "pointer", fontSize: 11.5, color: "#94a3b8",
                    lineHeight: 1.7, fontFamily: FONT_BODY,
                  }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 2, accentColor: "#14b8a6", flexShrink: 0, width: 14, height: 14 }}
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    />
                    I agree to the{" "}
                    <a href="/terms" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>Terms</a>,{" "}
                    <a href="/privacy" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</a>{" "}
                    &amp;{" "}
                    <a href="/returns" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>Return Policy</a>
                  </label>
                </div>

                {/* Error */}
                {orderError && (
                  <div className="co-err" style={{ margin: "14px 24px 0" }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* CTA */}
                <div style={{ padding: "16px 24px 24px" }}>
                  <button
                    className="co-cta co-cta-primary"
                    disabled={!selectedAddressId || !agreedToTerms || !sessionReady || isWorking}
                    onClick={handlePlaceOrder}
                  >
                    {creatingSession ? (
                      <>
                        <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                        Preparing session…
                      </>
                    ) : placingOrder ? (
                      <>
                        <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                        Placing Order…
                      </>
                    ) : (
                      <>
                        Place Order · {fmt(grandTotal)}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {/* Contextual hint below button */}
                  {!sessionReady && !creatingSession && !orderError && (
                    <p style={{ textAlign: "center", fontSize: 11.5, color: "#f59e0b", margin: "8px 0 0", fontFamily: FONT_BODY }}>
                      ⚠ Session not ready.{" "}
                      <button
                        onClick={() => { sessionCreatedRef.current = false; createSession(); }}
                        style={{ color: "#14b8a6", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: FONT_BODY }}
                      >
                        Retry
                      </button>
                    </p>
                  )}
                  {!selectedAddressId && sessionReady && (
                    <p style={{ textAlign: "center", fontSize: 11.5, color: "#94a3b8", margin: "8px 0 0", fontFamily: FONT_BODY }}>
                      Select a delivery address to continue
                    </p>
                  )}
                </div>

                {/* Trust */}
                <div style={{ borderTop: "1px solid #f1f5f9", padding: "13px 24px", display: "flex", justifyContent: "space-around" }}>
                  <div className="co-trust"><ShieldCheck size={13} color="#14b8a6" /> Secure Pay</div>
                  <div className="co-trust"><Truck size={13} color="#14b8a6" /> Fast Delivery</div>
                  <div className="co-trust"><Package size={13} color="#14b8a6" /> Easy Returns</div>
                </div>
              </div>

              {/* Payment badges */}
              <div className="fu fu3" style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
                {[
                  { label: "bKash", bg: "#e2136e" },
                  { label: "Nagad", bg: "#f47b20" },
                  { label: "Rocket", bg: "#8B2FC9" },
                  { label: "VISA", bg: "#1a1f71" },
                  { label: "MC", bg: "#eb001b" },
                  { label: "COD", bg: "#14b8a6" },
                ].map((p) => (
                  <div key={p.label} style={{
                    background: p.bg, color: "#fff",
                    fontSize: 10, fontWeight: 800,
                    padding: "4px 10px", borderRadius: 6,
                    letterSpacing: ".04em", fontFamily: FONT_BODY,
                  }}>
                    {p.label}
                  </div>
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

/* ─── Constants ──────────────────────────────────────────────────────────── */
const FONT_DISPLAY_RAW = "Sora";
const FONT_BODY_RAW = "DM Sans";
const FONT_DISPLAY = `'${FONT_DISPLAY_RAW}', sans-serif`;
const FONT_BODY = `'${FONT_BODY_RAW}', sans-serif`;
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`;