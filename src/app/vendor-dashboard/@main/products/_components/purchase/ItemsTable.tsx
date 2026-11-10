"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

export interface PurchaseLineItem {
  rowId: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;

  qty: number | string;
  unitCost: number | string;
  mrpPrice: number | string;
  sellPrice: number | string;
  newAvgCost: number | string;
  total: number | string;

  expiry: string;
  prevStock: number | string;
  prevAvg: number | string;

  image?: string | null;
}

interface Props {
  items: PurchaseLineItem[];

  onQtyChange: (id: string, qty: number) => void;
  onCostChange: (id: string, cost: number) => void;
  onMrpPriceChange: (id: string, price: number) => void;
  onSellPriceChange: (id: string, price: number) => void;
  onExpiryChange: (id: string, expiry: string) => void;
  onRemove: (id: string) => void;

  /** Rows shown per page. Defaults to 10. Pass a different number (or let
   *  the user change it via the "rows per page" selector) to customize. */
  defaultPageSize?: number;
  /** Options offered in the "rows per page" selector. */
  pageSizeOptions?: number[];
}

// Total <th> columns this table renders — kept in one place so the
// pagination row's colSpan and the empty-state colSpan never drift apart.
const COLUMN_COUNT = 11;

/**
 * Safely convert API / Prisma / form numeric values to number.
 */
