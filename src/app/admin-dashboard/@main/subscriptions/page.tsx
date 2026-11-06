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
import { Card, PageHeader, SectionNav, Shell, Skeleton } from "@/components/billing/ui";
import { OverviewSection, ReportsSection, SettingsSection } from "@/components/admin-subscriptions/OverviewSections";
import { CyclesSection, FeaturesSection, PlansSection } from "@/components/admin-subscriptions/CatalogueSections";
import { OffersSection, TransactionsSection, VendorsSection } from "@/components/admin-subscriptions/VendorSections";

const SECTIONS = ["overview", "plans", "features", "cycles", "vendors", "offers", "transactions", "reports", "settings"] as const;
type Section = (typeof SECTIONS)[number];

export default function AdminSubscriptionsPage() {
  return <Suspense fallback={<Shell><Skeleton rows={6} /></Shell>}><AdminSubscriptions /></Suspense>;
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

  if (isLoading) return <Shell><Skeleton rows={6} /></Shell>;
  if (!isAdmin) return <Shell><Card><p className="text-sm text-[#475569]">Subscription management is available to FinixMart administrators only.</p></Card></Shell>;

  const nav = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard /> },
    { key: "plans", label: "Plan Management", icon: <Layers /> },
    { key: "features", label: "Feature Management", icon: <Puzzle /> },
    { key: "cycles", label: "Billing Cycles", icon: <Repeat /> },
    { key: "vendors", label: "Vendor Subscriptions", icon: <Store /> },
    { key: "offers", label: "Special Offers", icon: <Gift /> },
    { key: "transactions", label: "Transactions", icon: <Receipt />, badge: pending },
    { key: "reports", label: "Reports", icon: <BarChart3 /> },
    { key: "settings", label: "Settings", icon: <Settings /> },
  ];
  return (
    <Shell>
      <PageHeader title="Subscriptions" subtitle="Plans, features and pricing for FinixMart vendors" icon={<Sparkles className="h-5 w-5" />}
        actions={<a href="/admin-dashboard/pos-subscriptions" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#ddd6fe] bg-white px-4 text-sm font-semibold text-[#4c1d95] hover:bg-[#f5f3ff]"><CreditCard className="h-4 w-4" />POS subscriptions</a>} />
      <div className="flex flex-col gap-5 lg:flex-row">
        <SectionNav items={nav} active={tab} onChange={go} />
        <main className="min-w-0 flex-1">
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
    </Shell>
  );
}
