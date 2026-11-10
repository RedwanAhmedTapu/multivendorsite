"use client";

// components/checkout/ReviewItemsTable.tsx
//
// Checkout "Review items" as a real table (presentational; data from the
// page). One <tbody> per seller. Phase 2 (H-3): amounts come from the
// server's checkout quote (calculateDeliveryFees → the same computation order
// placement repeats): unit price = the quote line's current selling price,
// subtotal = its lineTotal, and every warehouse shipment of the seller gets
// its own delivery row (fee in the Subtotal column) — a seller shipping from
// two warehouses shows two charges. A line whose price changed since it was
// added to the cart is marked with the old → new price. Before the quote
// arrives the cart's own values are shown.
//
// Responsive: the table keeps its header and all columns at every width. Below
// ~640px it scrolls inside its own container (never the page), the Product
// column stays pinned on the left, and a hint + edge shadow show that more
// columns are available.
import { useEffect, useRef, useState } from "react";
import { ChevronsRight, Loader2, ShoppingBag, Truck } from "lucide-react";
import type { CheckoutQuote } from "@/features/cartWishApi";
import { formatBDT, lineImage, variantLabels, type VendorGroup } from "@/lib/cart/display";

export interface ReviewItemsTableProps {
  groups: VendorGroup[];
  /** The server's checkout quote; null until it has been calculated. */
  quote: CheckoutQuote | null;
  calculating: boolean;
}

const TH = "px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500";
const NUM = "text-right tabular-nums whitespace-nowrap";
/** Pinned first column (mobile scrolling); background so scrolled cells pass beneath it. */
const STICKY = "sticky left-0 z-10";

export function ReviewItemsTable({ groups, quote, calculating }: ReviewItemsTableProps) {
  const quoteLines = new Map((quote?.lines ?? []).map((l) => [l.cartItemId, l]));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ scrollable: false, atEnd: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () =>
      setOverflow({ scrollable: el.scrollWidth > el.clientWidth + 1, atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, []);

  const itemCount = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      {overflow.scrollable && (
        <p className="mb-2 flex items-center gap-1 text-xs text-stone-500" data-fm-table-hint="">
          <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
          Swipe the table to see price, quantity and subtotal
        </p>
      )}
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto overscroll-x-contain rounded-lg border border-stone-200"
          tabIndex={overflow.scrollable ? 0 : undefined}
          role={overflow.scrollable ? "region" : undefined}
          aria-label={overflow.scrollable ? "Order items table, scrollable horizontally" : undefined}
          data-fm-review-scroll=""
        >
          <table className="w-full min-w-[540px] border-collapse text-sm" data-fm-review-table="">
            <caption className="sr-only">
              {itemCount} {itemCount === 1 ? "item" : "items"} in this order, grouped by seller, with delivery per seller
            </caption>
            <thead className="bg-stone-50">
              <tr className="border-b border-stone-200">
                <th scope="col" className={`${TH} ${STICKY} bg-stone-50 text-left`}>
                  Product
                </th>
                <th scope="col" className={`${TH} text-left`}>
                  Seller
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Unit price
                </th>
                <th scope="col" className={`${TH} text-center`}>
                  Qty
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Subtotal
                </th>
              </tr>
            </thead>

            {groups.map((g) => {
              const vd = quote?.vendors.find((v) => v.vendorId === g.vendorId);
              return (
                <tbody key={g.vendorId} className="border-b border-stone-200 last:border-b-0" data-fm-seller-group={g.vendorId}>
                  {g.items.map((item, i) => {
                    const img = lineImage(item);
                    const labels = variantLabels(item);
                    const ql = quoteLines.get(item.id);
                    const unitPrice = ql ? ql.price : item.price;
                    const lineTotal = ql ? ql.lineTotal : item.itemTotal;
                    return (
                      <tr key={item.id} className="border-b border-stone-100 align-top">
                        <th scope="row" className={`${STICKY} w-[170px] min-w-[170px] bg-white px-3 py-3 text-left font-normal sm:w-[44%]`}>
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-stone-300">
                                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="line-clamp-2 font-medium leading-snug text-stone-900">{item.products?.name}</span>
                              {labels.length > 0 && <span className="mt-0.5 block text-xs text-stone-500">{labels.join(" · ")}</span>}
                              {ql?.changedSinceAdded && (
                                <span className="mt-1 block text-xs font-medium text-amber-800" data-fm-price-changed="">
                                  Price updated: {formatBDT(ql.cartPrice)} → {formatBDT(ql.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </th>
                        {i === 0 && (
                          <td rowSpan={g.items.length} className="border-x border-stone-100 bg-stone-50/40 px-3 py-3 text-stone-700">
                            <span className="block max-w-[130px] truncate font-medium" title={g.name}>
                              {g.name}
                            </span>
                            {g.items.length > 1 && <span className="mt-0.5 block text-xs text-stone-400">{g.items.length} items</span>}
                          </td>
                        )}
                        <td className={`px-3 py-3 text-stone-700 ${NUM}`}>{formatBDT(unitPrice)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-center tabular-nums text-stone-900">{item.quantity}</td>
                        <td className={`px-3 py-3 font-semibold text-stone-900 ${NUM}`}>{formatBDT(lineTotal)}</td>
                      </tr>
                    );
                  })}

                  {/* Delivery for this seller — one row per warehouse shipment
                      (fee in the Subtotal column), or one status row. */}
                  {calculating || !vd || vd.error || vd.shipments.length === 0 ? (
                    <tr className="bg-stone-50/70 text-stone-600">
                      <td colSpan={4} className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <Truck className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
                          <span>
                            {!calculating && vd?.error ? (
                              <span className="text-amber-800">Delivery unavailable — {vd.error}</span>
                            ) : (
                              <>
                                Delivery
                                <span className="text-stone-400"> · from {g.name}</span>
                              </>
                            )}
                          </span>
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 font-medium ${NUM} ${!calculating && vd?.error ? "text-amber-700" : "text-stone-900"}`}>
                        {calculating ? <Loader2 className="ml-auto h-4 w-4 animate-spin text-teal-700" aria-label="Calculating delivery" /> : "—"}
                      </td>
                    </tr>
                  ) : (
                    vd.shipments.map((s) => (
                      <tr key={s.warehouseId} className="bg-stone-50/70 text-stone-600" data-fm-shipment={s.warehouseId}>
                        <td colSpan={4} className="px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <Truck className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
                            <span>
                              {`${s.courierProvider || "Standard"} delivery`}
                              <span className="text-stone-400"> · from {s.locationName || s.warehouseName || g.name}</span>
                              <span className="text-stone-400">
                                {" "}
                                · {s.items.reduce((n, i) => n + i.quantity, 0)} {s.items.reduce((n, i) => n + i.quantity, 0) === 1 ? "unit" : "units"}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className={`px-3 py-2.5 font-medium text-stone-900 ${NUM}`}>{formatBDT(s.charge)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
        {/* Right-edge fade while more columns are hidden. */}
        {overflow.scrollable && !overflow.atEnd && (
          <div className="pointer-events-none absolute inset-y-px right-px w-8 rounded-r-lg bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