function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  if (value !== null && value !== undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function formatMoney(value: unknown): string {
  return toNumber(value).toFixed(2);
}

/**
 * ---------------------------------------------------------------
 * NUMERIC TEXT INPUTS (instead of <input type="number">)
 * ---------------------------------------------------------------
 * `type="number"` fights the user while typing decimals (e.g. "5."
 * collapses back to "5" the instant the controlled value re-renders,
 * so you can never get to "5.5"), and it also has scroll-wheel /
 * up-down-arrow side effects that silently change the value.
 *
 * Fix: render these as plain text inputs (with the right inputMode
 * so mobile shows a numeric keypad), keep the RAW STRING the user is
 * typing in local state, and only convert it to a number when we call
 * the parent's onChange callback. The parent still only ever receives
 * numbers — nothing about the external API changes.
 * ---------------------------------------------------------------
 */
type NumericField = "qty" | "unitCost" | "mrpPrice" | "sellPrice";

export default function PurchaseItemsTable({
  items,
  onQtyChange,
  onCostChange,
  onMrpPriceChange,
  onSellPriceChange,
  onExpiryChange,
  onRemove,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
}: Props) {
  // ── Pagination state ────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // ── Raw text held while the user is typing into a numeric field ────────
  // Keyed as `${rowId}:${field}` so every row/field combo is independent.
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

  // ── Which row's SKU is expanded to show the full value on click ────────
  const [expandedSku, setExpandedSku] = useState<Record<string, boolean>>({});

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Keep the current page in range whenever the item count or page size
  // changes (e.g. the last item on the last page gets removed).
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(1);
  };

  // Compact set of page numbers to render (current ± 2, always showing
  // first/last), so the control doesn't blow up with hundreds of items.
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const windowStart = Math.max(2, page - 1);
    const windowEnd = Math.min(totalPages - 1, page + 1);

    pages.push(1);
    if (windowStart > 2) pages.push("ellipsis");
    for (let p = windowStart; p <= windowEnd; p++) pages.push(p);
    if (windowEnd < totalPages - 1) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }, [page, totalPages]);

  // Read the current text to show inside a numeric input: prefer whatever
  // the user is actively typing (rawInputs), otherwise fall back to the
  // computed display value coming from props.
  const getRawValue = (
    rowId: string,
    field: NumericField,
    fallback: number | string,
  ): string => {
    const key = `${rowId}:${field}`;
    if (rawInputs[key] !== undefined) return rawInputs[key];
    return fallback === 0 || fallback === "" ? "" : String(fallback);
  };

  // Filters keystrokes to valid numeric characters, updates local text
  // state immediately (so typing "5." doesn't get wiped), and forwards a
  // parsed number to the parent callback whenever the text is a valid
  // (even if incomplete) number.
  const handleNumericInput = (
    rowId: string,
    field: NumericField,
    raw: string,
    callback: (id: string, value: number) => void,
    { integer = false, min = 0 }: { integer?: boolean; min?: number } = {},
  ) => {
    const cleaned = integer
      ? raw.replace(/[^0-9]/g, "")
      : raw
          .replace(/[^0-9.]/g, "")
          // collapse any second/third "." typed by mistake
          .replace(/(\..*)\./g, "$1");

    setRawInputs((prev) => ({ ...prev, [`${rowId}:${field}`]: cleaned }));

    // Empty or just "." — don't push a bad number up yet, wait for more input.
    if (cleaned === "" || cleaned === ".") {
      callback(rowId, min);
      return;
    }

    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      callback(
        rowId,
        integer ? Math.max(min, Math.floor(parsed)) : Math.max(min, parsed),
      );
    }
  };

  // Clears the local "typing" override once a field is committed, so the
  // input goes back to reflecting the clean prop-derived value (e.g. after
  // qty=1 min enforcement, or MRP normalization) on the next render.
  const clearRaw = (rowId: string, field: NumericField) => {
    setRawInputs((prev) => {
      if (!(`${rowId}:${field}` in prev)) return prev;
      const next = { ...prev };
      delete next[`${rowId}:${field}`];
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <tr id="empty-row">
        <td
          colSpan={COLUMN_COUNT}
          className="text-center py-7 text-[#9B9890] text-[13px]"
        >
          No items — click <strong>Add Product</strong> or press{" "}
          <kbd className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">
            F2
          </kbd>
        </td>
      </tr>
    );
  }

  return (
    <>
      {paginatedItems.map((item, i) => {
        const idx = startIndex + i; // global row number across all pages

        /*
         * ---------------------------------------------------------
         * Normalize all numeric values.
         *
         * This protects against:
         * - API strings
         * - Prisma Decimal serialization
         * - null / undefined
         * - NaN / Infinity
         * ---------------------------------------------------------
         */
        const qty = Math.max(1, toNumber(item.qty, 1));

        const unitCost = Math.max(
          0,
          toNumber(item.unitCost),
        );

        const mrpPrice = Math.max(
          0,
          toNumber(item.mrpPrice),
        );

        const sellPrice = Math.max(
          0,
          toNumber(item.sellPrice),
        );

        const newAvgCost = Math.max(
          0,
          toNumber(item.newAvgCost),
        );

        // 👇 FIX: normalize prevAvg (existing/current avg cost from API,
        // e.g. variant.avgCost) so it can be shown BEFORE unit cost is typed.
        const prevAvg = Math.max(
          0,
          toNumber(item.prevAvg),
        );

        const total = Math.max(
          0,
          toNumber(item.total),
        );

        /*
         * ---------------------------------------------------------
         * Business validations
         * ---------------------------------------------------------
         */

        const isBelowAvg =
          sellPrice > 0 &&
          newAvgCost > 0 &&
          sellPrice < newAvgCost;

        const isAboveMrp =
          mrpPrice > 0 &&
          sellPrice > 0 &&
          sellPrice > mrpPrice;

        const hasSellPriceWarning =
          isAboveMrp || isBelowAvg;

        /*
         * Input display values.
         */
        const qtyInputValue =
          Number.isFinite(qty) && qty > 0 ? qty : 1;

        const unitCostInputValue =
          unitCost > 0 ? unitCost : "";

        const mrpPriceInputValue =
          mrpPrice > 0 ? mrpPrice : "";

        const sellPriceInputValue =
          sellPrice > 0 ? sellPrice : "";

        const isSkuExpanded = !!expandedSku[item.rowId];

        return (
          <tr
            key={item.rowId}
            className="border-b border-slate-50 hover:bg-blue-50/30 group transition-colors"
          >
            {/* =====================================================
                #
            ====================================================== */}
            <td className="px-3 py-2.5 text-[#9B9890] text-[11.5px] text-center align-middle">
              {idx + 1}
            </td>

            {/* =====================================================
                PRODUCT / VARIANT
                Shortened truncation (fewer characters shown). Full
                name is still available on hover via title.
            ====================================================== */}
            <td
              className="px-3 py-2.5 align-middle"
              style={{ minWidth: 150 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName || "Product"}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-[13px]">
                      📦
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div
                    className="text-xs font-semibold text-slate-700 truncate max-w-[90px]"
                    title={item.productName || "Unnamed Product"}
                  >
                    {item.productName || "Unnamed Product"}
                  </div>

                  <div
                    className="text-[11px] text-slate-400 truncate max-w-[90px]"
                    title={item.variantName || "Default Variant"}
                  >
                    {item.variantName || "Default Variant"}
                  </div>
                </div>
              </div>
            </td>

            {/* =====================================================
                SKU
                Shown truncated by default; click to expand and see
                the full SKU (click again / click elsewhere to
                collapse back).
            ====================================================== */}
            <td
              className="px-2 py-2.5 align-middle"
              style={{ minWidth: 80 }}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedSku((prev) => ({
                    ...prev,
                    [item.rowId]: !prev[item.rowId],
                  }))
                }
                title={isSkuExpanded ? "Click to collapse" : item.sku || "—"}
                className={`font-mono text-[11.5px] text-[#1A4F7A] bg-slate-50 hover:bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer text-left ${
                  isSkuExpanded
                    ? "whitespace-normal break-all max-w-[140px]"
                    : "whitespace-nowrap truncate max-w-[70px] inline-block align-middle"
                }`}
              >
                {item.sku || "—"}
              </button>
            </td>

            {/* =====================================================
                QTY (bigger field, text input converted to number)
            ====================================================== */}
            <td
              className="px-2 py-2.5 align-middle"
              style={{
                minWidth: 100,
                width: 100,
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={getRawValue(item.rowId, "qty", qtyInputValue)}
                onChange={(e) =>
                  handleNumericInput(
                    item.rowId,
                    "qty",
                    e.target.value,
                    onQtyChange,
                    { integer: true, min: 1 },
                  )
                }
                onBlur={() => clearRaw(item.rowId, "qty")}
                className="w-full bg-white border border-cyan-100 rounded-lg px-3 py-3 text-[15px] font-semibold text-center text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 transition-all"
              />
            </td>

            {/* =====================================================
                UNIT COST
            ====================================================== */}
            <td
              className="px-2 py-2.5 align-middle"
              style={{
                minWidth: 105,
                width: 105,
              }}
            >
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={getRawValue(item.rowId, "unitCost", unitCostInputValue)}
                onChange={(e) =>
                  handleNumericInput(
                    item.rowId,
                    "unitCost",
                    e.target.value,
                    onCostChange,
                    { min: 0 },
                  )
                }
                onBlur={() => clearRaw(item.rowId, "unitCost")}
                className="w-full bg-white border border-cyan-100 rounded-lg px-2 py-2 text-[13px] text-right text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 transition-all"
              />
            </td>

            {/* =====================================================
                MRP PRICE
            ====================================================== */}
            <td
              className="px-2 py-2.5 align-middle"
              style={{
                minWidth: 105,
                width: 105,
              }}
            >
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={getRawValue(item.rowId, "mrpPrice", mrpPriceInputValue)}
                onChange={(e) =>
                  handleNumericInput(
                    item.rowId,
                    "mrpPrice",
                    e.target.value,
                    onMrpPriceChange,
                    { min: 0 },
                  )
                }
                onBlur={() => clearRaw(item.rowId, "mrpPrice")}
                title="Regular / MRP price shown on product page"
                className="w-full bg-white border border-cyan-100 rounded-lg px-2 py-2 text-[13px] text-right text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 transition-all"
              />
            </td>

            {/* =====================================================
                SELL PRICE
            ====================================================== */}
            <td
              className="px-2 py-2.5 align-middle"
              style={{
                minWidth: 105,
                width: 105,
              }}
            >
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={getRawValue(item.rowId, "sellPrice", sellPriceInputValue)}
                onChange={(e) =>
                  handleNumericInput(
                    item.rowId,
                    "sellPrice",
                    e.target.value,
                    onSellPriceChange,
                    { min: 0 },
                  )
                }
                onBlur={() => clearRaw(item.rowId, "sellPrice")}
                title={
                  isAboveMrp
                    ? `⚠ Sell price above MRP (${formatMoney(
                        mrpPrice,
                      )})`
                    : isBelowAvg
                    ? `⚠ Below avg cost (${formatMoney(
                        newAvgCost,
                      )})`
                    : "Actual selling price (specialPrice)"
                }
                className={`w-full border rounded-lg px-2 py-2 text-[13px] text-right focus:ring-1 transition-all outline-none ${
                  hasSellPriceWarning
                    ? "border-[#C0392B] bg-[#FDF0EE] focus:border-[#C0392B] focus:ring-rose-100"
                    : "border-cyan-100 bg-white focus:border-cyan-400 focus:ring-cyan-100"
                }`}
              />

              {/* Warning indicator */}
              {hasSellPriceWarning && (
                <div className="flex items-center gap-1 mt-1 text-[9px] font-semibold text-[#C0392B]">
                  <AlertTriangle size={10} />

                  {isAboveMrp
                    ? "Above MRP"
                    : "Below Avg Cost"}
                </div>
              )}
            </td>

            {/* =====================================================
                NEW AVG COST
                FIX: previously this column only checked `unitCost > 0`
                and only ever rendered `newAvgCost`. Since `newAvgCost`
                starts at 0 until the user types a unit cost, the column
                showed "—" even though the API already returned an
                existing avgCost (item.prevAvg) for the variant.

                Now:
                  - unitCost typed (> 0)  -> show calculated newAvgCost
                    (the weighted average AFTER this purchase)
                  - unitCost not typed    -> show existing prevAvg
                    (the CURRENT avgCost from the variant, e.g. 49.3182)
                  - neither available     -> show "—"
            ====================================================== */}
            <td
              className="px-2 py-2.5 align-middle"
              style={{
                minWidth: 95,
                width: 95,
              }}
            >
              {unitCost > 0 ? (
                <div
                  title={`Weighted average cost after this purchase: ${formatMoney(
                    newAvgCost,
                  )}`}
                  className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-2 rounded-lg text-[11px] font-mono font-semibold text-center cursor-help whitespace-nowrap"
                >
                  {formatMoney(newAvgCost)}
                </div>
              ) : prevAvg > 0 ? (
                <div
                  title={`Current avg cost (before this purchase): ${formatMoney(
                    prevAvg,
                  )}`}
                  className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-2 rounded-lg text-[11px] font-mono font-semibold text-center cursor-help whitespace-nowrap"
                >
                  {formatMoney(prevAvg)}
                </div>
              ) : (
                <span className="text-[#9B9890] text-[12px] ml-1">
                  —
                </span>
              )}
            </td>

            {/* =====================================================
                EXPIRY
            ====================================================== */}
            <td
              className="px-2 py-2.5 align-middle"
              style={{
                minWidth: 135,
                width: 135,
              }}
            >
              <input
                type="date"
                value={item.expiry || ""}
                onChange={(e) =>
                  onExpiryChange(
                    item.rowId,
                    e.target.value,
                  )
                }
                className="w-full bg-white border border-cyan-100 rounded-lg px-2 py-2 text-[12.5px] text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 transition-all"
              />
            </td>

            {/* =====================================================
                TOTAL
            ====================================================== */}
            <td
              className="px-2 py-2.5 text-right align-middle"
              style={{
                minWidth: 100,
                width: 100,
              }}
            >
              <span className="text-sm font-bold text-slate-700 font-mono whitespace-nowrap">
                {formatMoney(total)}
              </span>
            </td>

            {/* =====================================================
                REMOVE
            ====================================================== */}
            <td className="px-2 py-2.5 w-10 text-center align-middle">
              <button
                type="button"
                onClick={() =>
                  onRemove(item.rowId)
                }
                aria-label={`Remove ${
                  item.productName || "product"
                }`}
                title="Remove item"
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-60 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        );
      })}

      {/* =====================================================
          PAGINATION ROW
          Spans all columns; sits as the last <tr> inside <tbody>.
          Shows "X–Y of Z", a rows-per-page selector (default 10,
          customizable via pageSizeOptions), and Prev/Next + page
          number controls. Hidden entirely when everything fits on
          one page and page size is untouched, to keep the table
          clean for small item counts — but the selector remains so
          users can still change it if needed.
      ====================================================== */}
      <tr>
        <td colSpan={COLUMN_COUNT} className="px-3 py-3 bg-slate-50/60 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left: showing X–Y of Z + rows-per-page */}
            <div className="flex items-center gap-3 text-[11.5px] text-slate-500">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-600">
                  {totalItems === 0 ? 0 : startIndex + 1}
                </span>
                –
                <span className="font-semibold text-slate-600">
                  {endIndex}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-600">
                  {totalItems}
                </span>{" "}
                items
              </span>

              <label className="flex items-center gap-1.5">
                <span className="text-slate-400">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) =>
                    handlePageSizeChange(Number(e.target.value))
                  }
                  className="bg-white border border-cyan-100 rounded-lg px-1.5 py-1 text-[11.5px] text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 cursor-pointer"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Right: prev / page numbers / next */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-cyan-50 hover:border-cyan-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                >
                  <ChevronLeft size={14} />
                </button>

                {pageNumbers.map((p, i) =>
                  p === "ellipsis" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="w-7 h-7 flex items-center justify-center text-[11px] text-slate-300"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={p === page ? "page" : undefined}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11.5px] font-semibold transition-all ${
                        p === page
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm shadow-blue-200"
                          : "border border-slate-200 bg-white text-slate-500 hover:bg-cyan-50 hover:border-cyan-200"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-cyan-50 hover:border-cyan-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}