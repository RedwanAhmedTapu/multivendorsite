"use client";

// Admin › Vendor payouts: schedules and approvals on top of the ledger.
// ADMIN only (the backend enforces it too). No payout provider is connected:
// admins transfer money themselves and record the reference here.

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Clock, FileText, LayoutDashboard, ListChecks, Receipt, Settings, ShieldAlert, Wallet } from "lucide-react";
import { useGetMeQuery } from "@/features/authApi";
import { Badge, Breadcrumb, Card, Notice, PageHeader, PageTabs, PayoutShell } from "@/components/payouts/ui";
import { Sk, TableSkeleton } from "@/components/admin/ui/AdminSkeletons";
import {
  AuditSection, BatchesSection, PayoutOverviewSection, PayoutReportsSection, PayoutSettingsSection, PayoutTransactionsSection, PendingSection, RulesSection,
} from "@/components/admin-payouts/PayoutSections";

const SECTIONS = ["overview", "pending", "batches", "transactions", "earnings", "rules", "settings", "reports", "audit"] as const;
type Section = (typeof SECTIONS)[number];

function PayoutsSkeleton() {
  return (
    <PayoutShell>
      <div aria-busy="true" aria-label="Loading vendor payouts">
        <div className="mb-2 flex items-center gap-1.5">
          <Sk soft className="h-2.5 w-16" />
          <Sk soft className="h-2.5 w-10" />
          <Sk soft className="h-2.5 w-14" />
        </div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Sk className="h-8 w-8 rounded-lg bg-[#eef2ff]" />
              <Sk className="h-6 w-48" />
              <Sk soft className="h-5 w-24 rounded-full" />
            </div>
            <Sk soft className="h-3 w-80 max-w-full" />
          </div>
          <Sk className="h-9 w-32 rounded-lg" />
        </div>
        <div className="mb-4 flex gap-4 overflow-hidden border-b border-slate-200 pb-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Sk key={i} className={i === 0 ? "h-4 w-20 bg-indigo-200/70" : "h-4 w-24"} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Sk soft className="h-2.5 w-24" />
                  <Sk className="h-6 w-28" />
                </div>
                <Sk className="h-9 w-9 rounded-lg bg-[#eef2ff]" />
              </div>
              <Sk soft className="mt-3 h-2.5 w-32" />
            </div>
          ))}
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <Sk className="h-3.5 w-40" />
            <Sk soft className="h-8 w-28 rounded-lg" />
          </div>
          <TableSkeleton rows={6} cols={6} head={false} />
        </div>
      </div>
    </PayoutShell>
  );
}

export default function AdminPayoutsPage() {
  return <Suspense fallback={<PayoutsSkeleton />}><AdminPayouts /></Suspense>;
}

function AdminPayouts() {
  const { data: me, isLoading } = useGetMeQuery();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("tab") as Section | null;
  const tab: Section = raw && SECTIONS.includes(raw) ? raw : "overview";
  const go = useCallback((t: string) => router.replace(`${pathname}?tab=${t}`, { scroll: false }), [router, pathname]);

  if (isLoading) return <PayoutsSkeleton />;
  if (me?.data?.role !== "ADMIN") {
    return (
      <PayoutShell>
        <Breadcrumb items={["FinixMart", "Admin", "Payouts"]} />
        <Card title="Vendor payouts">
          <Notice tone="amber">Vendor payouts are available to FinixMart administrators only.</Notice>
        </Card>
      </PayoutShell>
    );
  }
  const nav = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard /> },
    { key: "pending", label: "Pending Payouts", icon: <Clock /> },
    { key: "batches", label: "Batches", icon: <ListChecks /> },
    { key: "transactions", label: "Transactions", icon: <Receipt /> },
    { key: "earnings", label: "Vendor Earnings", icon: <Wallet /> },
    { key: "rules", label: "Vendor Rules", icon: <ShieldAlert /> },
    { key: "settings", label: "Cycle Settings", icon: <Settings /> },
    { key: "reports", label: "Reports", icon: <BarChart3 /> },
    { key: "audit", label: "Audit Log", icon: <FileText /> },
  ];
  return (
    <PayoutShell>
      <Breadcrumb items={["FinixMart", "Admin", "Payouts"]} />
      <PageHeader
        title="Vendor Payouts"
        subtitle="What FinixMart owes vendors, when it's due, and what has been paid"
        icon={<Wallet />}
        badge={<Badge tone="violet" dot>Ledger-based</Badge>}
      />
      <PageTabs items={nav} active={tab} onChange={go} />
      <main className="min-w-0">
        {tab === "overview" && <PayoutOverviewSection go={go} />}
        {tab === "pending" && <PendingSection />}
        {tab === "batches" && <BatchesSection go={go} />}
        {tab === "transactions" && <PayoutTransactionsSection />}
        {tab === "earnings" && <PendingSection earnings />}
        {tab === "rules" && <RulesSection />}
        {tab === "settings" && <PayoutSettingsSection />}
        {tab === "reports" && <PayoutReportsSection />}
        {tab === "audit" && <AuditSection />}
      </main>
    </PayoutShell>
  );
}
