'use client';

// Admin › Customer Account Management.
// Data: GET /customermanagement (list + totals), GET /customermanagement/:id
// (View), PUT /customermanagement/:id/block (suspend / reactivate) and
// POST /customermanagement/export. See lib/customers/customer-view.ts for the
// exact backend contract. Fields the API doesn't return (orders, spend,
// customer type) are not shown rather than invented.

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  type Customer,
  useExportCustomersMutation,
  useGetCustomerByIdQuery,
  useGetCustomersQuery,
  useToggleCustomerBlockMutation,
} from '@/features/customerManageApi';
import {
  ACCOUNT_STATUS_OPTIONS,
  DEFAULT_FILTERS,
  DEFAULT_LIST_STATE,
  EXPORT_FIELDS,
  PAGE_SIZES,
  accountStatus,
  buildCustomerQuery,
  displayName,
  exportBytes,
  exportFilters,
  filtersEqual,
  formatBdPhone,
  formatJoined,
  formatTaka,
  hasActiveFilters,
  initials,
  pageList,
  rangeLabel,
  shortId,
  validateDateRange,
  type AccountStatusFilter,
  type CustomerFilters,
  type CustomerListState,
  type CustomerSortField,
} from '@/lib/customers/customer-view';

const card = 'rounded-2xl border border-[#E5EAF2] bg-white shadow-[0_1px_2px_rgba(13,27,46,0.04)]';
const primaryBtn =
  'border-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500';
const secondaryBtn = 'border-[#E5EAF2] bg-white text-[#0D1B2E] hover:bg-[#F5F8FD]';
const field =
  'h-9 w-full rounded-xl border border-[#E5EAF2] bg-white px-3 text-sm text-[#0D1B2E] placeholder:text-[#9AABC1] focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100';

/** Minimal API error → message (never echoes server internals). */
function errorMessage(error: unknown): string {
  const e = error as { status?: unknown; data?: { error?: unknown; message?: unknown } } | undefined;
  if (e?.status === 401) return 'Your session has expired. Please sign in again.';
  if (e?.status === 403) return "You don't have permission to view customers.";
  if (e?.status === 'FETCH_ERROR') return 'The server could not be reached. Check your connection and try again.';
  const m = e?.data?.error ?? e?.data?.message;
  return typeof m === 'string' && m.length < 160 ? m : 'Something went wrong while loading customers.';
}

function useDebounced<T>(value: T, delay = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: LucideIcon;
  tone: string;
  loading?: boolean;
}) {
  return (
    <div className={cn(card, 'flex items-start justify-between gap-3 p-4')}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#7A90AB]">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-20" />
        ) : (
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#0D1B2E]">{value}</p>
        )}
        <p className="mt-1 truncate text-[11px] text-[#7A90AB]">{hint}</p>
      </div>
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tone)}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: 'active' | 'suspended' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200',
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', status === 'active' ? 'bg-emerald-500' : 'bg-rose-500')} />
      {status === 'active' ? 'Active' : 'Suspended'}
    </span>
  );
}

function VerifiedChip({ verified }: { verified?: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-indigo-600">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-amber-600">
      <Clock className="h-3.5 w-3.5" aria-hidden /> Unverified
    </span>
  );
}

function CustomerAvatar({ customer, size = 'sm' }: { customer: Customer; size?: 'sm' | 'lg' }) {
  const src = customer.customerProfile?.profileImage || customer.avatar || undefined;
  return (
    <Avatar className={cn(size === 'lg' ? 'h-14 w-14' : 'h-9 w-9', 'ring-2 ring-white')}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-semibold text-indigo-700">
        {initials(customer)}
      </AvatarFallback>
    </Avatar>
  );
}

