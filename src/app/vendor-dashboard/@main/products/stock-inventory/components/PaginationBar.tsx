"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "../constants";
import { buildPageWindow } from "../utils";

export function PaginationBar({
  page,
  pages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);
  const items = buildPageWindow(page, pages);

  const pageBtn = (active: boolean) =>
    `min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all ${
      active
        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm shadow-blue-200"
        : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
    }`;

  const navBtn =
    "w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-cyan-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 transition-colors";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-t border-blue-50 bg-gradient-to-r from-blue-50/40 to-cyan-50/30">
      <div className="flex items-center gap-3 text-xs text-slate-500 order-2 sm:order-1">
        <span>
          Showing <b className="text-slate-700">{start}–{end}</b> of <b className="text-slate-700">{total}</b>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 hidden sm:inline">Rows:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value))}
            className="bg-white border border-cyan-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-1 order-1 sm:order-2 self-end sm:self-auto">
          <button onClick={() => onPageChange(1)} disabled={page === 1} className={navBtn} aria-label="First page">
            <ChevronsLeft size={13} />
          </button>
          <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className={navBtn} aria-label="Previous page">
            <ChevronLeft size={13} />
          </button>

          <div className="flex items-center gap-1 mx-1">
            {items.map((it, i) =>
              it === "…" ? (
                <span key={`e-${i}`} className="w-6 text-center text-slate-300 text-xs">
                  …
                </span>
              ) : (
                <button key={it} onClick={() => onPageChange(it)} className={pageBtn(it === page)}>
                  {it}
                </button>
              )
            )}
          </div>

          <button onClick={() => onPageChange(page + 1)} disabled={page === pages} className={navBtn} aria-label="Next page">
            <ChevronRight size={13} />
          </button>
          <button onClick={() => onPageChange(pages)} disabled={page === pages} className={navBtn} aria-label="Last page">
            <ChevronsRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
