// Shared loading placeholders for the admin dashboard.
// Skeletons mirror the real chrome — white rounded-2xl panels, slate-200
// borders, 44px table rows and indigo-accented stat cards — so the layout
// does not jump when data arrives.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

/** Base shimmer bar. `soft` for body copy, default for headings/values. */
export function Sk({ className, soft }: { className?: string; soft?: boolean }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md", soft ? "bg-slate-100" : "bg-slate-200/70", className)} />;
}

/** Page wrapper matching the admin content column. */
export function PageSkeleton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div aria-busy="true" aria-label="Loading" className={cn("mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6", className)}>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/** Eyebrow + title + subtitle + actions, optionally followed by tab links. */
export function HeaderSkeleton({ actions = 1, tabs = 0, eyebrow = true }: { actions?: number; tabs?: number; eyebrow?: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          {eyebrow && <Sk className="h-2.5 w-40" />}
          <Sk className="h-7 w-56 max-w-full" />
          <Sk soft className="h-3.5 w-80 max-w-full" />
        </div>
        {actions > 0 && (
          <div className="flex gap-2">
            {Array.from({ length: actions }).map((_, i) => (
              <Sk key={i} className="h-9 w-28 rounded-lg" />
            ))}
          </div>
        )}
      </div>
      {tabs > 0 && <TabsSkeleton count={tabs} />}
    </div>
  );
}

/** Bottom-border tab strip. */
export function TabsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden className="flex gap-1 overflow-hidden border-b border-slate-200">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center border-b-2 border-transparent px-3.5 py-2.5">
          <Sk className={cn("h-3.5", i === 0 ? "w-16 bg-indigo-200/70" : "w-14")} />
        </div>
      ))}
    </div>
  );
}

/** Status pills + search field, as seen above list panels. */
export function FiltersSkeleton({ pills = 5, search = true }: { pills?: number; search?: boolean }) {
  return (
    <div aria-hidden className="flex flex-wrap items-center gap-2">
      {Array.from({ length: pills }).map((_, i) => (
        <Sk key={i} className="h-8 w-24 rounded-full" />
      ))}
      {search && <Sk className="ml-auto h-10 w-full rounded-lg sm:w-72" />}
    </div>
  );
}

/** Row of KPI cards with icon tile. */
export function StatsSkeleton({ count = 4, cols = "sm:grid-cols-2 xl:grid-cols-4" }: { count?: number; cols?: string }) {
  return (
    <div aria-hidden className={cn("grid grid-cols-1 gap-2.5", cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(CARD, "p-4")}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Sk className="h-2.5 w-20" />
              <Sk className="h-6 w-28" />
            </div>
            <Sk className="h-9 w-9 rounded-lg bg-indigo-50" />
          </div>
          <Sk soft className="mt-3 h-2.5 w-32" />
        </div>
      ))}
    </div>
  );
}

const COL_W = ["w-36", "w-20", "w-24", "w-16", "w-24", "w-20", "w-24", "w-16"];

/**
 * Table placeholder. Renders bare rows so it can drop inside an existing
 * Panel; all cell content is generic widths to keep the rhythm of real rows.
 */
