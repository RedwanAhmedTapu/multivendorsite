"use client";

// app/checkout/page.tsx
//
// Checkout — redesigned presentation, same flow and data:
//   1. delivery address (saved addresses + the existing AddressModal),
//   2. payment method (COD, or Online via the admin's active gateway),
//   3. review items per seller with the server's checkout quote from
//      calculateDeliveryFees (re-quoted when the address / payment changes),
//   then placeOrder → createPayment (COD: confirmation; Online: redirect to the
//   gateway's hosted page). Phase 2 (H-3): every amount (prices, per-warehouse
//   delivery, total) comes from that quote — the same computation placement
//   repeats — and the order is placed with its quoteHash. If placement answers
//   409 CHECKOUT_CHANGED, nothing was placed: the fresh quote is shown in
//   CheckoutChangedPanel and the customer must confirm it explicitly. Prices
//   changed since the items were added need an explicit acceptance.
// Safety (lib/checkout/submit.ts): a synchronous lock blocks double
// submission, and if the payment step fails after the order was created the
// retry only re-runs the payment for that same order.
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  MapPin,
  Plus,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import type { RootState } from "@/store/store";
import { cartWishApi, useCalculateDeliveryFeesMutation, useGetCartQuery, type CheckoutQuote } from "@/features/cartWishApi";
import { useGetAddressesQuery, useGetDefaultAddressQuery, type UserAddress } from "@/features/userAddressApi";
import { usePlaceOrderMutation } from "@/features/userorderApi";
import { useTrackCheckoutStarted } from "@/lib/analytics/useAnalytics";
import { useCreatePaymentMutation, useGetActiveGatewayQuery, type GatewayCode, type PaymentMethod } from "@/features/paymentApi";
import AddressModal from "@/components/addressmodalcart/AddressModal";
import { LoginModal } from "@/components/loginmodal/loginModal";
import { PageBreadcrumb } from "@/components/cart/PageBreadcrumb";
import { ReviewItemsTable } from "@/components/checkout/ReviewItemsTable";
import { CheckoutChangedPanel } from "@/components/checkout/CheckoutChangedPanel";
import { PaymentMethodPicker } from "@/components/checkout/PaymentMethodPicker";
import { deliveryQuote, formatBDT, groupByVendor, type CartLine } from "@/lib/cart/display";
import { checkoutBlock, createSubmitLock, submitCheckout, type PlacedOrder } from "@/lib/checkout/submit";

