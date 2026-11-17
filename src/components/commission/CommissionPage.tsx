"use client";

// Admin › Commission — one page, four compact tabs. The active tab lives in
// the URL and every tab stays mounted, so switching tabs never loses state.
import { Suspense, useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Building2, Globe2, LayoutDashboard, Percent } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { PanelSkeleton, Sk, StatsSkeleton } from "@/components/admin/ui/AdminSkeletons";
import OverviewTab from "@/components/commission/OverviewTab";
import GlobalTab from "@/components/commission/GlobalTab";
import VendorSpecificTab from "@/components/commission/VendorSpecificTab";
import BadgeWiseTab from "@/components/commission/BadgeWiseTab";

const TABS = ["overview", "global", "vendor", "badge"] as const;
type TabKey = (typeof TABS)[number];

const TAB_META: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <LayoutDashboard size={13} /> },
  { key: "global", label: "Global", icon: <Globe2 size={13} /> },
  { key: "vendor", label: "Vendor Specific", icon: <Building2 size={13} /> },
  { key: "badge", label: "Badge Wise", icon: <BadgeCheck size={13} /> },
];

function CommissionSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading commission" className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Sk className="h-9 w-9 rounded-xl" />
        <div className="space-y-1.5">
          <Sk className="h-4 w-28" />
          <Sk className="h-2.5 w-72 max-w-full" />
        </div>
        <div className="ml-auto flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5">
          {[0, 1, 2, 3].map((i) => (
            <Sk key={i} className={i === 0 ? "h-6 w-20 rounded-lg bg-indigo-100" : "h-6 w-24 rounded-lg"} />
          ))}
        </div>
      </div>
      <StatsSkeleton count={4} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <PanelSkeleton rows={6} cols={5} />
        <PanelSkeleton rows={5} cols={1} head={false} />
      </div>
    </div>
  );
}

export default function CommissionPage() {
  return (
    <Suspense fallback={<CommissionSkeleton />}>
      <CommissionShell />
    </Suspense>
  );
}

function CommissionShell() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("tab") as TabKey | null;
  const active: TabKey = raw && TABS.includes(raw) ? raw : "overview";
  const { can, isLoading, isOwner } = usePermissions();
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set<TabKey>([active]));

  const go = useCallback(
    (tab: TabKey) => {
      setVisited((prev) => {
        const next = new Set(prev);
        next.add(tab);
        return next;
      });
      router.replace(`${pathname}?tab=${tab}`, { scroll: false });
    },
    [router, pathname],
  );

  if (isLoading) return <CommissionSkeleton />;
  if (!can("orderManagement")) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        The commission module is available to administrators and staff with order management access.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Percent size={17} />
        </span>
        <div>
          <h1 className="text-base font-extrabold leading-tight text-slate-900">Commission</h1>
          <p className="text-[11px] text-slate-500">
            Platform rates in percent — global, per vendor and badge-wise. Every change is appended to history.
          </p>
        </div>
        <nav className="ml-auto flex flex-wrap items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5">
          {TAB_META.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => go(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                active === tab.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {!isOwner && (
        <p className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-500">
          Read-only: rate changes are restricted to platform administrators; saving a change here will be rejected by the server.
        </p>
      )}

      <div className={active === "overview" ? "" : "hidden"}>
        <OverviewTab />
      </div>
      <div className={active === "global" ? "" : "hidden"}>{visited.has("global") && <GlobalTab />}</div>
      <div className={active === "vendor" ? "" : "hidden"}>{visited.has("vendor") && <VendorSpecificTab />}</div>
      <div className={active === "badge" ? "" : "hidden"}>{visited.has("badge") && <BadgeWiseTab />}</div>
    </div>
  );
}
