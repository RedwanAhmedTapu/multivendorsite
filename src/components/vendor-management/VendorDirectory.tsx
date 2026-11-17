// components/vendor-management/VendorDirectory.tsx
"use client";

// Admin "All Vendors" directory, redesigned against vendormanagement-prototype.html.
// Only existing vendor APIs are used and every list/filter/search/page request is
// server-side (GET /vendormanagement). Category filtering has no query parameter on
// that endpoint yet, so it is marked unavailable rather than faked client-side.
// Admins can also show/hide table columns; that preference is per browser
// (localStorage) and never sent to the server.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  Columns3,
  Eye,
  Loader2,
  MoreVertical,
  Pencil,
  Percent,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Store,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useBulkUpdateCommissionsMutation,
  useCreateOrUpdateSubscriptionMutation,
  useExportVendorsMutation,
  useGetVendorInsightsQuery,
  useGetVendorsQuery,
  useSetCommissionRateMutation,
  useUpdateVendorStatusMutation,
  type Vendor,
  type VendorFilterQuery,
} from "@/features/vendorManageApi";
import CategoryTreeSelector from "./CategoryTreeSelector";
import VendorDrawer, { type DrawerTab } from "./VendorDrawer";
import {
  compactMoney,
  formatDate,
  formatMoney,
  KYC_STATUS_LABEL,
  pageWindow,
  planLabel,
  ratingLabel,
  vendorCode,
  vendorInitials,
  VENDOR_STATUS_LABEL,
  type KycStatus,
} from "@/lib/vendor-directory";

type VendorRef = { id: string; storeName: string; subscription?: { planType?: string; isActive?: boolean } | null };

/* ─── segment tabs ──────────────────────────────────────────────────────── */

type TabKey = "all" | "kyc" | "active" | "hold" | "risk" | "suspended";

const TABS: { key: TabKey; label: string; status?: Vendor["status"]; unavailable?: string }[] = [
  { key: "all", label: "All Vendors" },
  { key: "kyc", label: "Pending KYC", unavailable: "KYC status is not a supported list filter" },
  { key: "active", label: "Active Stores", status: "ACTIVE" },
  { key: "hold", label: "Payout On Hold", unavailable: "Payout hold state is not exposed by the vendor API" },
  { key: "risk", label: "At Risk", unavailable: "Risk scoring is not exposed by the vendor API" },
  { key: "suspended", label: "Suspended", status: "SUSPENDED" },
];

const PAGE_SIZES = [10, 25, 50, 100];

const COMMISSION_RANGES: { value: string; label: string; min?: number; max?: number }[] = [
  { value: "", label: "Any" },
  { value: "0-10", label: "0% – 10%", min: 0, max: 10 },
  { value: "10-20", label: "10% – 20%", min: 10, max: 20 },
  { value: "20-30", label: "20% – 30%", min: 20, max: 30 },
  { value: "30-100", label: "30% +", min: 30, max: 100 },
];
const PLAN_TYPES = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"] as const;

// Filters advertise every value the API accepts, not just the values present in
// the current vendor rows (an empty segment must still be selectable).
const PLAN_FILTER_OPTIONS = [...PLAN_TYPES, "NONE"] as const;
const PAYOUT_CYCLE_FILTER_OPTIONS = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "CUSTOM", "NONE"] as const;
const PAYOUT_CYCLE_LABEL: Record<(typeof PAYOUT_CYCLE_FILTER_OPTIONS)[number], string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  CUSTOM: "Custom",
  NONE: "No override",
};

type ColumnKey =
  | "vendor"
  | "contact"
  | "kyc"
  | "products"
  | "commission"
  | "rating"
  | "status"
  | "fulfillment"
  | "plan"
  | "payout"
  | "sales"
  | "joined";

// The admin can hide any data column except vendor identity. The choice is a
// per-browser preference (localStorage), not server state.
const COLUMN_DEFS: { key: ColumnKey; label: string; width: number; locked?: boolean }[] = [
  { key: "vendor", label: "Vendor & Code", width: 220, locked: true },
  { key: "contact", label: "Contact", width: 180 },
  { key: "kyc", label: "KYC Status", width: 130 },
  { key: "products", label: "Products", width: 95 },
  { key: "commission", label: "Commission", width: 115 },
  { key: "rating", label: "Rating", width: 90 },
  { key: "status", label: "Status", width: 115 },
  { key: "fulfillment", label: "Fulfillment", width: 130 },
  { key: "plan", label: "Plan", width: 115 },
  { key: "payout", label: "Payout", width: 180 },
  { key: "sales", label: "Sales (GMV)", width: 140 },
  { key: "joined", label: "Joined", width: 125 },
];
const COLUMN_PREF_KEY = "finixmart.vendorDirectory.columns.v1";
const ALL_COLUMNS_VISIBLE = Object.fromEntries(COLUMN_DEFS.map((c) => [c.key, true])) as Record<ColumnKey, boolean>;
const FILTER_CONTROL =
  "h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15";