export function TableSkeleton({ rows = 6, cols = 6, head = true }: { rows?: number; cols?: number; head?: boolean }) {
  return (
    <div aria-hidden className="overflow-hidden">
      {head && (
        <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="flex-1">
              <Sk className="h-2.5 w-16" />
            </div>
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
          <Sk soft className="h-8 w-8 shrink-0 rounded-md" />
          {Array.from({ length: Math.max(cols - 1, 1) }).map((_, c) => (
            <div key={c} className="flex-1">
              <Sk soft className={cn("h-3.5", COL_W[(c + r) % COL_W.length])} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Full white panel: optional title bar, table rows and pagination strip. */
export function PanelSkeleton({
  rows = 6,
  cols = 6,
  title = true,
  footer = false,
  head = true,
  children,
}: {
  rows?: number;
  cols?: number;
  title?: boolean;
  footer?: boolean;
  head?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={cn(CARD, "overflow-hidden")}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="space-y-2">
            <Sk className="h-4 w-32" />
            <Sk soft className="h-2.5 w-48" />
          </div>
          <Sk className="h-8 w-24 rounded-lg" />
        </div>
      )}
      {children ?? <TableSkeleton rows={rows} cols={cols} head={head} />}
      {footer && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <Sk soft className="h-2.5 w-28" />
          <div className="flex gap-2">
            <Sk className="h-7 w-20 rounded-md" />
            <Sk className="h-7 w-16 rounded-md" />
          </div>
        </div>
      )}
    </section>
  );
}

/** Grid of equal cards (themes, campaigns, offers, media). */
export function CardsSkeleton({
  count = 6,
  height = "h-44",
  cols = "sm:grid-cols-2 xl:grid-cols-3",
}: {
  count?: number;
  height?: string;
  cols?: string;
}) {
  return (
    <div aria-hidden className={cn("grid grid-cols-1 gap-3", cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(CARD, "overflow-hidden")}>
          <Sk className={cn("w-full rounded-none", height)} />
          <div className="space-y-2 p-4">
            <Sk className="h-3.5 w-36" />
            <Sk soft className="h-2.5 w-52 max-w-full" />
            <div className="flex items-center justify-between pt-1">
              <Sk soft className="h-2.5 w-20" />
              <Sk className="h-7 w-16 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Card with labelled inputs; `sections` stacks groups of `fields`. */
export function FormSkeleton({
  sections = 2,
  fields = 4,
  cols = "sm:grid-cols-2",
  footer = true,
}: {
  sections?: number;
  fields?: number;
  cols?: string;
  footer?: boolean;
}) {
  return (
    <div aria-hidden className={cn(CARD, "overflow-hidden")}>
      <div className="space-y-2 border-b border-slate-100 px-5 py-4">
        <Sk className="h-4 w-40" />
        <Sk soft className="h-2.5 w-64 max-w-full" />
      </div>
      <div className="space-y-6 p-5">
        {Array.from({ length: sections }).map((_, s) => (
          <div key={s} className="space-y-4">
            <Sk className="h-3 w-28" />
            <div className={cn("grid grid-cols-1 gap-4", cols)}>
              {Array.from({ length: fields }).map((_, f) => (
                <div key={f} className="space-y-1.5">
                  <Sk soft className="h-2.5 w-20" />
                  <Sk className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <Sk className="h-9 w-24 rounded-lg" />
          <Sk className="h-9 w-32 rounded-lg bg-indigo-200/70" />
        </div>
      )}
    </div>
  );
}

/** Detail page: header, KPIs, a wide panel and a side panel. */
export function DetailSkeleton({ stats = 4 }: { stats?: number }) {
  return (
    <>
      <HeaderSkeleton actions={2} />
      {stats > 0 && <StatsSkeleton count={stats} />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelSkeleton rows={7} cols={5} />
        </div>
        <PanelSkeleton rows={5} cols={3} title />
      </div>
    </>
  );
}

/** Compact placeholder for a drawer/modal body. */
export function ModalSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden className="space-y-5">
      <div className="flex items-center gap-3">
        <Sk soft className="h-11 w-11 rounded-full" />
        <div className="space-y-2">
          <Sk className="h-4 w-40" />
          <Sk soft className="h-2.5 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <Sk soft className="h-2.5 w-16" />
            <Sk className="h-3.5 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Sk soft className="h-2.5 w-full" />
        <Sk soft className="h-2.5 w-11/12" />
        <Sk soft className="h-2.5 w-3/4" />
      </div>
    </div>
  );
}

/** Admin sidebar rail placeholder. */
export function SidebarSkeleton() {
  return (
    <div aria-hidden className="flex h-full w-64 flex-col border-r border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2.5 px-2 py-2">
        <Sk className="h-9 w-9 rounded-lg bg-indigo-100" />
        <div className="space-y-1.5">
          <Sk className="h-3.5 w-24" />
          <Sk soft className="h-2.5 w-16" />
        </div>
      </div>
      <div className="mt-6 space-y-5">
        {Array.from({ length: 6 }).map((_, g) => (
          <div key={g} className="space-y-2.5">
            <Sk soft className="h-2 w-16" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                <Sk soft className="h-4 w-4 rounded" />
                <Sk soft className={cn("h-3", COL_W[(g + i) % COL_W.length])} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** App-level fallback: sidebar rail + generic page content. */
export function ShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5ff]">
      <div className="hidden lg:block">
        <SidebarSkeleton />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="p-3 sm:p-4">
          <div className="rounded-xl bg-[#f8fafc] p-3 sm:p-5 lg:p-6">
            <div className="mb-3 flex items-center justify-between">
              <Sk soft className="h-3 w-40" />
              <Sk soft className="h-3 w-24" />
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <Sk className="h-9 w-9 rounded-lg bg-indigo-50" />
                  <div className="space-y-2">
                    <Sk className="h-4 w-40" />
                    <Sk soft className="h-2.5 w-64 max-w-full" />
                  </div>
                </div>
              </div>
              <StatsSkeleton />
              <PanelSkeleton rows={8} cols={6} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Default generic page: header, filters, KPIs and a table. */
export function AdminPageSkeleton({ stats = 4, rows = 8 }: { stats?: number; rows?: number }) {
  return (
    <PageSkeleton>
      <HeaderSkeleton actions={2} />
      <FiltersSkeleton />
      {stats > 0 && <StatsSkeleton count={stats} />}
      <PanelSkeleton rows={rows} cols={7} footer />
    </PageSkeleton>
  );
}
