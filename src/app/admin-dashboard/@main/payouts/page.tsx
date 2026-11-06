"use client";

// Admin › Vendor payouts: schedules and approvals on top of the ledger.
// ADMIN only (the backend enforces it too). No payout provider is connected:
// admins transfer money themselves and record the reference here.

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Clock, FileText, LayoutDashboard, ListChecks, Receipt, Settings, ShieldAlert, Wallet } from "lucide-react";
import { useGetMeQuery } from "@/features/authApi";
import { Card, PageHeader, SectionNav, Shell, Skeleton } from "@/components/billing/ui";
import {
  AuditSection, BatchesSection, PayoutOverviewSection, PayoutReportsSection, PayoutSettingsSection, PayoutTransactionsSection, PendingSection, RulesSection,
} from "@/components/admin-payouts/PayoutSections";

const SECTIONS = ["overview", "pending", "batches", "transactions", "earnings", "rules", "settings", "reports", "audit"] as const;
type Section = (typeof SECTIONS)[number];

export default function AdminPayoutsPage() {
  return <Suspense fallback={<Shell><Skeleton rows={6} /></Shell>}><AdminPayouts /></Suspense>;
}

function AdminPayouts() {
  const { data: me, isLoading } = useGetMeQuery();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("tab") as Section | null;
  const tab: Section = raw && SECTIONS.includes(raw) ? raw : "overview";
  const go = useCallback((t: string) => router.replace(`${pathname}?tab=${t}`, { scroll: false }), [router, pathname]);

  if (isLoading) return <Shell><Skeleton rows={6} /></Shell>;
  if (me?.data?.role !== "ADMIN") return <Shell><Card><p className="text-sm text-[#475569]">Vendor payouts are available to FinixMart administrators only.</p></Card></Shell>;
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
    <Shell>
      <PageHeader title="Vendor Payouts" subtitle="What FinixMart owes vendors, when it's due, and what has been paid" icon={<Wallet className="h-5 w-5" />} />
      <div className="flex flex-col gap-5 lg:flex-row">
        <SectionNav items={nav} active={tab} onChange={go} />
        <main className="min-w-0 flex-1">
          {tab === "overview" && <PayoutOverviewSection go={go} />}
          {tab === "pending" && <PendingSection />}
          {tab === "batches" && <BatchesSection />}
          {tab === "transactions" && <PayoutTransactionsSection />}
          {tab === "earnings" && <PendingSection earnings />}
          {tab === "rules" && <RulesSection />}
          {tab === "settings" && <PayoutSettingsSection />}
          {tab === "reports" && <PayoutReportsSection />}
          {tab === "audit" && <AuditSection />}
        </main>
      </div>
    </Shell>
  );
}
