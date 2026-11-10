// src/app/hrm/layout.tsx
//
// The HRM workspace shell INSIDE FinixMart — same auth/session/tenant model,
// no second login. Everything visual is scoped under `.hrm-root` so none of
// the workspace tokens leak into the existing Admin/Vendor/Employee
// dashboards.
//
// Access: any user holding at least one HR capability
// (usePermissions().hrAccess.full — derived in ONE place from the server's
// hrCapabilities map) may render /hrm; the workspace shows ONLY what the
// capability map allows (sidebar items, dashboard widgets, page actions).
// Everyone else gets a denial screen. Frontend gating is UX only — every
// HRM API re-authorizes server-side.

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, CalendarDays, Users, GitBranch, UserRound, Building2, Network,
  Clock, Timer, Plane, Wallet, CheckCheck, Bell, Send, Megaphone, FileText,
  LogOut, BarChart3, TrendingUp, ShieldCheck, Settings, ChevronLeft,
  ChevronRight, Menu, X, Moon, Search, ArrowLeft, Store,
} from "lucide-react";
import { useGetMeQuery } from "@/features/authApi";
import { useAppDispatch } from "@/store/store";
import { clearAuth } from "@/features/authSlice";
import { usePermissions } from "@/hooks/usePermissions";
import { HRM_NAV, type HrmNavItem } from "@/components/hrm/hrm-nav-config";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutGrid, CalendarDays, Users, GitBranch, UserRound, Building2, Network,
  Clock, Timer, Plane, Wallet, CheckCheck, Bell, Send, Megaphone, FileText,
  LogOut, BarChart3, TrendingUp, ShieldCheck, Settings,
};

