// app/pos/page.tsx
"use client";

// Vendor POS. Security lives on the server: the signed-in session (vendor owner,
// or a vendor employee whose permissions include posAccess — re-read on every
// request), the subscription entitlement on every operational call, and the
// per-action grants (posDiscount, posCredit, posRefund, posReports).
// There is no separate POS/terminal login. Everything below mirrors the server
// so people see the right screen; nothing here sends a vendorId or staffId.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  useGetDashboardQuery,
  useGetPosMeQuery,
  useGetSubscriptionQuery,
  type PosMe,
  type PosStaff,
  type PosSubscriptionStatus,
} from "@/features/posApi";
import { useGetMeQuery } from "@/features/authApi";
import { usePermissions } from "@/hooks/usePermissions";
import { operatorFromMe, posBannerFor } from "@/lib/pos/subscription-view";
import PrivateRoute from "@/components/privateroute/PrivateRoute";
import Sidebar from "./components/Sidebar";
import PosTerminalView from "./components/PosTerminalView";
import Topbar from "./components/Topbar";
import BottomNav from "./components/BottomNav";
import InvoicesView from "./components/views/Invoicesview";
import CustomersView from "./components/views/Customersview";
import DashboardView from "./components/views/Dashboardview";
import UsersView from "./components/views/UsersView";
import SettingsView from "./components/views/SettingsView";
import { NAV_ITEMS, canSeeNavItem, type PosView } from "./types";
import { EmptyState } from "./ui";

const BILLING_PAGE = "/vendor-dashboard/pos-billing";

function FullScreenMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 p-4">
      <div className="w-full max-w-sm rounded-[20px] bg-white p-7 text-center shadow-2xl">
        <div className="mb-2 text-base font-extrabold text-slate-900">{title}</div>
        <div className="text-sm text-slate-500">{children}</div>
      </div>
    </div>
  );
}

// Private route: the project's established guard (no session → /login, wrong
// role → /unauthorized). The POS usually opens in its own tab from the vendor
// sidebar; that tab shares the same persisted, same-origin sign-in.
export default function PosPage() {
  return (
    <PrivateRoute allowedRoles={["VENDOR", "EMPLOYEE"]}>
      <PosEntry />
    </PrivateRoute>
  );
}

function PosEntry() {
  const { data: meRes, isLoading, isError } = useGetMeQuery();
  const { can } = usePermissions();
  const me = meRes?.data;
  // Defer mounting the gate by one commit: PosGate subscribes to the same store
  // (/subscription + /pos/me) that PosEntry already reads, and starting those
  // subscriptions inside PosEntry's render pass makes React update PosEntry while
  // rendering PosGate. A post-mount flag moves the child's first subscribe past commit.
  const [gateReady, setGateReady] = useState(false);
  useEffect(() => { setGateReady(true); }, []);

  if (isLoading) return <FullScreenMessage title="Loading…" />;
  if (isError || !me) {
    return (
      <FullScreenMessage title="Sign in required">
        Sign in with your store account to open the POS.{" "}
        <Link href="/login" className="font-bold text-cyan-600 underline">Sign in</Link>
      </FullScreenMessage>
    );
  }
  if (!can("posAccess")) {
    return (
      <FullScreenMessage title="No POS access">
        {me.role === "EMPLOYEE" && me.vendorId
          ? "Ask your store owner to give you POS Terminal Access."
          : "The POS is available to vendor stores and their staff only."}
      </FullScreenMessage>
    );
  }
  if (!gateReady) return <FullScreenMessage title="Loading…" />;
  return <PosGate />;
}

function PosGate() {
  const sub = useGetSubscriptionQuery();
  const posMe = useGetPosMeQuery();

  if (sub.isLoading || posMe.isLoading) return <FullScreenMessage title="Loading…" />;
  const status = (sub.error ?? posMe.error) as { status?: number } | undefined;
  if (sub.isError || posMe.isError || !sub.data?.data || !posMe.data?.data) {
    return (
      <FullScreenMessage title={status?.status === 403 ? "No POS access" : "POS unavailable"}>
        {status?.status === 403 ? "Your account can't open this store's POS." : "The POS couldn't be loaded. Please try again."}
      </FullScreenMessage>
    );
  }
  return <PosApp me={posMe.data.data} sub={sub.data.data} />;
}

