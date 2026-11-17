"use client";

// Admin › Subscriptions: dynamic plans, features, billing cycles, vendor
// subscriptions, special offers, transactions, reports and settings.
// ADMIN only (the backend enforces it too). POS subscriptions keep their own
// page; a plan that includes the "pos" feature also opens the POS.

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CreditCard, Gift, LayoutDashboard, Layers, Puzzle, Receipt, Repeat, Settings, Sparkles, Store } from "lucide-react";
import { useGetMeQuery } from "@/features/authApi";
import { useSubsOverviewQuery } from "@/features/billingApi";
import { Card } from "@/components/billing/ui";
import { PanelSkeleton, Sk } from "@/components/admin/ui/AdminSkeletons";
import { OverviewSection, ReportsSection, SettingsSection } from "@/components/admin-subscriptions/OverviewSections";
import { CyclesSection, FeaturesSection, PlansSection } from "@/components/admin-subscriptions/CatalogueSections";
import { OffersSection, TransactionsSection, VendorsSection } from "@/components/admin-subscriptions/VendorSections";

const SECTIONS = ["overview", "plans", "features", "cycles", "vendors", "offers", "transactions", "reports", "settings"] as const;
type Section = (typeof SECTIONS)[number];

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const PAGE = "min-h-full rounded-xl bg-[#f8fafc] p-3 sm:p-4 lg:p-5";

function SubscriptionsSkeleton() {
  return (
    <div className={PAGE}>
      <div aria-busy="true" aria-label="Loading subscriptions">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Sk className="h-9 w-9 rounded-xl bg-indigo-200/70" />
          <div className="space-y-1.5">
            <Sk className="h-4 w-40" />
            <Sk soft className="h-2.5 w-64 max-w-full" />
          </div>
          <Sk className="ml-auto h-8 w-36 rounded-lg" />
        </div>
        <div className="mb-4 flex gap-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <Sk key={i} className={cx("h-7 shrink-0 rounded-lg", i === 0 ? "w-24 bg-slate-300/70" : "w-20 bg-slate-100")} />
          ))}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2">
                    <Sk soft className="h-2.5 w-20" />
                    <Sk className="h-5 w-16" />
                  </div>
                  <Sk className="h-8 w-8 rounded-md bg-indigo-100" />
                </div>
                <Sk soft className="mt-2.5 h-2.5 w-24" />
              </div>
            ))}
          </div>
          <PanelSkeleton rows={6} cols={6} />
        </div>
      </div>
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  return <Suspense fallback={<SubscriptionsSkeleton />}><AdminSubscriptions /></Suspense>;
}

function AdminSubscriptions() {
  const { data: me, isLoading } = useGetMeQuery();
  const isAdmin = me?.data?.role === "ADMIN";
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("tab") as Section | null;
  const tab: Section = raw && SECTIONS.includes(raw) ? raw : "overview";
  const go = useCallback((t: string) => router.replace(`${pathname}?tab=${t}`, { scroll: false }), [router, pathname]);
  const { data: overview } = useSubsOverviewQuery(undefined, { skip: !isAdmin });
  const pending = overview?.data.totals.pendingPayments ?? 0;

  if (isLoading) return <SubscriptionsSkeleton />;
  if (!isAdmin) return <div className={PAGE}><Card><p className="text-sm text-slate-600">Subscription management is available to FinixMart administrators only.</p></Card></div>;

  const nav = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard /> },
    { key: "plans", label: "Plans", icon: <Layers /> },
    { key: "features", label: "Features", icon: <Puzzle /> },
    { key: "cycles", label: "Cycles", icon: <Repeat /> },
    { key: "vendors", label: "Vendors", icon: <Store /> },
    { key: "offers", label: "Offers", icon: <Gift /> },
    { key: "transactions", label: "Transactions", icon: <Receipt />, badge: pending },
    { key: "reports", label: "Reports", icon: <BarChart3 /> },
    { key: "settings", label: "Settings", icon: <Settings /> },
  ];
  return (
    <div className={PAGE}>
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#4338CA] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(67,56,202,0.28)]">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h1 className="text-base font-extrabold tracking-tight text-slate-900">Subscriptions</h1>
          <p className="text-[11px] text-slate-500">Plans, features and pricing for FinixMart vendors</p>
        </div>
        <a
          href="/admin-dashboard/pos-subscriptions"
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-[#4338CA]"
        >
          <CreditCard className="h-3.5 w-3.5" />POS subscriptions
        </a>
      </header>

      <nav aria-label="Subscription sections" className="-mx-3 mb-4 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5 sm:min-w-0 sm:flex-wrap">
          {nav.map((it) => {
            const on = it.key === tab;
            return (
              <button
                key={it.key}
                onClick={() => go(it.key)}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition",
                  on ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{it.icon}</span>
                {it.label}
                {!!it.badge && (
                  <span className={cx("rounded-full px-1.5 text-[10px] tabular-nums", on ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700")}>
                    {it.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="min-w-0">
        {tab === "overview" && <OverviewSection go={go} />}
        {tab === "plans" && <PlansSection />}
        {tab === "features" && <FeaturesSection />}
        {tab === "cycles" && <CyclesSection />}
        {tab === "vendors" && <VendorsSection />}
        {tab === "offers" && <OffersSection />}
        {tab === "transactions" && <TransactionsSection />}
        {tab === "reports" && <ReportsSection />}
        {tab === "settings" && <SettingsSection />}
      </main>
    </div>
  );
}