function initials(name?: string | null): string {
  if (!name) return "U";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

function backHref(role?: string): string {
  if (role === "VENDOR") return "/vendor-dashboard";
  if (role === "EMPLOYEE") return "/vendor-dashboard";
  if (role === "CUSTOMER") return "/user-dashboard";
  return "/admin-dashboard";
}

function roleLabel(role?: string): string {
  if (role === "ADMIN") return "Platform Admin";
  if (role === "VENDOR") return "Vendor Owner";
  return "Employee";
}

export default function HrmLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useGetMeQuery();
  const me = data?.data;
  const { hrAccess, can } = usePermissions();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkPreview, setDarkPreview] = useState(false);

  const vendorName = me?.role === "VENDOR" ? me.name : me?.role === "ADMIN" ? "FinixMart" : me?.name ?? "FinixMart";
  const brandSub = me?.role === "VENDOR" ? "VENDOR HRM" : me?.role === "ADMIN" ? "ADMIN HRM" : "EMPLOYEE HRM";

  const back = backHref(me?.role);

  function signOut() {
    dispatch(clearAuth());
    router.push("/login");
  }

  // ── Guard: loading → skeleton; error → login; no full HR access → denied.
  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <div className="flex h-screen items-center justify-center">
        <div className="hrm-loading-block" />
      </div>
    );
  } else if (isError || !me) {
    body = (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="hrm-card max-w-md p-8 text-center">
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0D1B2E", margin: 0 }}>Session required</p>
          <p style={{ fontSize: 12.5, color: "#7A90AB", marginTop: 6 }}>
            Your FinixMart session could not be verified.
          </p>
          <Link href="/login" className="hrm-btn-primary" style={{ display: "inline-flex", marginTop: 16, textDecoration: "none" }}>
            Go to sign in
          </Link>
        </div>
      </div>
    );
  } else if (!hrAccess.full) {
    body = (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="hrm-card max-w-md p-8 text-center">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <ShieldCheck size={22} style={{ color: "#DC2626" }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0D1B2E", margin: 0 }}>HRM workspace access denied</p>
          <p style={{ fontSize: 12.5, color: "#7A90AB", marginTop: 6 }}>
            Your account does not hold the HR capabilities required for the dedicated HRM workspace.
            If you have partial HR access, use the HR features inside your normal dashboard.
          </p>
          <Link href={back} className="hrm-btn-primary" style={{ display: "inline-flex", marginTop: 16, textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to FinixMart
          </Link>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="hrm-shell">
        {/* ── Sidebar (desktop) ── */}
        <aside
          className={`hrm-sidebar hrm-no-print hidden lg:flex ${collapsed ? "hrm-collapsed" : ""}`}
          style={{ width: collapsed ? 84 : 288 }}
        >
          <div className="hrm-sidebar-inner">
            {/* Brand */}
            <div className="hrm-brand">
              <div className="hrm-brand-tile"><Store size={18} /></div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="hrm-brand-title">{vendorName}</p>
                  <p className="hrm-brand-sub">{brandSub}</p>
                </div>
              )}
            </div>

            {/* Nav */}
            <nav className="hrm-nav flex-1 overflow-y-auto">
              {HRM_NAV.map((group) => {
                const visible = group.items.filter((item) => itemVisible(item, can, me));
                if (visible.length === 0) return null;
                return (
                  <div key={group.label} className="hrm-nav-group">
                    {!collapsed && <p className="hrm-nav-label">{group.label}</p>}
                    {visible.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="hrm-nav-item"
                        data-active={pathname === item.href || (item.href !== "/hrm" && pathname.startsWith(item.href))}
                        title={collapsed ? item.label : undefined}
                      >
                        <NavIcon name={item.icon} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="hrm-sidebar-footer">
              {!collapsed && (
                <Link href={back} className="hrm-nav-item hrm-back-item">
                  <ArrowLeft size={16} />
                  <span>Back to FinixMart</span>
                </Link>
              )}
              <button onClick={signOut} className="hrm-nav-item w-full hrm-signout" title="Sign out">
                <LogOut size={16} />
                {!collapsed && <span>Sign out</span>}
              </button>
            </div>
          </div>

          {/* Circular edge toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hrm-collapse-toggle hidden lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </aside>

        {/* ── Sidebar (mobile slide-over) ── */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="hrm-sidebar absolute left-0 top-0 h-full" style={{ width: 288 }}>
              <div className="hrm-sidebar-inner">
                <div className="hrm-brand">
                  <div className="hrm-brand-tile"><Store size={18} /></div>
                  <div className="min-w-0">
                    <p className="hrm-brand-title">{vendorName}</p>
                    <p className="hrm-brand-sub">{brandSub}</p>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="ml-auto text-white/60"><X size={18} /></button>
                </div>
                <nav className="hrm-nav flex-1 overflow-y-auto">
                  {HRM_NAV.map((group) => {
                    const visible = group.items.filter((item) => itemVisible(item, can, me));
                    if (visible.length === 0) return null;
                    return (
                      <div key={group.label} className="hrm-nav-group">
                        <p className="hrm-nav-label">{group.label}</p>
                        {visible.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="hrm-nav-item"
                            data-active={pathname === item.href || (item.href !== "/hrm" && pathname.startsWith(item.href))}
                            onClick={() => setMobileOpen(false)}
                          >
                            <NavIcon name={item.icon} />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </nav>
                <div className="hrm-sidebar-footer">
                  <Link href={back} className="hrm-nav-item hrm-back-item" onClick={() => setMobileOpen(false)}>
                    <ArrowLeft size={16} /><span>Back to FinixMart</span>
                  </Link>
                  <button onClick={signOut} className="hrm-nav-item w-full hrm-signout">
                    <LogOut size={16} /><span>Sign out</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="hrm-header hrm-no-print">
            <div className="flex items-center gap-3">
              <button className="lg:hidden text-[#334155]" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
              <div className="hrm-search hidden sm:flex">
                <Search size={14} className="text-[#94A3B8]" />
                <input placeholder="Search employees, tasks, ..." disabled title="Search arrives with a later phase" />
                <span className="hrm-kbd">Ctrl K</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                className="hrm-header-icon"
                onClick={() => setDarkPreview((d) => !d)}
                aria-pressed={darkPreview}
                title={darkPreview ? "Dark preview: on (full theme in a later phase)" : "Dark preview: off"}
              >
                <Moon size={17} style={darkPreview ? { color: "#059669" } : undefined} />
              </button>
              <Link href="/hrm/notifications" className="hrm-header-icon" title="Notification Center">
                <Bell size={17} />
              </Link>
              {me.employeeId && (
                <Link href="/hrm/self-service" className="hrm-portal-btn">
                  <UserRound size={14} />
                  My Portal
                </Link>
              )}
              <Link href={back} className="hrm-portal-btn" title="Back to FinixMart">
                <ArrowLeft size={14} />
                <span className="hidden md:inline">FinixMart</span>
              </Link>
              <div className="hrm-user-chip">
                <div className="hrm-avatar">{initials(me.name)}</div>
                <div className="hidden sm:block leading-tight">
                  <p className="hrm-user-name">{me.name ?? "User"}</p>
                  <p className="hrm-user-role">{roleLabel(me.role)}</p>
                </div>
              </div>
            </div>
          </header>
          <main className={`hrm-main flex-1 overflow-y-auto ${darkPreview ? "hrm-dark-preview" : ""}`}>
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`hrm-root ${darkPreview ? "hrm-dark-preview" : ""}`}>
      <style>{HRM_STYLES}</style>
      {body}
    </div>
  );
}

function itemVisible(
  item: HrmNavItem,
  can: ReturnType<typeof usePermissions>["can"],
  me: NonNullable<ReturnType<typeof useGetMeQuery>["data"]>["data"]
): boolean {
  if (item.adminsOnly && me.role !== "ADMIN") return false;
  if (item.requiresEmployeeProfile && !me.employeeId) return false;
  if (item.caps.length === 0) return true;
  // OR-semantics: any listed capability unlocks the item — evaluated by the
  // ONE capability source (usePermissions.can, server hrCapabilities map).
  return item.caps.some((c) => can(c as Parameters<typeof can>[0]));
}

function NavIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? LayoutGrid;
  return <Icon size={16} />;
}

const HRM_STYLES = `
.hrm-root {
  /* Design tokens derived from the HRM reference screenshots — scoped to
     /hrm only; nothing here affects the existing dashboards. */
  --hrm-navy: #0D1B2E;
  --hrm-navy-2: #14293F;
  --hrm-emerald: #10B981;
  --hrm-emerald-deep: #059669;
  --hrm-bg: #F6F8FB;
  --hrm-border: #E5EAF2;
  --hrm-header: #FFFFFF;
  --hrm-card: #FFFFFF;
  --hrm-text: #0D1B2E;
  --hrm-muted: #7A90AB;
  --hrm-faint: #9BAABB;

  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--hrm-bg);
  color: var(--hrm-text);
  font-family: inherit;
}
.hrm-root.hrm-dark-preview { --hrm-bg: #E9EEF5; --hrm-header: #F3F6FA; }

.hrm-shell { display: flex; height: 100vh; overflow: hidden; }

.hrm-sidebar {
  background: linear-gradient(180deg, #0D1B2E 0%, #10233A 100%);
  position: relative;
  transition: width 0.25s ease;
  flex-shrink: 0;
}
.hrm-sidebar-inner { display: flex; flex-direction: column; height: 100%; padding: 14px 0 10px; }
.hrm-brand { display: flex; align-items: center; gap: 10px; padding: 6px 18px 16px; }
.hrm-brand-tile {
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
  background: linear-gradient(135deg, #10B981, #059669);
  display: flex; align-items: center; justify-content: center; color: #fff;
  box-shadow: 0 4px 10px rgba(16,185,129,0.35);
}
.hrm-brand-title { font-size: 14px; font-weight: 800; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hrm-brand-sub { font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; color: #64748B; margin: 1px 0 0; }

.hrm-nav { padding: 4px 10px; }
.hrm-nav-group { margin-bottom: 10px; }
.hrm-nav-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #5B7189; padding: 6px 10px 4px; margin: 0; }
.hrm-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8.5px 12px; margin: 1px 0;
  border-radius: 9px; font-size: 13px; font-weight: 600;
  color: #B7C6D6; text-decoration: none; border: none; background: transparent;
  cursor: pointer; white-space: nowrap; overflow: hidden;
}
.hrm-nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.hrm-nav-item[data-active="true"] {
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}
.hrm-nav-item.hrm-signout { color: #8CA3B8; margin-top: 4px; }
.hrm-nav-item.hrm-signout:hover { color: #FCA5A5; background: rgba(239,68,68,0.08); }
.hrm-nav-item.hrm-back-item { color: #B7C6D6; }
.hrm-sidebar-footer { padding: 8px 10px 2px; border-top: 1px solid rgba(255,255,255,0.06); }

.hrm-collapse-toggle {
  position: absolute; top: 64px; right: -12px; z-index: 30;
  width: 24px; height: 24px; border-radius: 50%;
  background: #fff; border: 1px solid #E5EAF2;
  align-items: center; justify-content: center;
  color: #475569; cursor: pointer;
  box-shadow: 0 2px 6px rgba(13,27,46,0.15);
}

.hrm-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 10px 20px;
  background: var(--hrm-header);
  border-bottom: 1px solid var(--hrm-border);
  position: sticky; top: 0; z-index: 20;
}
.hrm-search {
  display: flex; align-items: center; gap: 8px;
  background: #F6F8FB; border: 1px solid #E5EAF2; border-radius: 999px;
  padding: 7px 14px; width: 300px;
}
.hrm-search input { border: none; outline: none; background: transparent; font-size: 12.5px; width: 100%; color: var(--hrm-text); }
.hrm-kbd { font-size: 10px; color: #94A3B8; border: 1px solid #E5EAF2; border-radius: 5px; padding: 1px 5px; background: #fff; }
.hrm-header-icon {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #64748B; background: transparent; border: none; cursor: pointer;
}
.hrm-header-icon:hover { background: #F1F5F9; color: #0D1B2E; }
.hrm-portal-btn {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1.5px solid var(--hrm-border); background: #fff;
  border-radius: 999px; padding: 7px 14px;
  font-size: 12.5px; font-weight: 700; color: var(--hrm-text);
  text-decoration: none; cursor: pointer;
}
.hrm-portal-btn:hover { border-color: #C7D2FE; }
.hrm-user-chip { display: flex; align-items: center; gap: 9px; padding-left: 6px; }
.hrm-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff; font-size: 13px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.hrm-user-name { font-size: 12.5px; font-weight: 700; color: var(--hrm-text); margin: 0; }
.hrm-user-role { font-size: 10.5px; color: var(--hrm-muted); margin: 0; }

.hrm-main { padding: 22px 24px 32px; }
.hrm-page-title { font-size: 22px; font-weight: 800; color: var(--hrm-text); margin: 0 0 4px; letter-spacing: -0.3px; }
.hrm-page-subtitle { font-size: 13px; color: var(--hrm-muted); margin: 0 0 20px; }

.hrm-card {
  background: var(--hrm-card);
  border: 1.5px solid var(--hrm-border);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(13,27,46,0.04);
}
.hrm-stat-card { padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.hrm-stat-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--hrm-muted); margin: 0; }
.hrm-stat-value { font-size: 26px; font-weight: 800; color: var(--hrm-text); margin: 2px 0 0; line-height: 1.1; }
.hrm-stat-sub { font-size: 11.5px; color: var(--hrm-muted); margin: 3px 0 0; }
.hrm-stat-tile {
  width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.hrm-tile-emerald { background: linear-gradient(135deg, #34D399, #059669); }
.hrm-tile-orange { background: linear-gradient(135deg, #FB923C, #EA580C); }
.hrm-tile-teal { background: linear-gradient(135deg, #2DD4BF, #0D9488); }
.hrm-tile-purple { background: linear-gradient(135deg, #A78BFA, #7C3AED); }
.hrm-tile-slate { background: linear-gradient(135deg, #94A3B8, #475569); }
.hrm-tile-rose { background: linear-gradient(135deg, #FB7185, #E11D48); }

.hrm-pill {
  display: inline-flex; align-items: center; gap: 6px;
  border-radius: 999px; padding: 7px 16px;
  font-size: 12.5px; font-weight: 700; cursor: pointer;
  border: 1.5px solid var(--hrm-border); background: #fff; color: #475569;
  text-decoration: none;
}
.hrm-pill.hrm-pill-active { background: var(--hrm-emerald); border-color: var(--hrm-emerald); color: #fff; }
.hrm-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 22px; border-radius: 11px; border: none;
  background: linear-gradient(135deg, #1D4ED8, #7C3AED);
  color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
}
.hrm-chip { display: inline-block; border-radius: 999px; padding: 2px 10px; font-size: 10.5px; font-weight: 700; }
.hrm-chip-active { background: #D1FAE5; color: #047857; }
.hrm-chip-probation { background: #FEF3C7; color: #B45309; }
.hrm-chip-late { background: #FFEDD5; color: #C2410C; }
.hrm-chip-absent { background: #FEE2E2; color: #B91C1C; }
.hrm-chip-terminated { background: #FEE2E2; color: #B91C1C; }
.hrm-chip-resigned { background: #E2E8F0; color: #475569; }

.hrm-mini-tile { border-radius: 12px; padding: 12px 16px; }
.hrm-loading-block { width: 260px; height: 16px; border-radius: 8px; background: #E2E8F0; animation: hrm-pulse 1.4s ease-in-out infinite; }
@keyframes hrm-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

/* ── Directory table (PHASE B) ── */
.hrm-select {
  border: 1.5px solid var(--hrm-border); background: #fff;
  border-radius: 999px; padding: 7px 14px; font-size: 12.5px; font-weight: 600;
  color: #475569; cursor: pointer; font-family: inherit;
}
.hrm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.hrm-table thead th {
  text-align: left; padding: 10px 14px;
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
  color: var(--hrm-muted);
  border-bottom: 1px solid var(--hrm-border);
  background: #FAFBFD; white-space: nowrap;
}
.hrm-table thead th button {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer;
  font: inherit; color: inherit; padding: 0;
}
.hrm-table tbody td { padding: 11px 14px; color: #334155; border-bottom: 1px solid #F0F4FA; }
.hrm-table tbody tr.hrm-row { cursor: pointer; }
.hrm-table tbody tr.hrm-row:hover { background: #F8FAFC; }
.hrm-row-link { font-size: 12px; font-weight: 700; color: var(--hrm-emerald-deep); margin-right: 12px; text-decoration: none; }
.hrm-row-link:hover { text-decoration: underline; }
.hrm-row-action { color: #94A3B8; background: none; border: none; cursor: pointer; padding: 2px; vertical-align: middle; }
.hrm-row-action:hover { color: #DC2626; }
.hrm-type-badge {
  display: inline-block; border: 1px solid var(--hrm-border); border-radius: 7px;
  padding: 2px 9px; font-size: 11px; font-weight: 600; color: #475569; background: #fff;
}

/* ── Scoped accent re-tint: legacy HR pages embedded in the workspace
      (Employee 360, self-service, forms) keep their structure but adopt the
      HRM emerald accents. Applies ONLY under .hrm-root. ── */
.hrm-root .bg-indigo-600 { background: #059669; }
.hrm-root .hover\:bg-indigo-700:hover { background: #047857; }
.hrm-root .hover\:bg-indigo-50:hover { background: #ECFDF5; }
.hrm-root .text-indigo-600 { color: #059669; }
.hrm-root .text-indigo-500 { color: #10B981; }
.hrm-root .hover\:text-indigo-600:hover { color: #059669; }
.hrm-root .border-indigo-600 { border-color: #059669; }
.hrm-root .border-b-2.border-indigo-600 { border-bottom-color: #059669; }
.hrm-root .focus\:border-indigo-500:focus { border-color: #10B981; }
.hrm-root .focus\:ring-indigo-500:focus { --tw-ring-color: rgba(16,185,129,0.3); }
.hrm-root .bg-indigo-100 { background: #D1FAE5; }
.hrm-root .text-indigo-700 { color: #047857; }

@media (max-width: 900px) {
  .hrm-main { padding: 16px 14px 28px; }
  .hrm-search { display: none !important; }
}

/* Print: hide shell chrome, print only the report content (scoped). */
@media print {
  .hrm-root .hrm-no-print { display: none !important; }
  .hrm-root { background: #fff !important; }
  .hrm-root .hrm-shell { height: auto !important; overflow: visible !important; display: block !important; }
  .hrm-root .hrm-sidebar, .hrm-root .hrm-header { display: none !important; }
  .hrm-root .hrm-main { overflow: visible !important; padding: 0 !important; }
  .hrm-root .hrm-card { box-shadow: none !important; page-break-inside: avoid; }
}
`;