function SubscriptionBanner({ sub, isOwner }: { sub: PosSubscriptionStatus; isOwner: boolean }) {
  const banner = posBannerFor(sub);
  if (!banner) return null;
  const tone = banner.tone === "danger" ? "bg-red-50 text-red-800 border-red-200" : banner.tone === "warn" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-sky-50 text-sky-800 border-sky-200";
  return (
    <div role="status" className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-xs font-semibold ${tone}`}>
      <span>{banner.text}</span>
      {isOwner && banner.cta && (
        <Link href={BILLING_PAGE} className="rounded-lg bg-white/80 px-2.5 py-1 font-bold underline-offset-2 hover:underline">
          {banner.cta}
        </Link>
      )}
    </div>
  );
}

function PosApp({ me, sub }: { me: PosMe; sub: PosSubscriptionStatus }) {
  const operator: PosStaff = useMemo(() => operatorFromMe(me), [me]);
  const [activeView, setActiveView] = useState<PosView>("pos");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: dashRes } = useGetDashboardQuery(undefined, { skip: !me.grants.posReports });
  const storeName = me.isOwner ? me.displayName || "Your store" : "Your store";

  const navigate = (v: PosView) => {
    setActiveView(v);
    setSidebarOpen(false);
  };
  const activeItem = NAV_ITEMS.find((n) => n.id === activeView);
  const hasAccess = activeItem ? canSeeNavItem(activeItem, operator) : false;
  // Mirrors the server: without an active subscription every POS operation is blocked.
  const operationsLocked = !sub.entitlement.canOperate && sub.enforcement === "enforce";
  const locked = (what: string) => (
    <div className="h-full flex items-center justify-center p-6">
      <EmptyState icon={<span className="text-4xl">🔒</span>} text={`${what} is paused until the POS subscription is active. Past invoices stay viewable.`} />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Sidebar activeView={activeView} onNavigate={navigate} staff={operator} dashboard={dashRes?.data} storeName={storeName} />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56">
            <Sidebar activeView={activeView} onNavigate={navigate} staff={operator} dashboard={dashRes?.data} storeName={storeName} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar activeView={activeView} staff={operator} storeName={storeName} vendorId={me.vendorId} onLogout={() => window.location.assign("/vendor-dashboard")} onMenuClick={() => setSidebarOpen(true)} />
        <SubscriptionBanner sub={sub} isOwner={me.isOwner} />

        <div className="flex-1 overflow-hidden pb-[58px] md:pb-0">
          {!hasAccess ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState icon={<span className="text-4xl">🚫</span>} text="You don't have access to this section" />
            </div>
          ) : activeView === "pos" ? (
            operationsLocked ? locked("Selling") : <PosTerminalView staff={operator} storeName={storeName} vendorId={me.vendorId} />
          ) : activeView === "invoices" ? (
            <InvoicesView storeName={storeName} vendorId={me.vendorId} />
          ) : activeView === "customers" ? (
            <CustomersView staff={{ ...operator, permissions: { ...operator.permissions, canManageCustomers: !operationsLocked } }} />
          ) : activeView === "dashboard" ? (
            me.grants.posReports ? (
              <DashboardView />
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState icon={<span className="text-4xl">🚫</span>} text="Permission required" />
              </div>
            )
          ) : activeView === "users" ? (
            <UsersView staff={operator} />
          ) : activeView === "settings" ? (
            operationsLocked ? locked("Changing settings") : <SettingsView staff={operator} storeName={storeName} vendorId={me.vendorId} />
          ) : null}
        </div>

        <BottomNav activeView={activeView} onNavigate={navigate} staff={operator} />
      </div>
    </div>
  );
}