function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(id);
          setCopied(true);
        } catch {
          toast.error("Couldn't copy the customer ID");
        }
      }}
      className="inline-flex items-center gap-1 rounded font-mono text-[11px] text-[#7A90AB] hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      aria-label={copied ? 'Customer ID copied' : `Copy customer ID ${id}`}
      title={id}
    >
      {shortId(id)}
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function SortHeader({
  label,
  field: f,
  state,
  onSort,
}: {
  label: string;
  field: CustomerSortField;
  state: CustomerListState;
  onSort: (f: CustomerSortField) => void;
}) {
  const active = state.sortBy === f;
  const Icon = !active ? ArrowUpDown : state.sortOrder === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(f)}
      className={cn('inline-flex items-center gap-1 uppercase tracking-wide hover:text-[#0D1B2E]', active && 'text-indigo-700')}
      aria-label={`Sort by ${label}${active ? (state.sortOrder === 'asc' ? ', ascending' : ', descending') : ''}`}
    >
      {label}
      <Icon className="h-3 w-3" aria-hidden />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AccountManagement() {
  // `applied` drives the query; `draft` is what the filter row shows.
  const [applied, setApplied] = useState<CustomerListState>(DEFAULT_LIST_STATE);
  const [draft, setDraft] = useState<CustomerFilters>(DEFAULT_FILTERS);
  const [dateError, setDateError] = useState<string | null>(null);

  const [viewId, setViewId] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Customer | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<Customer | null>(null);
  const [reason, setReason] = useState('');

  // Search applies itself after typing pauses; status/dates wait for Apply.
  const debouncedSearch = useDebounced(draft.search, 400);
  useEffect(() => {
    setApplied((a) => (a.search.trim() === debouncedSearch.trim() ? a : { ...a, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const query = useMemo(() => buildCustomerQuery(applied), [applied]);
  // Fresh results on every filter/page change (Apply / Reset never show cached rows).
  const list = useGetCustomersQuery(query, { refetchOnMountOrArgChange: true });
  // Totals straight from the API's pagination.total (limit=1 → one tiny row each).
  const totalAll = useGetCustomersQuery({ page: 1, limit: 1 });
  const totalActive = useGetCustomersQuery({ page: 1, limit: 1, status: 'active' });
  const totalBlocked = useGetCustomersQuery({ page: 1, limit: 1, status: 'blocked' });

  const [toggleCustomerBlock, { isLoading: toggling }] = useToggleCustomerBlockMutation();
  const [exportCustomers, { isLoading: exporting }] = useExportCustomersMutation();

  // currentData is undefined while new filters load → no stale rows.
  const rows = list.currentData?.data ?? [];
  const pagination = list.currentData?.pagination ?? list.data?.pagination;
  const total = pagination?.total ?? 0;
  const pages = Math.max(1, pagination?.pages ?? 1);
  const loadingRows = list.isLoading || (list.isFetching && !list.currentData);
  const draftDirty = !filtersEqual(draft, applied);
  const filtered = hasActiveFilters(applied);

  // Keep the page in range when totals shrink (e.g. after a suspension).
  useEffect(() => {
    if (pagination && applied.page > Math.max(1, pagination.pages)) setApplied((a) => ({ ...a, page: Math.max(1, pagination.pages) }));
  }, [pagination, applied.page]);

  const apply = () => {
    const err = validateDateRange(draft.from, draft.to);
    setDateError(err);
    if (err) return;
    const next = { ...applied, ...draft, page: 1 };
    // Same filters as already applied → Apply still refreshes from the server.
    if (JSON.stringify(buildCustomerQuery(next)) === JSON.stringify(query)) list.refetch();
    else setApplied(next);
  };
  const reset = () => {
    setDraft(DEFAULT_FILTERS);
    setDateError(null);
    setApplied((a) => ({ ...DEFAULT_LIST_STATE, limit: a.limit }));
  };
  const sort = (f: CustomerSortField) =>
    setApplied((a) => ({
      ...a,
      page: 1,
      sortBy: f,
      sortOrder: a.sortBy === f ? (a.sortOrder === 'asc' ? 'desc' : 'asc') : f === 'createdAt' ? 'desc' : 'asc',
    }));
  const goPage = (p: number) => setApplied((a) => ({ ...a, page: Math.min(Math.max(1, p), pages) }));

  const refreshTotals = () => {
    totalAll.refetch();
    totalActive.refetch();
    totalBlocked.refetch();
  };

  const suspend = async () => {
    if (!suspendTarget || !reason.trim() || toggling) return;
    try {
      // block=false → isActive=false (see customer.service toggleCustomerBlock)
      await toggleCustomerBlock({ id: suspendTarget.id, block: false, reason: reason.trim() }).unwrap();
      toast.success(`${displayName(suspendTarget)} has been suspended`);
      setSuspendTarget(null);
      setReason('');
      refreshTotals();
    } catch {
      toast.error("Couldn't suspend this account. Please try again.");
    }
  };

  const reactivate = async () => {
    if (!reactivateTarget || toggling) return;
    try {
      await toggleCustomerBlock({ id: reactivateTarget.id, block: true }).unwrap();
      toast.success(`${displayName(reactivateTarget)} has been reactivated`);
      setReactivateTarget(null);
      refreshTotals();
    } catch {
      toast.error("Couldn't reactivate this account. Please try again.");
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportCustomers({ format: 'excel', fields: [...EXPORT_FIELDS], filters: exportFilters(applied) }).unwrap();
      const file = exportBytes(result);
      if (!file) {
        toast.error('The export came back in an unexpected format.');
        return;
      }
      const blob = new Blob([file.bytes as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName ?? `customers-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(filtered ? 'Exported the filtered customers' : 'Exported all customers');
    } catch {
      toast.error('Export failed. Please try again.');
    }
  };

  const fmtCount = (n: number | undefined) => (typeof n === 'number' ? n.toLocaleString('en-BD') : '—');

  const actions = (c: Customer) => {
    const status = accountStatus(c);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#3D5068] hover:bg-[#EEF3FB]" aria-label={`Actions for ${displayName(c)}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuLabel className="text-xs text-[#7A90AB]">Account actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setViewId(c.id)}>
            <Eye className="mr-2 h-4 w-4" /> View details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === 'active' ? (
            <DropdownMenuItem className="text-rose-600 focus:text-rose-700" onClick={() => { setReason(''); setSuspendTarget(c); }}>
              <UserX className="mr-2 h-4 w-4" /> Suspend account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-emerald-700 focus:text-emerald-800" onClick={() => setReactivateTarget(c)}>
              <UserCheck className="mr-2 h-4 w-4" /> Reactivate account
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className={cn(card, 'relative overflow-hidden px-4 py-4 sm:px-5')}>
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-200/50 via-violet-200/40 to-cyan-200/30 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/25">
              <Users className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-[#0D1B2E] sm:text-2xl">Customer Account Management</h1>
              <p className="mt-0.5 text-sm text-[#7A90AB]">View, manage, and monitor customer accounts, activity, and status.</p>
            </div>
          </div>
          {/* No "Add customer": the API has no create route (POST /customermanagement isn't mounted). */}
          <Button type="button" variant="outline" className={cn('h-9 w-full sm:w-auto', secondaryBtn)} onClick={handleExport} disabled={exporting}>
            <Download className="mr-1.5 h-4 w-4 text-indigo-600" />
            {exporting ? 'Exporting…' : filtered ? 'Export filtered' : 'Export'}
          </Button>
        </div>
      </header>

      {/* Summary */}
      <section aria-label="Customer summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Customers" icon={Users} tone="bg-indigo-50 text-indigo-600" loading={totalAll.isLoading}
          value={totalAll.isError ? '—' : fmtCount(totalAll.data?.pagination.total)} hint="All customer accounts" />
        <StatCard label="Active Accounts" icon={UserCheck} tone="bg-emerald-50 text-emerald-600" loading={totalActive.isLoading}
          value={totalActive.isError ? '—' : fmtCount(totalActive.data?.pagination.total)} hint="Can sign in and order" />
        <StatCard label="Suspended Accounts" icon={UserX} tone="bg-rose-50 text-rose-600" loading={totalBlocked.isLoading}
          value={totalBlocked.isError ? '—' : fmtCount(totalBlocked.data?.pagination.total)} hint="Access blocked by an admin" />
        <StatCard label="Pending Verification" icon={ShieldAlert} tone="bg-amber-50 text-amber-600" value="—"
          hint="Not countable yet — the API can't filter by verification" />
      </section>

      {/* Filters */}
      <section aria-label="Search and filters" className={cn(card, 'p-3 sm:p-4')}>
        <form
          className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_11rem_10rem_10rem_auto]"
          onSubmit={(e) => { e.preventDefault(); apply(); }}
        >
          <div className="relative md:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A90AB]" aria-hidden />
            <input
              type="search"
              aria-label="Search customers by name, email or phone"
              placeholder="Search name, email or phone"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              className={cn(field, 'pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden')}
              maxLength={100}
            />
            {draft.search && (
              <button type="button" aria-label="Clear search" onClick={() => setDraft((d) => ({ ...d, search: '' }))}
                className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-md text-[#7A90AB] hover:bg-[#F1F4F9]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            aria-label="Account status"
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as AccountStatusFilter }))}
            className={field}
          >
            {ACCOUNT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <label className="relative block">
            <span className="sr-only">Registered from</span>
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A90AB]" aria-hidden />
            <input type="date" aria-label="Registered from" value={draft.from} max={draft.to || undefined}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} className={cn(field, 'pl-9')} aria-invalid={!!dateError} />
          </label>
          <label className="relative block">
            <span className="sr-only">Registered to</span>
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A90AB]" aria-hidden />
            <input type="date" aria-label="Registered to" value={draft.to} min={draft.from || undefined}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} className={cn(field, 'pl-9')} aria-invalid={!!dateError} />
          </label>
          <div className="flex gap-2 md:col-span-2 xl:col-span-1">
            <Button type="submit" className={cn('relative h-9 flex-1 xl:flex-none', primaryBtn)}>
              <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Apply
              {draftDirty && <span aria-label="Unapplied changes" className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />}
            </Button>
            <Button type="button" variant="outline" className={cn('h-9 flex-1 xl:flex-none', secondaryBtn)} onClick={reset}
              disabled={!filtered && !draftDirty && !dateError}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
            </Button>
          </div>
        </form>
        {dateError && <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{dateError}</p>}
      </section>

      {/* Table */}
      <section aria-label="Customers" className={cn(card, 'overflow-hidden')}>
        <div className="flex flex-col gap-2 border-b border-[#EEF2F7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0D1B2E]">Customers</h2>
            <p className="text-xs text-[#7A90AB]" aria-live="polite">
              {list.isError ? 'Results unavailable' : loadingRows ? 'Loading…' : `${total.toLocaleString('en-BD')} ${filtered ? 'matching' : 'total'} customer${total === 1 ? '' : 's'}`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-[#7A90AB]">
            Rows per page
            <select
              aria-label="Rows per page"
              value={applied.limit}
              onChange={(e) => setApplied((a) => ({ ...a, limit: Number(e.target.value), page: 1 }))}
              className="h-8 rounded-lg border border-[#E5EAF2] bg-white px-2 text-xs text-[#0D1B2E] focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>

        {list.isError ? (
          <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-semibold text-[#0D1B2E]">Couldn&apos;t load customers</p>
            <p className="mt-1 max-w-sm text-sm text-[#7A90AB]">{errorMessage(list.error)}</p>
            <Button type="button" variant="outline" size="sm" className={cn('mt-4', secondaryBtn)} onClick={() => list.refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
            </Button>
          </div>
        ) : loadingRows ? (
          <div className="divide-y divide-[#EEF2F7]" aria-busy="true" aria-label="Loading customers">
            {Array.from({ length: Math.min(applied.limit, 6) }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/5" /></div>
                <Skeleton className="hidden h-3.5 w-40 md:block" />
                <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
                <Skeleton className="hidden h-3.5 w-20 lg:block" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-500 ring-1 ring-indigo-100">
              <Users className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-semibold text-[#0D1B2E]">{filtered ? 'No customers match these filters' : 'No customers yet'}</p>
            <p className="mt-1 max-w-sm text-sm text-[#7A90AB]">
              {filtered ? 'Try a different search, status or date range.' : 'Customer accounts appear here once people register.'}
            </p>
            {filtered && (
              <Button type="button" variant="outline" size="sm" className={cn('mt-4', secondaryBtn)} onClick={reset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset filters
              </Button>
            )}
          </div>
        ) : (
          <div className={cn('transition-opacity', list.isFetching && 'opacity-60')}>
            {/* md+ table */}
            <div className="hidden md:block">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-[#EEF2F7] bg-[#FAFBFD] text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A90AB]">
                    <th scope="col" className="w-[30%] px-4 py-2.5"><SortHeader label="Customer" field="name" state={applied} onSort={sort} /></th>
                    <th scope="col" className="w-[28%] px-3 py-2.5"><SortHeader label="Contact" field="email" state={applied} onSort={sort} /></th>
                    <th scope="col" className="w-[14%] px-3 py-2.5">Status</th>
                    <th scope="col" className="hidden w-[13%] px-3 py-2.5 lg:table-cell">Wallet · Points</th>
                    <th scope="col" className="w-[13%] px-3 py-2.5"><SortHeader label="Joined" field="createdAt" state={applied} onSort={sort} /></th>
                    <th scope="col" className="w-14 px-4 py-2.5 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {rows.map((c) => {
                    const joined = formatJoined(c.createdAt);
                    const phone = formatBdPhone(c.phone);
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-[#F8FAFE]">
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <CustomerAvatar customer={c} />
                            <div className="min-w-0">
                              <button type="button" onClick={() => setViewId(c.id)} className="block max-w-full truncate text-left font-semibold text-[#0D1B2E] hover:text-indigo-700">
                                {displayName(c)}
                              </button>
                              <CopyId id={c.id} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {c.email ? (
                            <p className="flex min-w-0 items-center gap-1.5 text-[#0D1B2E]"><Mail className="h-3.5 w-3.5 shrink-0 text-[#9AABC1]" aria-hidden /><span className="truncate" title={c.email}>{c.email}</span></p>
                          ) : <p className="text-[#9AABC1]">No email</p>}
                          {phone ? (
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums text-[#3D5068]"><Phone className="h-3.5 w-3.5 shrink-0 text-[#9AABC1]" aria-hidden />{phone}</p>
                          ) : <p className="mt-0.5 text-xs text-[#9AABC1]">No phone</p>}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={accountStatus(c)} />
                          <div className="mt-1"><VerifiedChip verified={c.isVerified} /></div>
                        </td>
                        <td className="hidden px-3 py-3 lg:table-cell">
                          <p className="tabular-nums text-[#0D1B2E]">{formatTaka(c.customerProfile?.wallet ?? 0)}</p>
                          <p className="text-xs tabular-nums text-[#7A90AB]">{(c.customerProfile?.loyaltyPoints ?? 0).toLocaleString('en-BD')} pts</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="whitespace-nowrap text-[#0D1B2E]">{joined.date}</p>
                          {joined.relative && <p className="text-xs text-[#7A90AB]">{joined.relative}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">{actions(c)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* phones: cards */}
            <ul className="divide-y divide-[#EEF2F7] md:hidden">
              {rows.map((c) => {
                const phone = formatBdPhone(c.phone);
                return (
                  <li key={c.id} className="flex items-start gap-3 px-4 py-3.5">
                    <CustomerAvatar customer={c} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#0D1B2E]">{displayName(c)}</p>
                          <CopyId id={c.id} />
                        </div>
                        <div className="-mr-2 -mt-1 shrink-0">{actions(c)}</div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={accountStatus(c)} />
                        <VerifiedChip verified={c.isVerified} />
                      </div>
                      <p className="mt-1.5 truncate text-xs text-[#3D5068]">{c.email || 'No email'}{phone ? ` · ${phone}` : ''}</p>
                      <p className="mt-0.5 text-xs text-[#7A90AB]">
                        Joined {formatJoined(c.createdAt).date} · {formatTaka(c.customerProfile?.wallet ?? 0)} · {(c.customerProfile?.loyaltyPoints ?? 0).toLocaleString('en-BD')} pts
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Pagination */}
        {!list.isError && total > 0 && (
          <nav aria-label="Customer pages" className="flex flex-col gap-2 border-t border-[#EEF2F7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#7A90AB]">{rangeLabel(applied.page, applied.limit, total, rows.length)} · Page {applied.page} of {pages}</p>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="sm" className={cn('h-8 px-2', secondaryBtn)} disabled={applied.page <= 1 || list.isFetching} onClick={() => goPage(applied.page - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pageList(applied.page, pages).map((p, i) =>
                p === '…' ? (
                  <span key={`gap-${i}`} className="px-1 text-xs text-[#9AABC1]">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goPage(p)}
                    aria-current={p === applied.page ? 'page' : undefined}
                    disabled={list.isFetching}
                    className={cn(
                      'h-8 min-w-8 rounded-lg px-2 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300',
                      p === applied.page ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm' : 'text-[#3D5068] hover:bg-[#F1F4F9]',
                    )}
                  >
                    {p}
                  </button>
                ),
              )}
              <Button type="button" variant="outline" size="sm" className={cn('h-8 px-2', secondaryBtn)} disabled={applied.page >= pages || list.isFetching} onClick={() => goPage(applied.page + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        )}
      </section>

      <CustomerDetailSheet id={viewId} onClose={() => setViewId(null)} />

      {/* Suspend */}
      <Dialog open={!!suspendTarget} onOpenChange={(o) => { if (!o && !toggling) setSuspendTarget(null); }}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <form onSubmit={(e) => { e.preventDefault(); suspend(); }} className="space-y-4">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100"><UserX className="h-4 w-4" /></span>
                <div className="space-y-1 text-left">
                  <DialogTitle className="text-base text-[#0D1B2E]">Suspend account?</DialogTitle>
                  <DialogDescription className="text-sm text-[#3D5068]">
                    {suspendTarget ? displayName(suspendTarget) : 'This customer'} won&apos;t be able to use their account until it&apos;s reactivated.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="suspend-reason" className="text-xs font-semibold text-[#3D5068]">Reason <span className="text-rose-500">*</span></Label>
              <Textarea id="suspend-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this account being suspended?" className="rounded-lg border-[#E5EAF2]" />
              <p className="text-[11px] text-[#7A90AB]">Saved to the account&apos;s activity log.</p>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" className={secondaryBtn} disabled={toggling} onClick={() => setSuspendTarget(null)}>Cancel</Button>
              <Button type="submit" className="bg-rose-600 text-white hover:bg-rose-500" disabled={!reason.trim() || toggling}>
                {toggling ? 'Suspending…' : 'Suspend account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reactivate */}
      <Dialog open={!!reactivateTarget} onOpenChange={(o) => { if (!o && !toggling) setReactivateTarget(null); }}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><UserCheck className="h-4 w-4" /></span>
              <div className="space-y-1 text-left">
                <DialogTitle className="text-base text-[#0D1B2E]">Reactivate account?</DialogTitle>
                <DialogDescription className="text-sm text-[#3D5068]">
                  {reactivateTarget ? displayName(reactivateTarget) : 'This customer'} will be able to sign in and order again.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" className={secondaryBtn} disabled={toggling} onClick={() => setReactivateTarget(null)}>Cancel</Button>
            <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-500" disabled={toggling} onClick={reactivate}>
              {toggling ? 'Reactivating…' : 'Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: read-only details from GET /customermanagement/:id
// ---------------------------------------------------------------------------

interface CustomerDetail extends Customer {
  reviews?: unknown[];
  walletTransactions?: unknown[];
  loyaltyTransactions?: unknown[];
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-[#7A90AB]">{label}</dt>
      <dd className="min-w-0 text-right text-[#0D1B2E]">{children}</dd>
    </div>
  );
}

function CustomerDetailSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isFetching, isError, refetch } = useGetCustomerByIdQuery(id ?? '', { skip: !id });
  const c = (id && data?.id === id ? data : null) as CustomerDetail | null;
  const profile = c?.customerProfile;
  const dob = profile?.dateOfBirth ? formatJoined(profile.dateOfBirth).date : null;

  return (
    <Sheet open={!!id} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-[#EEF2F7] px-5 py-4">
          <SheetTitle className="text-base text-[#0D1B2E]">Customer details</SheetTitle>
          <SheetDescription className="text-xs text-[#7A90AB]">Read-only account information.</SheetDescription>
        </SheetHeader>
        {isError ? (
          <div role="alert" className="px-5 py-10 text-center text-sm text-[#3D5068]">
            Couldn&apos;t load this customer.
            <div className="mt-3"><Button size="sm" variant="outline" className={secondaryBtn} onClick={() => refetch()}>Try again</Button></div>
          </div>
        ) : !c || isFetching ? (
          <div className="space-y-3 px-5 py-5" aria-busy="true">
            <div className="flex items-center gap-3"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div></div>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        ) : (
          <div className="px-5 py-5">
            <div className="flex items-center gap-3">
              <CustomerAvatar customer={c} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[#0D1B2E]">{displayName(c)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={accountStatus(c)} />
                  <VerifiedChip verified={c.isVerified} />
                </div>
              </div>
            </div>
            <dl className="mt-4 divide-y divide-[#EEF2F7] rounded-xl border border-[#EEF2F7] px-3">
              <DetailRow label="Customer ID"><span className="break-all font-mono text-xs">{c.id}</span></DetailRow>
              <DetailRow label="Email">{c.email || '—'}</DetailRow>
              <DetailRow label="Phone">{formatBdPhone(c.phone) || '—'}</DetailRow>
              <DetailRow label="Joined">{formatJoined(c.createdAt).date}</DetailRow>
              <DetailRow label="Social verification">{profile?.isVerifiedBySocialMedia ? 'Verified' : 'No'}</DetailRow>
              {profile?.gender && <DetailRow label="Gender"><span className="capitalize">{profile.gender.toLowerCase()}</span></DetailRow>}
              {dob && <DetailRow label="Date of birth">{dob}</DetailRow>}
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                ['Wallet balance', formatTaka(profile?.wallet ?? 0)],
                ['Loyalty points', (profile?.loyaltyPoints ?? 0).toLocaleString('en-BD')],
                ['Reviews', (c.reviews?.length ?? 0).toLocaleString('en-BD')],
                ['Wallet transactions', (c.walletTransactions?.length ?? 0).toLocaleString('en-BD')],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#F8FAFE] px-3 py-2.5 ring-1 ring-[#EEF2F7]">
                  <p className="text-[11px] text-[#7A90AB]">{label}</p>
                  <p className="mt-0.5 font-semibold tabular-nums text-[#0D1B2E]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
