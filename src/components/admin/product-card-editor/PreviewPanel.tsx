"use client";

// components/admin/product-card-editor/PreviewPanel.tsx
//
// Live preview: the REAL listing grid (ProductListingGrid — the component
// /category/[slug] and /products render) filled with the REAL SharedProductCard,
// inside a frame as wide as the listing grid at the chosen screen size.
//   - A nested ProductCardConfigProvider carries the editor's unsaved config;
//     previewConfigFor() / previewGridFor() pin every responsive value to the
//     chosen breakpoint (the CSS switches by viewport width, not by frame).
//   - A frame wider than the panel is scaled down (CSS zoom) — layout is
//     still computed at the real width, so the column count is the real one.
//   - The rendered column count is read back from the grid itself and shown
//     next to the selected maximum.
//   - Cards run in preview mode: links are swallowed and the cart button
//     never calls the cart API.
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { SharedProductCard } from "@/components/product/card/SharedProductCard";
import { ProductCardConfigProvider } from "@/components/product/card/ProductCardConfigProvider";
import { ProductListingGrid } from "@/components/product/card/ProductListingGrid";
import type { ProductCardConfig } from "@/lib/product-card/config";
import { previewConfigFor, type Breakpoint } from "@/lib/product-card/editor";
import {
  BUILT_IN_GRID_AT_PREVIEW,
  LISTING_CONTENT_WIDTH,
  previewGridFor,
  renderedColumnRange,
  renderedColumns,
} from "@/lib/product-card/grid";
import { SAMPLE_PRODUCTS } from "./sampleProducts";

const BP_OPTIONS: { value: Breakpoint; label: string; Icon: typeof Monitor }[] = [
  { value: "mobile", label: "Mobile", Icon: Smartphone },
  { value: "tablet", label: "Tablet", Icon: Tablet },
  { value: "desktop", label: "Desktop", Icon: Monitor },
];

export function BreakpointToggle({ value, onChange }: { value: Breakpoint; onChange: (bp: Breakpoint) => void }) {
  return (
    <div role="radiogroup" aria-label="Preview size" className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {BP_OPTIONS.map(({ value: bp, label, Icon }) => (
        <button
          key={bp}
          type="button"
          role="radio"
          aria-checked={value === bp}
          onClick={() => onChange(bp)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === bp ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

/** Screen width each preview frame represents (its grid width is LISTING_CONTENT_WIDTH[bp].preview). */
const PREVIEW_SCREEN: Record<Breakpoint, number> = { mobile: 375, tablet: 768, desktop: 1440 };

const swallowClicks = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest("a")) e.preventDefault();
};

/** What the preview shows for a config at a breakpoint (pure; unit tested). */
export function previewLayout(config: ProductCardConfig, bp: Breakpoint) {
  const custom = config.grid ?? null;
  const source = custom ?? BUILT_IN_GRID_AT_PREVIEW;
  const pinned = previewGridFor(source, bp);
  const width = LISTING_CONTENT_WIDTH[bp].preview;
  const selected = source.columns[bp];
  const rendered = custom ? renderedColumns(selected, width, source.gapX[bp], bp) : selected;
  return {
    custom: custom !== null,
    grid: pinned.grid,
    minCardWidth: custom ? pinned.minCardWidth : 0,
    width,
    selected,
    rendered,
    range: custom ? renderedColumnRange(custom, bp) : null,
    cardCount: Math.max(SAMPLE_PRODUCTS.length, rendered * 2),
  };
}

export function PreviewPanel({ config, breakpoint }: { config: ProductCardConfig; breakpoint: Breakpoint }) {
  const previewConfig = useMemo(() => previewConfigFor(config, breakpoint), [config, breakpoint]);
  const layout = useMemo(() => previewLayout(config, breakpoint), [config, breakpoint]);

  // Scale the frame to the panel width (layout stays at the real width).
  const hostRef = useRef<HTMLDivElement>(null);
  const gridHostRef = useRef<HTMLDivElement>(null);
  const [hostWidth, setHostWidth] = useState<number | null>(null);
  const [measuredCols, setMeasuredCols] = useState<number | null>(null);
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setHostWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const grid = gridHostRef.current?.firstElementChild as HTMLElement | null;
    if (!grid) return;
    const tracks = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
    setMeasuredCols(tracks || null);
  }, [layout, previewConfig, hostWidth]);
  const scale = hostWidth ? Math.min(1, hostWidth / layout.width) : 1;

  const cards = Array.from({ length: layout.cardCount }, (_, i) => {
    const sample = SAMPLE_PRODUCTS[i % SAMPLE_PRODUCTS.length];
    return { key: `${sample.product.id}-${i}`, ...sample };
  });
  const screen = LISTING_CONTENT_WIDTH[breakpoint];
  const shown = measuredCols ?? layout.rendered;

  return (
    <div>
      <div className="mb-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600" data-fm-grid-readout="">
        {layout.custom ? (
          <>
            <span className="font-semibold text-gray-800">Custom grid:</span> up to <b>{layout.selected}</b> per row selected ·{" "}
            <b>{shown}</b> shown here ({layout.width}px grid at a {PREVIEW_SCREEN[breakpoint]}px screen)
            {layout.range && breakpoint !== "mobile" && (
              <>
                {" "}· {layout.range.min === layout.range.max ? layout.range.min : `${layout.range.min}–${layout.range.max}`} on {screen.screenMin}–
                {screen.screenMax}px screens
              </>
            )}
            {breakpoint !== "mobile" && shown < layout.selected && (
              <span className="mt-1 block text-amber-700">
                Fewer columns than selected: cards would be narrower than 130px, so columns are dropped to keep them readable.
              </span>
            )}
          </>
        ) : (
          <>
            <span className="font-semibold text-gray-800">Built-in grid</span> (no custom grid): <b>{shown}</b> per row at this size — the
            current layout of category pages and All Products.
          </>
        )}
      </div>

      <div ref={hostRef} className="w-full overflow-hidden" data-fm-card-preview={breakpoint} onClickCapture={swallowClicks}>
        <div
          className="rounded-md border border-dashed border-gray-300 bg-white p-0"
          style={{ width: layout.width, zoom: scale }}
          data-fm-preview-frame=""
        >
          <ProductCardConfigProvider config={previewConfig}>
            <div ref={gridHostRef}>
              <ProductListingGrid grid={layout.grid} minCardWidth={layout.minCardWidth}>
                {cards.map(({ key, product }) => (
                  <SharedProductCard key={key} product={product} imageSizes={`${Math.ceil(layout.width / Math.max(1, layout.rendered))}px`} preview />
                ))}
              </ProductListingGrid>
            </div>
          </ProductCardConfigProvider>
        </div>
      </div>
      {scale < 1 && <p className="mt-1.5 text-[11px] text-gray-400">Scaled to {Math.round(scale * 100)}% to fit — layout is computed at the real width.</p>}
    </div>
  );
}