const PAGE = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-teal-700 font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((s: RootState) => s.auth);
  const isAuthenticated = !!user && !!accessToken;
  const userId = (user as { id?: string } | null)?.id;

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<GatewayCode>("COD");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const submitLock = useRef(createSubmitLock());
  // Phase 2 (H-3): the server quote under review, a pending 409 change that
  // must be confirmed, and the customer's acceptance of changed prices.
  const [activeQuote, setActiveQuote] = useState<CheckoutQuote | null>(null);
  const [pendingChange, setPendingChange] = useState<{ previous: CheckoutQuote | null; message: string } | null>(null);
  const [acceptedPrices, setAcceptedPrices] = useState(false);

  /* ── Queries ─────────────────────────────────────────────────────────── */
  const { data: cartData, isLoading: loadingCart, isError: cartError, error: cartErr, refetch: refetchCart } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: addressesData, isLoading: loadingAddresses } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const { data: defaultAddressData } = useGetDefaultAddressQuery(undefined, { skip: !isAuthenticated });
  // Which gateway the admin has switched on; no data = Online Payment disabled.
  const { data: activeGatewayRes, isLoading: loadingGateway } = useGetActiveGatewayQuery();
  const activeGateway = activeGatewayRes?.data ?? null;
  const onlineAvailable = !loadingGateway && !!activeGateway;
  const gatewayName = activeGateway?.displayName || activeGateway?.name || "";

  /* ── Mutations ───────────────────────────────────────────────────────── */
  const [calculateFees, { data: feesData, isLoading: calcFees, isError: feesError }] = useCalculateDeliveryFeesMutation();
  const [placeOrder, { isLoading: placingOrder }] = usePlaceOrderMutation();
  const [createPayment, { isLoading: startingPayment }] = useCreatePaymentMutation();
  const isSubmitting = placingOrder || startingPayment;

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const allItems = (cartData?.data.items || []) as CartLine[];
  const selectedItems = allItems.filter((i) => i.isSelected);
  // Business Advisor: "checkout opened" (the server reads which products from the cart itself).
  useTrackCheckoutStarted(isAuthenticated && selectedItems.length > 0);
  const addresses: UserAddress[] = addressesData?.data || [];
  const groups = groupByVendor(selectedItems);
  // Phase 2 (H-3): every amount comes from the server's checkout quote (the
  // same computation placement repeats); the cart's own subtotal is shown only
  // until the quote arrives, with delivery pending.
  const quote = deliveryQuote(activeQuote, groups.map((g) => g.vendorId));
  const subtotal = activeQuote?.subtotal ?? cartData?.data.selectedSubtotal ?? 0;
  const totalDelivery = quote.total;
  const grandTotal = activeQuote?.grandTotal ?? subtotal;
  const needsPriceAck = (activeQuote?.priceChanges.length ?? 0) > 0;
  const itemNames = Object.fromEntries(selectedItems.map((i) => [i.id, i.products?.name ?? "Item"]));

  /* ── Effects (existing behaviour) ────────────────────────────────────── */
  useEffect(() => {
    if (defaultAddressData?.data && !selectedAddressId) setSelectedAddressId(defaultAddressData.data.id);
  }, [defaultAddressData, selectedAddressId]);

  // Online unavailable (no gateway) → fall back to COD rather than a dead option.
  useEffect(() => {
    if (!loadingGateway && !activeGateway && selectedPayment === "ONLINE") setSelectedPayment("COD");
  }, [loadingGateway, activeGateway, selectedPayment]);

  const recalcFees = useCallback(async () => {
    if (!selectedAddressId || !selectedItems.length || placedOrder) return;
    try {
      await calculateFees({ userAddressId: selectedAddressId, codEnabled: selectedPayment === "COD" }).unwrap();
    } catch {
      /* shown as "couldn't calculate" with a retry */
    }
  }, [selectedAddressId, selectedItems.length, selectedPayment, calculateFees, placedOrder]);

  // Re-quote when the address, the payment method (COD charge) or the selected items change.
  // (Previously only address / payment were watched, so a quote requested before the cart
  // had loaded was never retried.)
  useEffect(() => {
    void recalcFees();
  }, [recalcFees]);

  // A freshly calculated quote replaces the one under review (and any pending
  // change); a price acceptance never carries over to a different quote.
  useEffect(() => {
    if (!feesData?.data) return;
    setActiveQuote(feesData.data);
    setPendingChange(null);
    setAcceptedPrices(false);
  }, [feesData]);

  useEffect(() => {
    if (!loadingCart && !placedOrder && !orderSuccess && selectedItems.length === 0 && allItems.length > 0) router.replace("/cart");
  }, [loadingCart, placedOrder, orderSuccess, selectedItems.length, allItems.length, router]);

  /* ── Place order, then start payment ─────────────────────────────────── */
  const baseBlock = checkoutBlock({
    hasAddress: !!selectedAddressId,
    payment: selectedPayment,
    onlineAvailable,
    agreedToTerms,
    signedIn: !!userId,
  });
  // Phase 2 (H-3): an order is only placed for a reviewed, complete quote.
  const quoteBlock = (confirmingChange: boolean) =>
    placedOrder
      ? null
      : pendingChange && !confirmingChange
        ? "Review the updated order above."
        : !activeQuote || calcFees
          ? "Calculating your order total…"
          : !activeQuote.complete
            ? "Delivery isn’t available for every item — please review your cart."
            : needsPriceAck && !acceptedPrices
              ? "Accept the updated prices to continue."
              : null;
  const block = baseBlock ?? quoteBlock(false);

  /** Place-order button: never confirms a pending change by itself. */
  const handlePlaceOrder = () => submitOrder(false);

  const submitOrder = async (confirmingChange: boolean) => {
    setOrderError(null);
    const reason = baseBlock ?? quoteBlock(confirmingChange);
    if (reason) {
      setOrderError(reason);
      return;
    }
    if (!submitLock.current.tryAcquire()) return; // already submitting
    try {
      // The Order only needs the broad payment category; ONLINE maps to the active gateway.
      const orderPaymentMethod: PaymentMethod = selectedPayment === "COD" ? "COD" : activeGateway?.name === "EPS" ? "EPS" : "SSLCOMMERZ";
      const reviewed = activeQuote;
      const result = await submitCheckout(placedOrder, {
        // Only the reviewed quote's hash and the customer's acceptance are
        // sent — the server recomputes every amount.
        placeOrder: () =>
          placeOrder({
            userAddressId: selectedAddressId,
            paymentMethod: orderPaymentMethod,
            quoteHash: reviewed?.quoteHash ?? "",
            acknowledgePriceChanges: acceptedPrices,
          } as never).unwrap(),
        createPayment: (orderId) => createPayment({ orderId, userId: userId!, gatewayCode: selectedPayment }).unwrap(),
      });

      if (result.kind === "changed") {
        // Nothing was placed: show the fresh quote and require an explicit confirmation.
        setActiveQuote(result.quote);
        setPendingChange({ previous: reviewed, message: result.message });
        setAcceptedPrices(false);
        return;
      }
      if (result.order) setPlacedOrder(result.order);
      if (result.kind === "error") {
        setOrderError(result.message);
        return;
      }
      // The backend removed the ordered lines from the cart: refresh the cart + header count.
      dispatch(cartWishApi.util.invalidateTags([{ type: "Cart", id: "LIST" }, { type: "Cart", id: "COUNT" }, "DeliveryFees"]));
      if (result.kind === "redirect") {
        window.location.href = result.url; // the gateway's own hosted page
        return;
      }
      setOrderSuccess(result.order.orderNumber);
    } finally {
      submitLock.current.release();
    }
  };

  /** The customer explicitly confirms the fresh quote from a 409 → place it (once). */
  const handleConfirmChange = () => {
    setPendingChange(null);
    void submitOrder(true);
  };

  /* ── Screens ─────────────────────────────────────────────────────────── */
  if (orderSuccess) {
    return (
      <Shell>
        <section className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100" aria-hidden="true">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 text-[28px] tracking-tight text-stone-900">Order confirmed</h1>
          <p className="mt-2 text-sm text-stone-500">
            {selectedPayment === "COD" ? "Your order has been placed. You’ll pay when it arrives." : "Payment received — your order has been placed."}
          </p>
          <p className="mt-5 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
            Order <b className="font-semibold tabular-nums text-stone-900">#{orderSuccess}</b>
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/user-dashboard/orders" className={`${primaryBtn} h-11 px-6 text-sm`}>
              View my orders <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/" className="inline-flex h-11 items-center rounded-full px-4 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
              Continue shopping
            </Link>
          </div>
        </section>
      </Shell>
    );
  }

  const header = (
    <PageBreadcrumb
      current="Checkout"
      note={selectedItems.length > 0 ? `· ${selectedItems.length} ${selectedItems.length === 1 ? "item" : "items"} from ${groups.length} ${groups.length === 1 ? "seller" : "sellers"}` : undefined}
      action={
        <Link href="/cart" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to cart
        </Link>
      }
    />
  );

  if (!isAuthenticated) {
    return (
      <Shell>
        {header}
        <StatePanel
          icon={<MapPin className="h-7 w-7" strokeWidth={1.75} />}
          title="Sign in to check out"
          actions={
            <button type="button" onClick={() => setLoginOpen(true)} className={`${primaryBtn} h-11 px-6 text-sm`}>
              Sign in
            </button>
          }
        >
          Your cart and saved addresses are kept with your account.
        </StatePanel>
        {loginOpen && (
          <LoginModal
            isOpen
            onClose={() => setLoginOpen(false)}
            onLoginSuccess={() => {
              toast.success("Login successful!");
              setLoginOpen(false);
            }}
            message="Sign in to continue to checkout"
          />
        )}
      </Shell>
    );
  }

  if (loadingCart) {
    return (
      <Shell>
        {header}
        <CheckoutSkeleton />
      </Shell>
    );
  }

  if (cartError && !cartData) {
    const status = (cartErr as { status?: unknown } | undefined)?.status;
    return (
      <Shell>
        {header}
        <StatePanel
          tone="amber"
          icon={<AlertTriangle className="h-7 w-7" strokeWidth={1.75} />}
          title={status === 401 || status === 403 ? "Your session has expired" : "We couldn’t load your order"}
          actions={
            status === 401 || status === 403 ? (
              <button type="button" onClick={() => setLoginOpen(true)} className={`${primaryBtn} h-11 px-6 text-sm`}>
                Sign in again
              </button>
            ) : (
              <button type="button" onClick={() => void refetchCart()} className={`${primaryBtn} h-11 px-6 text-sm`}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            )
          }
        >
          Nothing has been charged. {status === 401 || status === 403 ? "Please sign in to continue." : "Please try again."}
        </StatePanel>
      </Shell>
    );
  }

  if (selectedItems.length === 0 && !placedOrder) {
    return (
      <Shell>
        {header}
        <StatePanel
          icon={<ShoppingBag className="h-7 w-7" strokeWidth={1.75} />}
          title="Nothing to check out yet"
          actions={
            <Link href={allItems.length > 0 ? "/cart" : "/products"} className={`${primaryBtn} h-11 px-6 text-sm`}>
              {allItems.length > 0 ? "Back to cart" : "Explore products"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          {allItems.length > 0 ? "Select the items you want to buy in your cart." : "Your cart is empty."}
        </StatePanel>
      </Shell>
    );
  }

  const paymentLocked = !!placedOrder; // the order exists with its payment method — only retry payment
  const deliveryText = calcFees
    ? null
    : !selectedAddressId
      ? "Select an address"
      : feesError
        ? "Couldn’t calculate"
        : quote.failed.length > 0
          ? `Unavailable for ${quote.failed.length} ${quote.failed.length === 1 ? "seller" : "sellers"}`
          : quote.complete
            ? totalDelivery === 0
              ? "Free"
              : formatBDT(totalDelivery)
            : "—";

  return (
    <Shell padBottom>
      {header}

      {placedOrder && orderError && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Order <b className="font-semibold">#{placedOrder.orderNumber}</b> has been created, but the payment didn’t start: {orderError} Use “Retry payment” to try again —
            no new order will be created.
          </p>
        </div>
      )}

      {pendingChange && activeQuote && !placedOrder && (
        <div className="mt-6">
          <CheckoutChangedPanel
            previous={pendingChange.previous}
            next={activeQuote}
            message={pendingChange.message}
            itemNames={itemNames}
            acknowledged={acceptedPrices}
            onAcknowledge={setAcceptedPrices}
            onConfirm={handleConfirmChange}
            onCancel={() => router.push("/cart")}
            busy={isSubmitting}
          />
        </div>
      )}

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          {/* 1 — Delivery address */}
          <Section step={1} title="Delivery address" subtitle={loadingAddresses ? "Loading your addresses…" : `${addresses.length} saved ${addresses.length === 1 ? "address" : "addresses"}`}
            action={
              <button type="button" onClick={() => setIsAddressModalOpen(true)} disabled={paymentLocked} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-300 px-3 text-sm font-medium text-stone-700 hover:border-teal-700 hover:text-teal-700 disabled:opacity-40">
                <Plus className="h-4 w-4" aria-hidden="true" /> Add new
              </button>
            }
          >
            {addresses.length === 0 && !loadingAddresses ? (
              <div className="rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
                No saved addresses yet.{" "}
                <button type="button" onClick={() => setIsAddressModalOpen(true)} className="font-semibold text-teal-700 hover:underline">
                  Add one
                </button>
              </div>
            ) : (
              <div role="radiogroup" aria-label="Delivery address" className="grid gap-3 sm:grid-cols-2">
                {addresses.map((addr) => {
                  const sel = addr.id === selectedAddressId;
                  const place = [addr.locations?.name, addr.locations?.city].filter(Boolean).join(", ");
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      disabled={paymentLocked}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed ${
                        sel ? "border-teal-700 bg-teal-50/50 ring-1 ring-teal-700" : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <span className={`absolute right-4 top-4 flex h-4 w-4 items-center justify-center rounded-full border ${sel ? "border-teal-700 bg-teal-700" : "border-stone-300"}`} aria-hidden="true">
                        {sel && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="flex items-center gap-2 pr-6">
                        <span className="truncate text-sm font-semibold text-stone-900">{addr.fullName}</span>
                        {addr.isDefault && <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">Default</span>}
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-stone-600">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                        {place ? `, ${place}` : ""}
                      </span>
                      <span className="mt-1 block text-xs text-stone-500">{addr.phone}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Section>

          {/* 2 — Review items */}
          {groups.length > 0 && (
            <Section step={2} title="Review items" subtitle={`${selectedItems.length} ${selectedItems.length === 1 ? "item" : "items"} from ${groups.length} ${groups.length === 1 ? "seller" : "sellers"}`}>
              <ReviewItemsTable groups={groups} quote={activeQuote} calculating={calcFees} />
            </Section>
          )}

          {/* 3 — Payment method */}
          <Section step={3} title="Payment method" subtitle={paymentLocked ? "Fixed for this order" : "Choose how you’d like to pay"}>
            <PaymentMethodPicker
              selected={selectedPayment}
              onSelect={setSelectedPayment}
              locked={paymentLocked}
              loadingGateway={loadingGateway}
              onlineAvailable={onlineAvailable}
              activeGateway={activeGateway}
            />
          </Section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-6" aria-label="Order summary">
          <div className="rounded-xl border border-stone-200 bg-white">
            <div className="p-5">
              <h2 className="text-base tracking-tight text-stone-900">Order summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label={`Subtotal · ${selectedItems.length} ${selectedItems.length === 1 ? "item" : "items"}`} value={formatBDT(subtotal)} />
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Delivery</dt>
                  <dd className="text-right font-medium tabular-nums text-stone-900">
                    {deliveryText ?? <Loader2 className="ml-auto h-4 w-4 animate-spin text-teal-700" aria-label="Calculating delivery" />}
                  </dd>
                </div>
                {feesError && !calcFees && (
                  <button type="button" onClick={() => void recalcFees()} className="-mt-1 flex w-full justify-end text-xs font-semibold text-teal-700 hover:underline">
                    Recalculate delivery
                  </button>
                )}
                <Row label="Payment" value={selectedPayment === "COD" ? "Cash on delivery" : `Online · ${gatewayName || "—"}`} />
              </dl>
              <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-stone-200 pt-4">
                <span className="text-sm font-semibold text-stone-900">Total</span>
                <span className="text-2xl font-semibold tabular-nums tracking-tight text-stone-900">{formatBDT(grandTotal)}</span>
              </div>
              {!quote.complete && !calcFees && <p className="mt-1 text-right text-xs text-stone-400">Delivery not yet included</p>}

              {needsPriceAck && !pendingChange && !placedOrder && (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900" data-fm-price-ack="">
                  <p className="font-semibold">Some prices changed since you added these items.</p>
                  <label className="mt-1.5 flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={acceptedPrices}
                      onChange={(e) => setAcceptedPrices(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-amber-400 accent-teal-700"
                    />
                    <span>I accept the updated prices shown above.</span>
                  </label>
                </div>
              )}

              <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-stone-500">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-stone-300 accent-teal-700"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms-condition" className="font-semibold text-teal-700 hover:underline">
                    Terms &amp; Conditions
                  </Link>
                  , Privacy Policy and Return Policy.
                </span>
              </label>

              {orderError && !placedOrder && (
                <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {orderError}
                </p>
              )}

              <PlaceOrderButton className="mt-5 hidden h-12 w-full text-[15px] md:flex" {...{ isSubmitting, placingOrder, block, placedOrder, selectedPayment, grandTotal, onClick: handlePlaceOrder }} />
              {block && !isSubmitting && <p className="mt-2 hidden text-center text-xs text-stone-500 md:block">{block}</p>}
            </div>
            <p className="flex items-center justify-center gap-1.5 border-t border-stone-100 px-5 py-3 text-xs text-stone-500">
              <Lock className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              Your order is confirmed only after you place it
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile action bar — above the site's 64px bottom navigation (both hidden from md). */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden" data-fm-checkout-mobilebar="">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-stone-500">Total{!quote.complete ? " · delivery pending" : ""}</p>
            <p className="truncate text-lg font-semibold tabular-nums text-stone-900">{formatBDT(grandTotal)}</p>
          </div>
          <PlaceOrderButton className="h-11 shrink-0 px-5 text-sm" compact {...{ isSubmitting, placingOrder, block, placedOrder, selectedPayment, grandTotal, onClick: handlePlaceOrder }} />
        </div>
        {block && !isSubmitting && <p className="mt-1.5 text-xs text-stone-500">{block}</p>}
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
      {loginOpen && (
        <LoginModal
          isOpen
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={() => {
            toast.success("Login successful!");
            setLoginOpen(false);
          }}
          message="Sign in to continue to checkout"
        />
      )}
    </Shell>
  );
}

/* ── pieces ────────────────────────────────────────────────────────────── */

function Shell({ children, padBottom = false }: { children: React.ReactNode; padBottom?: boolean }) {
  return (
    <div className={`min-h-[70vh] bg-stone-50 ${padBottom ? "pb-44 md:pb-16" : "pb-16"}`} data-fm-checkout="">
      <div className={`${PAGE} pt-5 md:pt-6`}>{children}</div>
    </div>
  );
}

function Section({ step, title, subtitle, action, children }: { step: number; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white" aria-labelledby={`checkout-step-${step}`}>
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white" aria-hidden="true">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`checkout-step-${step}`} className="text-[15px] tracking-tight text-stone-900">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function PlaceOrderButton(p: {
  className: string;
  compact?: boolean;
  isSubmitting: boolean;
  placingOrder: boolean;
  block: string | null;
  placedOrder: PlacedOrder | null;
  selectedPayment: GatewayCode;
  grandTotal: number;
  onClick: () => void;
}) {
  const label = p.placedOrder ? "Retry payment" : p.selectedPayment === "COD" ? "Place order" : "Place order & pay";
  return (
    <button type="button" onClick={p.onClick} disabled={p.block !== null || p.isSubmitting} aria-busy={p.isSubmitting || undefined} className={`${primaryBtn} ${p.className}`} data-fm-place-order="">
      {p.isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {p.placingOrder ? "Placing order…" : "Starting payment…"}
        </>
      ) : (
        <>
          {label}
          {!p.compact && <span className="font-normal opacity-80">· {formatBDT(p.grandTotal)}</span>}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-stone-900">{value}</dd>
    </div>
  );
}

function StatePanel({ icon, title, children, actions, tone = "teal" }: { icon: React.ReactNode; title: string; children: React.ReactNode; actions: React.ReactNode; tone?: "teal" | "amber" }) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-2 py-12 text-center sm:py-16">
      <span className={`inline-flex h-16 w-16 items-center justify-center rounded-full ring-1 ${tone === "teal" ? "bg-teal-50 text-teal-700 ring-teal-100" : "bg-amber-50 text-amber-600 ring-amber-100"}`} aria-hidden="true">
        {icon}
      </span>
      <h2 className="mt-5 text-xl tracking-tight text-stone-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{children}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
    </section>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8" role="status" aria-label="Loading checkout">
      <div className="space-y-4" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-stone-200 bg-white p-5">
            <div className="h-4 w-1/3 rounded bg-stone-200" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="h-20 rounded-lg bg-stone-100" />
              <div className="h-20 rounded-lg bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-stone-200 bg-white" aria-hidden="true" />
      <span className="sr-only">Loading checkout…</span>
    </div>
  );
}
