"use client";

// components/product/vendor/buisnessadivisordashboard/AdvisorTabs.tsx
//
// Section tabs for the Business Advisor (WAI-ARIA tabs pattern):
//   - role="tablist" / "tab" / "tabpanel", aria-selected, aria-controls;
//   - roving tabindex; ←/→ (and Home/End) move focus AND select, like most
//     dashboards (the panels are already rendered or cheap to show);
//   - each tab carries its section's accent colour on the icon and the
//     active underline; the bar scrolls sideways on narrow screens.
// Panels are mounted on first visit and then kept (hidden) so their own
// state — funnel path, product search / sort / page, journey selection and
// page — survives tab switches and nothing is refetched just by switching.

import React, { useRef } from "react";
import { ACCENT, type AccentKey } from "./AdvisorParts";

export const ADVISOR_TABS = [
  { id: "overview", label: "Overview", accent: "overview" },
  { id: "trends", label: "Traffic & trends", accent: "traffic" },
  { id: "sales", label: "Sales & payments", accent: "sales" },
  { id: "funnel", label: "Shopping funnel", accent: "funnel" },
  { id: "products", label: "Products", accent: "products" },
  { id: "journeys", label: "Customer journeys", accent: "journeys" },
  { id: "checkout", label: "Checkout insights", accent: "friction" },
  { id: "definitions", label: "Definitions", accent: "definitions" },
] as const satisfies readonly { id: string; label: string; accent: AccentKey }[];
export type AdvisorTabId = (typeof ADVISOR_TABS)[number]["id"];

export const tabDomId = (id: AdvisorTabId) => `ba-tab-${id}`;
export const panelDomId = (id: AdvisorTabId) => `ba-panel-${id}`;

export function AdvisorTabBar({ active, onSelect }: { active: AdvisorTabId; onSelect: (id: AdvisorTabId) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const move = (from: number, delta: number | "first" | "last") => {
    const n = ADVISOR_TABS.length;
    const i = delta === "first" ? 0 : delta === "last" ? n - 1 : (from + delta + n) % n;
    const id = ADVISOR_TABS[i].id;
    onSelect(id);
    refs.current[id]?.focus();
  };
  return (
    <div className="sticky top-0 z-20 -mx-1 rounded-[14px] border border-[#E5EAF2] bg-white/95 px-1 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div role="tablist" aria-label="Business Advisor sections" aria-orientation="horizontal" className="flex gap-0.5 overflow-x-auto px-1 py-1 [scrollbar-width:thin]">
        {ADVISOR_TABS.map((t, i) => {
          const selected = t.id === active;
          const a = ACCENT[t.accent];
          const Icon = a.icon;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              id={tabDomId(t.id)}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={panelDomId(t.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(t.id)}
              onKeyDown={(e) => {
                const step = ({ ArrowRight: 1, ArrowLeft: -1, Home: "first", End: "last" } as const)[e.key as "ArrowRight" | "ArrowLeft" | "Home" | "End"];
                if (step === undefined) return;
                e.preventDefault();
                move(i, step);
              }}
              className={`group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selected ? "text-slate-900" : "text-[#64748B] hover:bg-[#F7F9FD] hover:text-slate-800"
              }`}
              style={selected ? { background: a.tint, color: a.ink } : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color: selected ? a.color : undefined }} aria-hidden />
              {t.label}
              <span aria-hidden className={`absolute inset-x-2.5 -bottom-1 h-[2.5px] rounded-full transition-opacity ${selected ? "opacity-100" : "opacity-0"}`} style={{ background: a.color }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A tab panel that mounts on first visit and stays mounted (hidden) afterwards. */
export function AdvisorTabPanel({ id, active, visited, children }: { id: AdvisorTabId; active: AdvisorTabId; visited: ReadonlySet<AdvisorTabId>; children: React.ReactNode }) {
  if (!visited.has(id) && id !== active) return null;
  const selected = id === active;
  return (
    <div role="tabpanel" id={panelDomId(id)} aria-labelledby={tabDomId(id)} hidden={!selected} tabIndex={0} className="space-y-4 focus-visible:outline-none">
      {children}
    </div>
  );
}