function loadColumnPrefs(): Record<ColumnKey, boolean> | null {
  try {
    const raw = window.localStorage.getItem(COLUMN_PREF_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    const next = { ...ALL_COLUMNS_VISIBLE };
    for (const col of COLUMN_DEFS) {
      if (!col.locked && typeof saved[col.key] === "boolean") next[col.key] = saved[col.key] as boolean;
    }
    return next;
  } catch {
    return null;
  }
}

const STATUS_CHIP: Record<Vendor["status"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200",
  DEACTIVATED: "bg-slate-100 text-slate-600 border-slate-200",
};

const KYC_CHIP: Record<KycStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  SUSPENDED: "bg-slate-100 text-slate-600 border-slate-200",
};

function Chip({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{children}</span>;
}

function payoutAccountLabel(vendor: Vendor): { primary: string; secondary: string } {
  const account = vendor.paymentAccounts?.find((a) => a.isDefault) ?? vendor.paymentAccounts?.[0];
  if (!account) return { primary: "—", secondary: "No payout account" };
  const number = account.accountNumber || account.walletNumber || "";
  const bank = account.bankBranch?.bank?.name;
  return {
    primary: bank || account.mobileProvider || account.cardProcessor || account.type,
    secondary: [number ? `••••${number.slice(-4)}` : "", account.type.replace(/_/g, " ")].filter(Boolean).join(" · "),
  };
}

/* ─── dialogs ───────────────────────────────────────────────────────────── */

function Overlay({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] ${wide ? "max-w-lg" : "max-w-md"}`}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── page ──────────────────────────────────────────────────────────────── */

export default function VendorDirectory() {
  const router = useRouter();
  const [tabKey, setTabKey] = useState<TabKey>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [commissionRange, setCommissionRange] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [cycleFilter, setCycleFilter] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<{ by: "createdAt" | "storeName"; order: "asc" | "desc" }>({ by: "createdAt", order: "desc" });
  const [selected, setSelected] = useState<string[]>([]);
  const [menu, setMenu] = useState<{ vendor: Vendor; x: number; y: number } | null>(null);
  const [drawer, setDrawer] = useState<{ vendorId: string; tab: DrawerTab } | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Vendor | null>(null);
  const [planTarget, setPlanTarget] = useState<VendorRef | null>(null);
  const [planForm, setPlanForm] = useState<{ planType: string; isActive: boolean }>({ planType: "FREE", isActive: true });
  const [commissionTarget, setCommissionTarget] = useState<{ vendors: VendorRef[]; bulk: boolean } | null>(null);
  const [commissionForm, setCommissionForm] = useState<{ categoryId: string; categoryPath: string; rate: string; note: string; pickCategory: boolean }>({
    categoryId: "",
    categoryPath: "",
    rate: "",
    note: "",
    pickCategory: false,
  });
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(ALL_COLUMNS_VISIBLE);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  const activeTab = TABS.find((t) => t.key === tabKey)!;
  const unavailable = Boolean(activeTab.unavailable);

  // debounce search — the API receives the term, the table is never filtered locally
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSelected([]);
  }, [tabKey, search, commissionRange, planFilter, cycleFilter, page, limit, sort.by, sort.order]);

  // ⌘K / Ctrl+K focuses the search field (the hint shown in the input)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Preferences are applied after mount so the prerendered table and the first
  // client render agree; localStorage is never read during render.
  useEffect(() => {
    const saved = loadColumnPrefs();
    if (saved) setVisibleColumns(saved);
  }, []);

  useEffect(() => {
    if (!columnsOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setColumnsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setColumnsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [columnsOpen]);

  const commissionRangeOption = COMMISSION_RANGES.find((r) => r.value === commissionRange);
  const query = {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(activeTab.status ? { status: activeTab.status } : {}),
    ...(commissionRangeOption?.min !== undefined ? { commissionMin: commissionRangeOption.min, commissionMax: commissionRangeOption.max } : {}),
    ...(planFilter ? { planType: planFilter as NonNullable<VendorFilterQuery["planType"]> } : {}),
    ...(cycleFilter ? { payoutCycle: cycleFilter as NonNullable<VendorFilterQuery["payoutCycle"]> } : {}),
    sortBy: sort.by,
    sortOrder: sort.order,
  };

  const { data, isLoading, isFetching, isError, refetch } = useGetVendorsQuery(query, { skip: unavailable });
  const { data: totalCount, refetch: refetchTotal } = useGetVendorsQuery({ page: 1, limit: 1 });
  const { data: activeCount, refetch: refetchActive } = useGetVendorsQuery({ page: 1, limit: 1, status: "ACTIVE" });
  const { data: suspendedCount, refetch: refetchSuspended } = useGetVendorsQuery({ page: 1, limit: 1, status: "SUSPENDED" });
  const { data: insights, isLoading: insightsLoading, isError: insightsError, refetch: refetchInsights } = useGetVendorInsightsQuery();

  const [exportVendors, { isLoading: exporting }] = useExportVendorsMutation();
  const [updateStatus, { isLoading: statusSaving }] = useUpdateVendorStatusMutation();
  const [savePlan, { isLoading: planSaving }] = useCreateOrUpdateSubscriptionMutation();
  const [setCommission, { isLoading: commissionSaving }] = useSetCommissionRateMutation();
  const [bulkCommission, { isLoading: bulkSaving }] = useBulkUpdateCommissionsMutation();

  const vendors = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, page, limit, pages: 0 };
  const total = pagination.total;
  const pages = pagination.pages;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const counts: Record<TabKey, number | null> = {
    all: totalCount?.pagination.total ?? null,
    kyc: null,
    active: activeCount?.pagination.total ?? null,
    hold: null,
    risk: null,
    suspended: suspendedCount?.pagination.total ?? null,
  };

  const refreshAll = () => {
    refetch();
    refetchTotal();
    refetchActive();
    refetchSuspended();
    refetchInsights();
  };

  const persistColumnPrefs = (next: Record<ColumnKey, boolean>) => {
    try {
      window.localStorage.setItem(COLUMN_PREF_KEY, JSON.stringify(next));
    } catch {
      /* storage can be unavailable (private mode); the toggle still works for this session */
    }
  };
  const toggleColumn = (key: ColumnKey) => {
    const next = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(next);
    persistColumnPrefs(next);
  };
  const showAllColumns = () => {
    setVisibleColumns(ALL_COLUMNS_VISIBLE);
    persistColumnPrefs(ALL_COLUMNS_VISIBLE);
  };

  // checkbox + action are always rendered; the rest follow the preference.
  const columnCount = 2 + COLUMN_DEFS.filter((c) => visibleColumns[c.key]).length;
  const tableMinWidth = Math.max(560, Math.round((1240 * columnCount) / 14));
  const hiddenColumnCount = COLUMN_DEFS.filter((c) => !c.locked && !visibleColumns[c.key]).length;

  const allPageSelected = vendors.length > 0 && vendors.every((v) => selected.includes(v.id));
  const toggleAll = () =>
    setSelected(allPageSelected ? [] : vendors.map((v) => v.id));

  const toggleSort = (by: "createdAt" | "storeName") => {
    setPage(1);
    setSort((prev) => (prev.by === by ? { by, order: prev.order === "asc" ? "desc" : "asc" } : { by, order: "asc" }));
  };

  const handleExport = async () => {
    try {
      const result = await exportVendors({
        filters: { search: search || undefined, status: activeTab.status },
        fields: ["storeName", "email", "phone", "status", "totalSales", "createdAt"],
      }).unwrap();
      const rows: any[] = Array.isArray(result) ? result : ((result as any)?.data ?? []);
      const worksheet = XLSX.utils.json_to_sheet(
        rows.map((row) => ({
          "Store Name": row.storeName ?? "",
          Email: row.email ?? row.user?.email ?? "",
          Phone: row.phone ?? row.user?.phone ?? "",
          Status: row.status ?? "",
          "Total Sales (৳)": row.totalSales ?? row.performance?.totalSales ?? 0,
          Joined: row.createdAt ? formatDate(row.createdAt) : "",
        }))
      );
      worksheet["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");
      XLSX.writeFile(workbook, `vendors-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch {
      toast.error("Export failed");
    }
  };

  const confirmStatusChange = async () => {
    if (!suspendTarget) return;
    const next = suspendTarget.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await updateStatus({ id: suspendTarget.id, status: next }).unwrap();
      toast.success(next === "SUSPENDED" ? `${suspendTarget.storeName} suspended` : `${suspendTarget.storeName} reactivated`);
      setSuspendTarget(null);
      refreshAll();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Could not update vendor status");
    }
  };

  const openPlan = (vendor: VendorRef) => {
    const current = vendor.subscription?.planType;
    setPlanForm({
      planType: current && (PLAN_TYPES as readonly string[]).includes(current) ? current : "FREE",
      isActive: vendor.subscription?.isActive ?? true,
    });
    setPlanTarget(vendor);
  };

  const submitPlan = async () => {
    if (!planTarget) return;
    try {
      await savePlan({ vendorId: planTarget.id, data: { planType: planForm.planType as (typeof PLAN_TYPES)[number], isActive: planForm.isActive } }).unwrap();
      toast.success("Subscription plan updated");
      setPlanTarget(null);
      refreshAll();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Could not update the plan");
    }
  };

  const openCommission = (vendors: VendorRef[], bulk: boolean) => {
    setCommissionForm({ categoryId: "", categoryPath: "", rate: "", note: "", pickCategory: false });
    setCommissionTarget({ vendors, bulk });
  };

  const submitCommission = async () => {
    if (!commissionTarget) return;
    const rate = Number(commissionForm.rate);
    if (!commissionForm.categoryId) return toast.error("Choose a category");
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return toast.error("Rate must be between 0 and 100");
    try {
      if (commissionTarget.bulk) {
        await bulkCommission({ vendorIds: commissionTarget.vendors.map((v) => v.id), rate, categoryId: commissionForm.categoryId }).unwrap();
        toast.success(`Commission updated for ${commissionTarget.vendors.length} vendors`);
      } else {
        await setCommission({
          vendorId: commissionTarget.vendors[0].id,
          data: { categoryId: commissionForm.categoryId, rate, note: commissionForm.note.trim() || undefined },
        }).unwrap();
        toast.success("Commission rule saved");
      }
      setCommissionTarget(null);
      refreshAll();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Could not save the commission");
    }
  };

  const menuVendor = menu?.vendor ?? null;
  const pagePills = useMemo(() => pageWindow(page, pages), [page, pages]);

  // A missing figure and a genuine ৳0 look identical in money formatting, so an
  // empty quarter shows "—" with a reason instead of a misleading total.
  const insight = insights?.data;
  const insightQuarter = insight?.quarter.key;
  const gmvValue = insightsLoading
    ? "…"
    : !insight || insightsError
      ? "—"
      : insight.coverage.deliveredOrders > 0
        ? compactMoney(insight.gmv)
        : "—";
  const gmvNote = insightsLoading
    ? "Loading quarter totals…"
    : insightsError
      ? "Could not load insights"
      : !insight
        ? "No insight data"
        : insight.coverage.deliveredOrders > 0
          ? `${insight.coverage.deliveredOrders} delivered order${insight.coverage.deliveredOrders === 1 ? "" : "s"} · ${insightQuarter}`
          : `No delivered orders · ${insightQuarter}`;
  const takeValue = insightsLoading
    ? "…"
    : !insight || insightsError
      ? "—"
      : insight.coverage.ledgerEntries > 0
        ? compactMoney(insight.platformTake)
        : "—";
  const takeNote = insightsLoading
    ? "Loading ledger totals…"
    : insightsError
      ? "Could not load insights"
      : !insight
        ? "No insight data"
        : insight.coverage.ledgerEntries > 0
          ? `${insight.coverage.ledgerEntries} ledger entr${insight.coverage.ledgerEntries === 1 ? "y" : "ies"} · ${insightQuarter}`
          : `No ledger entries · ${insightQuarter}`;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans sm:p-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        {/* header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Store size={18} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Vendor Management</h1>
              <p className="text-xs text-slate-500">Review vendors, verify KYC, and control account status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <ArrowDown size={13} />} Export
            </button>
          </div>
        </header>

        {/* KPIs — only what the API can answer */}
        <section aria-label="Vendor metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi label="Total Vendors" value={counts.all === null ? "…" : counts.all.toLocaleString()} icon={<Users size={15} />} note="All statuses" />
          <Kpi
            label="Pending KYC"
            value="—"
            icon={<ShieldCheck size={15} />}
            note="Not exposed by the vendor API"
            tone="amber"
          />
          <Kpi
            label="Active Stores"
            value={counts.active === null ? "…" : counts.active.toLocaleString()}
            icon={<Store size={15} />}
            note={counts.all && counts.active !== null ? `${((counts.active / counts.all) * 100).toFixed(1)}% of vendors` : "Active"}
            tone="emerald"
            progress={counts.all && counts.active !== null ? (counts.active / counts.all) * 100 : undefined}
          />
          <Kpi label="Vendor GMV (Quarter)" value={gmvValue} icon={<Wallet size={15} />} note={gmvNote} />
          <Kpi label="Platform Take (Revenue)" value={takeValue} icon={<Percent size={15} />} note={takeNote} tone="indigo" />
        </section>

        {/* tabs */}
        <section className="border-b border-slate-200/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 text-xs font-semibold">
            {TABS.map((t, i) => {
              const active = tabKey === t.key;
              const count = counts[t.key];
              return (
                <div key={t.key} className="flex shrink-0 items-center gap-1.5">
                  {i > 0 && <span aria-hidden className="h-4 w-px bg-slate-200" />}
                  <button
                    type="button"
                    onClick={() => {
                      setTabKey(t.key);
                      setPage(1);
                    }}
                    title={t.unavailable}
                    aria-pressed={active}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 transition-colors ${
                      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    {t.key === "risk" && <AlertTriangle size={13} className={active ? "text-amber-300" : "text-amber-500"} />}
                    {t.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count === null ? "—" : count.toLocaleString()}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* filter bar — compact toolbar: search+tools row, then a wrapping filter strip */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-2">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <div className="relative min-w-0 flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  type="search"
                  aria-label="Search vendors by store name, vendor code, email or trade license"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search vendors…"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-11 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                />
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-sans text-[9px] font-semibold text-slate-400">
                  ⌘K
                </kbd>
              </div>

              <div ref={columnsRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setColumnsOpen((open) => !open)}
                  aria-expanded={columnsOpen}
                  aria-haspopup="true"
                  aria-label="Choose which columns are visible"
                  title="Choose which columns are visible"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                >
                  <Columns3 size={14} className="text-slate-400" />
                  <span className="hidden sm:inline">Columns</span>
                  {hiddenColumnCount > 0 && (
                    <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{hiddenColumnCount}</span>
                  )}
                </button>
                {columnsOpen && (
                  <div
                    role="menu"
                    aria-label="Visible table columns"
                    className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
                  >
                    <div className="flex items-center justify-between px-2 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Visible columns</span>
                      <button type="button" onClick={showAllColumns} className="text-[10px] font-bold normal-case text-indigo-600 hover:underline">
                        Show all
                      </button>
                    </div>
                    {COLUMN_DEFS.map((col) => (
                      <label
                        key={col.key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          disabled={col.locked}
                          onChange={() => toggleColumn(col.key)}
                          className="h-3.5 w-3.5 rounded border-slate-300 accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {col.label}
                        {col.locked && <span className="ml-auto text-[10px] font-normal text-slate-400">always</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={refreshAll}
                aria-label="Refresh vendor list"
                title="Refresh"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <FilterPill label="Category: All" title="Category filtering is not supported by GET /vendormanagement" />

              <label className="relative shrink-0">
                <span className="sr-only">Commission range</span>
                <select
                  value={commissionRange}
                  onChange={(e) => {
                    setCommissionRange(e.target.value);
                    setPage(1);
                  }}
                  className={FILTER_CONTROL}
                >
                  {COMMISSION_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>{`Commission: ${r.label}`}</option>
                  ))}
                </select>
                <ChevronsDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </label>

              <label className="relative shrink-0">
                <span className="sr-only">Payout cycle</span>
                <select
                  value={cycleFilter}
                  onChange={(e) => {
                    setCycleFilter(e.target.value);
                    setPage(1);
                  }}
                  className={FILTER_CONTROL}
                >
                  <option value="">Payout: All</option>
                  {PAYOUT_CYCLE_FILTER_OPTIONS.map((cycle) => (
                    <option key={cycle} value={cycle}>{`Payout: ${PAYOUT_CYCLE_LABEL[cycle]}`}</option>
                  ))}
                </select>
                <ChevronsDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </label>

              <label className="relative shrink-0">
                <span className="sr-only">Subscription plan</span>
                <select
                  value={planFilter}
                  onChange={(e) => {
                    setPlanFilter(e.target.value);
                    setPage(1);
                  }}
                  className={FILTER_CONTROL}
                >
                  <option value="">Plan: All</option>
                  {PLAN_FILTER_OPTIONS.map((plan) => (
                    <option key={plan} value={plan}>{`Plan: ${plan === "NONE" ? "No plan" : planLabel(plan)}`}</option>
                  ))}
                </select>
                <ChevronsDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </label>
            </div>
          </div>
          <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-slate-400">
            Commission, payout-cycle and plan filters run server-side on <code className="font-mono">GET /vendormanagement</code>. Category filtering is not
            supported by the vendor API yet.
          </p>
        </section>

        {/* table card */}
        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{selected.length ? `${selected.length} selected` : `${vendors.length} vendors displayed`}</span>
              <span className="text-slate-300">•</span>
              <span>
                Page {page} of {Math.max(pages, 1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openCommission(vendors.filter((v) => selected.includes(v.id)), true)}
                disabled={!selected.length}
                className="inline-flex items-center gap-1 font-semibold text-slate-600 transition hover:text-indigo-600 disabled:opacity-40"
              >
                <Percent size={13} /> Bulk Commission Update
              </button>
              {selected.length > 0 && (
                <button type="button" onClick={() => setSelected([])} className="text-slate-400 hover:text-slate-600">
                  Clear
                </button>
              )}
            </div>
          </div>

          {unavailable ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Ban size={18} />
              </div>
              <p className="text-sm font-bold text-slate-800">{activeTab.label} is not available</p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                {activeTab.unavailable}. The vendor list endpoint only filters by <code className="font-mono">status</code>, so this segment is not shown instead of
                presenting unfiltered results.
              </p>
              <button
                type="button"
                onClick={() => setTabKey("all")}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Back to all vendors
              </button>
            </div>
          ) : (
            <>
              {isError && (
                <div role="alert" className="m-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                  Could not load vendors.
                  <button type="button" onClick={refreshAll} className="font-bold underline">
                    Retry
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left" style={{ minWidth: tableMinWidth }}>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          aria-label="Select all vendors on this page"
                          checked={allPageSelected}
                          onChange={toggleAll}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                        />
                      </th>
                      <th className="min-w-[210px] px-3 py-3">
                        <button type="button" onClick={() => toggleSort("storeName")} className="flex items-center gap-1 hover:text-slate-800">
                          Vendor &amp; Code {sort.by === "storeName" ? sort.order === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : null}
                        </button>
                      </th>
                      {visibleColumns.contact && <th className="min-w-[170px] px-3 py-3">Contact</th>}
                      {visibleColumns.kyc && <th className="min-w-[120px] px-3 py-3">KYC Status</th>}
                      {visibleColumns.products && <th className="min-w-[90px] px-3 py-3">Products</th>}
                      {visibleColumns.commission && <th className="min-w-[110px] px-3 py-3">Commission</th>}
                      {visibleColumns.rating && <th className="min-w-[80px] px-3 py-3">Rating</th>}
                      {visibleColumns.status && <th className="min-w-[110px] px-3 py-3">Status</th>}
                      {visibleColumns.fulfillment && <th className="min-w-[120px] px-3 py-3">Fulfillment</th>}
                      {visibleColumns.plan && <th className="min-w-[110px] px-3 py-3">Plan</th>}
                      {visibleColumns.payout && <th className="min-w-[170px] px-3 py-3">Payout</th>}
                      {visibleColumns.sales && <th className="min-w-[130px] px-3 py-3">Sales (GMV)</th>}
                      {visibleColumns.joined && (
                        <th className="min-w-[120px] px-3 py-3">
                          <button type="button" onClick={() => toggleSort("createdAt")} className="flex items-center gap-1 hover:text-slate-800">
                            Joined {sort.by === "createdAt" ? sort.order === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : null}
                          </button>
                        </th>
                      )}
                      <th className="min-w-[110px] px-3 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`skeleton-${i}`}>
                          {Array.from({ length: columnCount }).map((__, j) => (
                            <td key={j} className="px-3 py-3.5">
                              <div className="h-3 animate-pulse rounded bg-slate-100" />
                            </td>
                          ))}
                        </tr>
                      ))}

                    {!isLoading && vendors.length === 0 && (
                      <tr>
                        <td colSpan={columnCount} className="px-6 py-16 text-center text-sm text-slate-500">
                          No vendors match this query.
                        </td>
                      </tr>
                    )}

                    {!isLoading &&
                      vendors.map((vendor) => {
                        const kyc = vendor.verificationStatus;
                        const payout = payoutAccountLabel(vendor);
                        return (
                          <tr key={vendor.id} className={`transition-colors hover:bg-slate-50/80 ${selected.includes(vendor.id) ? "bg-indigo-50/50" : ""}`}>
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                aria-label={`Select ${vendor.storeName}`}
                                checked={selected.includes(vendor.id)}
                                onChange={() =>
                                  setSelected((prev) => (prev.includes(vendor.id) ? prev.filter((id) => id !== vendor.id) : [...prev, vendor.id]))
                                }
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-[11px] font-bold text-indigo-700">
                                  {vendorInitials(vendor.storeName)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate font-bold tracking-tight text-slate-800">{vendor.storeName}</span>
                                    <span className="font-mono text-[10px] text-slate-400">{vendorCode(vendor.id)}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">{vendor.accountType === "BUSINESS" ? "Business" : "Individual seller"}</div>
                                </div>
                              </div>
                            </td>
                            {visibleColumns.contact && (
                              <td className="px-3 py-3">
                                <span className="block max-w-[170px] truncate font-medium text-slate-700">{vendor.user?.email || "—"}</span>
                                <span className="block font-mono text-[11px] text-slate-400">{vendor.user?.phone || "—"}</span>
                              </td>
                            )}
                            {visibleColumns.kyc && (
                              <td className="px-3 py-3">
                                {kyc ? <Chip tone={KYC_CHIP[kyc] ?? KYC_CHIP.PENDING}>{KYC_STATUS_LABEL[kyc] ?? kyc}</Chip> : <span className="text-slate-400">—</span>}
                              </td>
                            )}
                            {visibleColumns.products && (
                              <td className="px-3 py-3">
                                <span className="font-semibold text-slate-700">{vendor._count?.products ?? 0}</span>
                                <span className="block text-[10px] text-slate-400">SKUs</span>
                              </td>
                            )}
                            {visibleColumns.commission && (
                              <td className="px-3 py-3 font-bold text-slate-800">{Number(vendor.currentCommissionRate) || 0}%</td>
                            )}
                            {visibleColumns.rating && (
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center gap-1 text-slate-600">
                                  <Star size={12} className={Number(vendor.performance?.avgRating) > 0 ? "text-amber-500" : "text-slate-300"} />
                                  {ratingLabel(vendor.performance?.avgRating)}
                                </span>
                              </td>
                            )}
                            {visibleColumns.status && (
                              <td className="px-3 py-3">
                                <Chip tone={STATUS_CHIP[vendor.status] ?? STATUS_CHIP.PENDING}>{VENDOR_STATUS_LABEL[vendor.status] ?? vendor.status}</Chip>
                              </td>
                            )}
                            {visibleColumns.fulfillment && (
                              <td className="px-3 py-3">
                                <span className="font-semibold text-slate-700">
                                  {Number(vendor.performance?.fulfillmentRatePct) > 0 ? `${Number(vendor.performance?.fulfillmentRatePct).toFixed(1)}%` : "—"}
                                </span>
                                <span className="block text-[10px] text-slate-400">{vendor.performance?.totalOrders ?? 0} orders</span>
                              </td>
                            )}
                            {visibleColumns.plan && (
                              <td className="px-3 py-3">
                                {vendor.subscription?.planType ? (
                                  <Chip tone="bg-indigo-50 text-indigo-700 border-indigo-100">{planLabel(vendor.subscription.planType)}</Chip>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                            )}
                            {visibleColumns.payout && (
                              <td className="px-3 py-3">
                                <span className="block font-semibold text-slate-700">{payout.primary}</span>
                                <span className="block text-[10px] text-slate-400">{payout.secondary}</span>
                              </td>
                            )}
                            {visibleColumns.sales && (
                              <td className="px-3 py-3">
                                <span className="block font-bold text-slate-800">{compactMoney(vendor.performance?.totalSales)}</span>
                                <span className="block text-[10px] text-slate-400">{formatMoney(vendor.performance?.totalSales)}</span>
                              </td>
                            )}
                            {visibleColumns.joined && (
                              <td className="px-3 py-3 text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays size={12} className="text-slate-300" /> {formatDate(vendor.createdAt)}
                                </span>
                              </td>
                            )}
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  aria-label={`View ${vendor.storeName}`}
                                  onClick={() => setDrawer({ vendorId: vendor.id, tab: "overview" })}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700"
                                >
                                  <Eye size={12} /> View
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Actions for ${vendor.storeName}`}
                                  aria-haspopup="menu"
                                  aria-expanded={menu?.vendor.id === vendor.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setMenu({
                                      vendor,
                                      x: Math.max(8, Math.min(rect.right - 264, (window.innerWidth || 1024) - 272)),
                                      y: Math.min(rect.bottom + 6, (window.innerHeight || 768) - 380),
                                    });
                                  }}
                                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                  <MoreVertical size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    Showing <b className="text-slate-800">{from}</b> to <b className="text-slate-800">{to}</b> of <b className="text-slate-800">{total}</b> vendors
                  </span>
                  <span className="h-4 w-px bg-slate-300" />
                  <label className="flex items-center gap-1.5">
                    Rows:
                    <select
                      aria-label="Rows per page"
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {pagePills.map((p, i) =>
                    p === "…" ? (
                      <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? "page" : undefined}
                        onClick={() => setPage(p)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                          p === page ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= Math.max(pages, 1)}
                    onClick={() => setPage((p) => Math.min(Math.max(pages, 1), p + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* row action popover — fixed so the horizontal table scroll cannot clip it */}
      {menuVendor && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setMenu(null)} aria-hidden="true" />
          <div
            role="menu"
            aria-label={`Actions for ${menuVendor.storeName}`}
            className="fixed z-[61] w-64 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white py-1.5 text-left shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
            style={{ left: menu!.x, top: menu!.y }}
          >
            <div className="bg-slate-50/70 px-3 py-2">
              <p className="truncate text-[11px] font-bold text-slate-800">
                {menuVendor.storeName} ({vendorCode(menuVendor.id)})
              </p>
              <p className="text-[10px] text-slate-400">Quick operations</p>
            </div>
            <div className="py-1">
              <MenuItem icon={<Eye size={14} />} label="View store details" onClick={() => { setDrawer({ vendorId: menuVendor.id, tab: "overview" }); setMenu(null); }} />
              <MenuItem
                icon={<Pencil size={14} />}
                label="Edit vendor info & contracts"
                onClick={() => {
                  setMenu(null);
                  router.push(`/admin-dashboard/vendormanage/vendor-approval/${menuVendor.id}`);
                }}
              />
            </div>
            <div className="py-1">
              <MenuItem icon={<RefreshCw size={14} />} label="Change subscription plan" onClick={() => { openPlan(menuVendor); setMenu(null); }} />
              <MenuItem icon={<Percent size={14} />} label="Configure commission" onClick={() => { openCommission([menuVendor], false); setMenu(null); }} />
              <MenuItem icon={<ShieldCheck size={14} />} label="Review KYC documents" onClick={() => { setDrawer({ vendorId: menuVendor.id, tab: "kyc" }); setMenu(null); }} />
            </div>
            <div className="py-1">
              <MenuItem
                icon={<Wallet size={14} />}
                label="View payout ledger"
                onClick={() => {
                  setDrawer({ vendorId: menuVendor.id, tab: "payout" });
                  setMenu(null);
                }}
              />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setSuspendTarget(menuVendor);
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <Ban size={14} /> {menuVendor.status === "SUSPENDED" ? "Reactivate store" : "Suspend store"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* drawer */}
      {drawer && (
        <VendorDrawer
          vendorId={drawer.vendorId}
          initialTab={drawer.tab}
          onClose={() => setDrawer(null)}
          onChanged={refreshAll}
          onEdit={(vendor) => router.push(`/admin-dashboard/vendormanage/vendor-approval/${vendor.id}`)}
          onConfigureCommission={(vendor) => openCommission([vendor], false)}
          onChangePlan={(vendor) => openPlan(vendor)}
        />
      )}

      {/* suspend / reactivate confirm */}
      {suspendTarget && (
        <Overlay onClose={() => setSuspendTarget(null)}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">
              {suspendTarget.status === "SUSPENDED" ? "Reactivate store" : "Suspend store"}
            </h2>
            <button type="button" onClick={() => setSuspendTarget(null)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2 px-5 py-4 text-xs text-slate-600">
            <p>
              {suspendTarget.status === "SUSPENDED"
                ? `${suspendTarget.storeName} will be set back to ACTIVE and can sell again.`
                : `${suspendTarget.storeName} will be set to SUSPENDED and its storefront will stop accepting orders.`}
            </p>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
              The vendor is not notified automatically and payouts are not put on hold by this action.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
            <button type="button" onClick={() => setSuspendTarget(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmStatusChange}
              disabled={statusSaving}
              className={`rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-60 ${suspendTarget.status === "SUSPENDED" ? "bg-emerald-600" : "bg-rose-600"}`}
            >
              {statusSaving ? "Saving…" : suspendTarget.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
            </button>
          </div>
        </Overlay>
      )}

      {/* plan dialog */}
      {planTarget && (
        <Overlay onClose={() => setPlanTarget(null)}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Change subscription plan</h2>
            <button type="button" onClick={() => setPlanTarget(null)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3 px-5 py-4">
            <p className="text-xs text-slate-500">{planTarget.storeName}</p>
            <label className="block text-[11px] font-semibold text-slate-600">
              Plan
              <select
                aria-label="Subscription plan"
                value={planForm.planType}
                onChange={(e) => setPlanForm((f) => ({ ...f, planType: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
              >
                {PLAN_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {planLabel(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={planForm.isActive}
                onChange={(e) => setPlanForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
              />
              Subscription active
            </label>
            <p className="text-[11px] text-slate-400">Uses the existing vendor subscription endpoint (plan type and active flag only).</p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
            <button type="button" onClick={() => setPlanTarget(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
              Cancel
            </button>
            <button type="button" onClick={submitPlan} disabled={planSaving} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
              {planSaving ? "Saving…" : "Save plan"}
            </button>
          </div>
        </Overlay>
      )}

      {/* commission dialog (single + bulk) */}
      {commissionTarget && (
        <Overlay onClose={() => setCommissionTarget(null)} wide>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{commissionTarget.bulk ? `Bulk commission · ${commissionTarget.vendors.length} vendors` : "Configure commission"}</h2>
              <p className="text-[11px] text-slate-400">
                {commissionTarget.bulk ? "Applies one category rate to every selected vendor." : commissionTarget.vendors[0]?.storeName}
              </p>
            </div>
            <button type="button" onClick={() => setCommissionTarget(null)} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-600">Category</span>
              {commissionForm.categoryId && !commissionForm.pickCategory ? (
                <div className="mt-1 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs">
                  <span className="truncate font-semibold text-indigo-800">{commissionForm.categoryPath}</span>
                  <button type="button" onClick={() => setCommissionForm((f) => ({ ...f, pickCategory: true }))} className="text-[11px] font-bold text-indigo-700 underline">
                    Change
                  </button>
                </div>
              ) : (
                <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50/60 p-2">
                  <CategoryTreeSelector
                    onSelect={(id, path, isLeaf) => {
                      if (!isLeaf) {
                        toast.error("Select a leaf category");
                        return;
                      }
                      setCommissionForm((f) => ({ ...f, categoryId: id, categoryPath: path, pickCategory: false }));
                    }}
                  />
                </div>
              )}
            </div>
            <label className="block text-[11px] font-semibold text-slate-600">
              Rate (%)
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                aria-label="Commission rate"
                value={commissionForm.rate}
                onChange={(e) => setCommissionForm((f) => ({ ...f, rate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                placeholder="e.g. 8.5"
              />
            </label>
            {!commissionTarget.bulk && (
              <label className="block text-[11px] font-semibold text-slate-600">
                Note
                <input
                  type="text"
                  value={commissionForm.note}
                  onChange={(e) => setCommissionForm((f) => ({ ...f, note: e.target.value }))}
                  maxLength={200}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                  placeholder="Optional internal note"
                />
              </label>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
            <button type="button" onClick={() => setCommissionTarget(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
              Cancel
            </button>
            <button
              type="button"
              onClick={submitCommission}
              disabled={commissionSaving || bulkSaving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {commissionSaving || bulkSaving ? "Saving…" : commissionTarget.bulk ? "Apply to selected" : "Save commission"}
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

/* ─── bits ──────────────────────────────────────────────────────────────── */

function Kpi({
  label,
  value,
  icon,
  note,
  tone = "slate",
  progress,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  note: string;
  tone?: "slate" | "amber" | "emerald" | "indigo";
  progress?: number;
}) {
  const cards = {
    slate: "border-slate-200 bg-white",
    amber: "border-amber-200 bg-amber-50/50",
    emerald: "border-slate-200 bg-white",
    indigo: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-indigo-50/40 to-white",
  } as const;
  const tones = {
    slate: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-100/80 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-100/80 text-indigo-600",
  } as const;
  return (
    <div className={`rounded-2xl border p-5 transition ${cards[tone]}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="text-[28px] font-extrabold leading-none tracking-tight text-slate-900">{value}</div>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
        </div>
      )}
      <p className="mt-2 text-[11px] text-slate-400">{note}</p>
    </div>
  );
}

function FilterPill({ label, title }: { label: string; title: string }) {
  return (
    <span
      aria-disabled="true"
      title={title}
      className="inline-flex h-9 shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-white pl-3 pr-2.5 text-xs font-medium text-slate-700"
    >
      {label}
      <ChevronsDown size={12} className="text-slate-400" />
    </span>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100/80"
    >
      <span className="text-slate-500">{icon}</span>
      {label}
    </button>
  );
}
