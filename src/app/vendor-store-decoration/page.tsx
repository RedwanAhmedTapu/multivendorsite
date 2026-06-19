"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Eye, Edit2, Archive, Copy, Trash2, Search,
  ChevronDown, CheckCircle, Clock, Layers, LayoutTemplate,
  Building2, ChevronRight, X, Check, AlertTriangle, Loader2,
} from "lucide-react";
import {
  useListDecorationsQuery,
  useCreateDecorationMutation,
  usePublishDecorationMutation,
  useArchiveDecorationMutation,
  useDuplicateDecorationMutation,
  useDeleteDecorationMutation,
  DecorationStatus,
  StoreDecorationSummary,
} from "@/features/storeEditorApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const EDITOR_PATH = "/store-editor"; // adjust to your actual route

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DecorationStatus }) {
  const map: Record<DecorationStatus, { dot: string; text: string; cls: string }> = {
    [DecorationStatus.PUBLISHED]: { dot: "bg-emerald-500", text: "Published",  cls: "bg-emerald-50  text-emerald-700 border-emerald-200" },
    [DecorationStatus.DRAFT]:     { dot: "bg-slate-400",   text: "Draft",      cls: "bg-slate-50   text-slate-600   border-slate-200"  },
    [DecorationStatus.ARCHIVED]:  { dot: "bg-amber-400",   text: "Archived",   cls: "bg-amber-50   text-amber-700   border-amber-200"  },
    [DecorationStatus.SCHEDULED]: { dot: "bg-violet-500",  text: "Scheduled",  cls: "bg-violet-50  text-violet-700  border-violet-200" },
  };
  const { dot, text, cls } = map[status] ?? map[DecorationStatus.DRAFT];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {text}
    </span>
  );
}

// ─── Thumbnail placeholder ─────────────────────────────────────────────────────

function Thumbnail({ color = "#bfdbfe" }: { color?: string }) {
  return (
    <div className="w-20 h-[54px] rounded-lg border border-slate-100 bg-slate-50 flex-shrink-0 overflow-hidden flex flex-col gap-1 p-1.5">
      <div className="w-full h-2 rounded" style={{ background: color }} />
      <div className="w-full h-4 rounded" style={{ background: color + "99" }} />
      <div className="grid grid-cols-2 gap-1">
        <div className="h-2.5 rounded" style={{ background: color + "66" }} />
        <div className="h-2.5 rounded" style={{ background: color + "66" }} />
      </div>
    </div>
  );
}

const THUMB_COLORS = ["#bfdbfe", "#a5f3fc", "#ddd6fe", "#bbf7d0", "#fde68a"];
function thumbColor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return THUMB_COLORS[n % THUMB_COLORS.length];
}

// ─── Dropdown menu ─────────────────────────────────────────────────────────────

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

function DropdownMenu({ items }: { items: DropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
      >
        More
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
          {items.map((item, i) =>
            item.label === "__sep__" ? (
              <div key={i} className="h-px bg-slate-100 my-1" />
            ) : (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => { item.onClick(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  ${item.danger
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <span className={item.danger ? "text-rose-500" : "text-slate-400"}>{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Decoration card ───────────────────────────────────────────────────────────

interface DecorationCardProps {
  store: StoreDecorationSummary;
  isPublished?: boolean;
  onEdit: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function DecorationCard({
  store, isPublished, onEdit, onPublish, onArchive, onDuplicate, onDelete,
}: DecorationCardProps) {
  const menuItems: DropdownItem[] = [
    ...(store.status !== DecorationStatus.PUBLISHED ? [{
      label: "Publish", icon: <CheckCircle size={13} />, onClick: () => onPublish(store.id),
    }] : []),
    { label: "Duplicate", icon: <Copy size={13} />, onClick: () => onDuplicate(store.id) },
    ...(store.status !== DecorationStatus.ARCHIVED ? [{
      label: "Archive", icon: <Archive size={13} />, onClick: () => onArchive(store.id),
    }] : []),
    { label: "__sep__", icon: null, onClick: () => {} },
    {
      label: "Delete", icon: <Trash2 size={13} />, danger: true,
      disabled: store.status === DecorationStatus.PUBLISHED,
      onClick: () => onDelete(store.id),
    },
  ];

  return (
    <div className={`bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 overflow-hidden
      ${isPublished ? "border-l-[3px] border-l-cyan-500" : ""}`}
    >
      <div className="flex items-center gap-3.5 p-4">
        <Thumbnail color={thumbColor(store.id)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-700 truncate max-w-[240px]">
              {store.name}
            </span>
            {store.isDefault && (
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded-md px-1.5 py-0.5">
                Default
              </span>
            )}
            <StatusBadge status={store.status} />
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={10} /> {fmtDate(store.updatedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Layers size={10} /> {store._count.components} components
            </span>
            <span className="flex items-center gap-1">
              <LayoutTemplate size={10} /> v{store.version}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(store.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white
              bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl
              hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200
              transition-all hover:shadow-md active:scale-95"
          >
            <Edit2 size={12} /> Edit
          </button>
          <DropdownMenu items={menuItems} />
        </div>
      </div>
    </div>
  );
}

// ─── Create Modal ──────────────────────────────────────────────────────────────

function CreateModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setName(""); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => { if (name.trim()) onConfirm(name.trim()); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-cyan-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm">
              <Plus size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-700 text-sm">Create new version</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-4">Give your new page layout a name to get started.</p>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Summer sale homepage"
            maxLength={60}
            className="w-full bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700
              placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100
              transition-all mb-5"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white
                bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl
                hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50
                shadow-sm shadow-blue-200 transition-all active:scale-95"
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {isLoading ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState { msg: string; type: "success" | "error" }

function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-5 right-5 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
      ${toast.type === "success"
        ? "bg-slate-800 text-white"
        : "bg-rose-50 text-rose-700 border border-rose-200"
      }`}
    >
      {toast.type === "success"
        ? <Check size={14} className="text-emerald-400" />
        : <AlertTriangle size={14} />
      }
      {toast.msg}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, valueColor }: { label: string; value: number; icon: React.ReactNode; valueColor?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-extrabold ${valueColor ?? "text-slate-700"}`}>{value}</div>
    </div>
  );
}

// ─── Filter button ─────────────────────────────────────────────────────────────

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all
        ${active
          ? "bg-blue-50 border-blue-300 text-blue-600"
          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
        }`}
    >
      {label}
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type FilterType = "all" | DecorationStatus.DRAFT | DecorationStatus.ARCHIVED;
type TabType = "homepage" | "custom";

export default function StoreDecorationDashboard() {
  const [activeTab, setActiveTab]       = useState<TabType>("homepage");
  const [filterStatus, setFilterStatus] = useState<FilterType>("all");
  const [search, setSearch]             = useState("");
  const [createOpen, setCreateOpen]     = useState(false);
  const [toast, setToast]               = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── API hooks ──────────────────────────────────────────────────────────────
  const { data: listData, isLoading } = useListDecorationsQuery();

  const [createDecoration, { isLoading: isCreating }] = useCreateDecorationMutation();
  const [publishDecoration]                           = usePublishDecorationMutation();
  const [archiveDecoration]                           = useArchiveDecorationMutation();
  const [duplicateDecoration]                         = useDuplicateDecorationMutation();
  const [deleteDecoration]                            = useDeleteDecorationMutation();

  const stores = listData?.data ?? [];

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Derived lists ──────────────────────────────────────────────────────────
  const published = stores.filter((s) => s.status === DecorationStatus.PUBLISHED);
  const unpublished = stores.filter((s) => s.status !== DecorationStatus.PUBLISHED).filter((s) => {
    const matchQ = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchF = filterStatus === "all" || s.status === filterStatus;
    return matchQ && matchF;
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const openEditor = (id: string) => {
    window.open(`${EDITOR_PATH}?decorationId=${id}`, "_blank");
  };

  const handleCreate = async (name: string) => {
    try {
      await createDecoration({ name, isDefault: false }).unwrap();
      setCreateOpen(false);
      showToast(`"${name}" created.`);
    } catch {
      showToast("Failed to create page.", "error");
    }
  };

  const handlePublish = async (id: string) => {
    const store = stores.find((s) => s.id === id);
    try {
      await publishDecoration(id).unwrap();
      showToast(`"${store?.name}" is now published.`);
    } catch {
      showToast("Failed to publish.", "error");
    }
  };

  const handleArchive = async (id: string) => {
    const store = stores.find((s) => s.id === id);
    try {
      await archiveDecoration(id).unwrap();
      showToast(`"${store?.name}" archived.`);
    } catch {
      showToast("Failed to archive.", "error");
    }
  };

  const handleDuplicate = async (id: string) => {
    const store = stores.find((s) => s.id === id);
    try {
      await duplicateDecoration({ id, data: { name: `${store?.name} (copy)` } }).unwrap();
      showToast(`Duplicated "${store?.name}".`);
    } catch {
      showToast("Failed to duplicate.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const store = stores.find((s) => s.id === id);
    if (store?.status === DecorationStatus.PUBLISHED) {
      showToast("Cannot delete a published page.", "error");
      return;
    }
    try {
      await deleteDecoration(id).unwrap();
      showToast(`"${store?.name}" deleted.`);
    } catch {
      showToast("Failed to delete.", "error");
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const statPub   = stores.filter((s) => s.status === DecorationStatus.PUBLISHED).length;
  const statDraft = stores.filter((s) => s.status === DecorationStatus.DRAFT).length;
  const statArch  = stores.filter((s) => s.status === DecorationStatus.ARCHIVED).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans text-slate-800">

      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-40 shadow-sm shadow-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-600">
              <Building2 size={14} />
              <span>ERP</span>
            </div>
            <ChevronRight size={12} />
            <span className="text-slate-500">Store</span>
            <ChevronRight size={12} />
            <span className="font-semibold text-slate-700">Page Decoration</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              <Eye size={12} /> Preview live
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-200 transition-all hover:shadow-lg active:scale-95"
            >
              <Plus size={13} /> Create new version
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 sm:py-7">

        {/* Page title */}
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Store page decoration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Design and publish your storefront layouts</p>
        </div>

        {/* Stats row */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-cyan-500">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm font-medium text-slate-600">Loading decorations…</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total pages"  value={stores.length} icon={<LayoutTemplate size={11} />} />
              <StatCard label="Published"    value={statPub}   icon={<CheckCircle size={11} className="text-emerald-500" />} valueColor="text-emerald-600" />
              <StatCard label="Drafts"       value={statDraft}  icon={<Edit2 size={11} className="text-violet-500" />}        valueColor="text-violet-600" />
              <StatCard label="Archived"     value={statArch}  icon={<Archive size={11} className="text-amber-500" />}        valueColor="text-amber-600"  />
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-blue-100 mb-6">
              {(["homepage", "custom"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors
                    ${activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {tab === "homepage" ? "Store Homepage" : "Customized Page"}
                </button>
              ))}
            </div>

            {activeTab === "homepage" && (
              <div className="flex flex-col gap-6">

                {/* Published section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={14} className="text-cyan-500" />
                    <span className="text-sm font-bold text-slate-700">Current published page</span>
                  </div>
                  {published.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-blue-100 px-6 py-10 text-center">
                      <LayoutTemplate size={28} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">No published page</p>
                      <p className="text-xs text-slate-300 mt-1">Publish a draft to make your store live.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {published.map((s) => (
                        <DecorationCard
                          key={s.id}
                          store={s}
                          isPublished
                          onEdit={openEditor}
                          onPublish={handlePublish}
                          onArchive={handleArchive}
                          onDuplicate={handleDuplicate}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />

                {/* Unpublished section */}
                <section>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Edit2 size={14} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">Unpublished pages</span>
                      {unpublished.length > 0 && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                          {unpublished.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all active:scale-95"
                    >
                      <Plus size={12} /> Create new version
                    </button>
                  </div>

                  {/* Search & filter */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-cyan-200 rounded-xl px-3 py-2 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
                      <Search size={13} className="text-cyan-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search page name…"
                        className="flex-1 text-sm text-slate-700 bg-transparent outline-none placeholder-slate-300"
                      />
                      {search && (
                        <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500 transition-colors">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <FilterBtn label="All"      active={filterStatus === "all"}                    onClick={() => setFilterStatus("all")} />
                      <FilterBtn label="Draft"    active={filterStatus === DecorationStatus.DRAFT}    onClick={() => setFilterStatus(DecorationStatus.DRAFT)} />
                      <FilterBtn label="Archived" active={filterStatus === DecorationStatus.ARCHIVED} onClick={() => setFilterStatus(DecorationStatus.ARCHIVED)} />
                    </div>
                  </div>

                  {unpublished.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-blue-100 px-6 py-10 text-center">
                      <Search size={28} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">No pages match</p>
                      <p className="text-xs text-slate-300 mt-1">Try adjusting your search or filter.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {unpublished.map((s) => (
                        <DecorationCard
                          key={s.id}
                          store={s}
                          onEdit={openEditor}
                          onPublish={handlePublish}
                          onArchive={handleArchive}
                          onDuplicate={handleDuplicate}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === "custom" && (
              <div className="bg-white rounded-2xl border border-blue-100 shadow-sm px-6 py-16 text-center">
                <LayoutTemplate size={36} className="mx-auto mb-4 text-slate-200" />
                <p className="text-sm font-bold text-slate-500 mb-1">No customized pages yet</p>
                <p className="text-xs text-slate-400 mb-5">Create a new version to design a custom page layout.</p>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-200 transition-all active:scale-95"
                >
                  <Plus size={13} /> Create page
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals & overlays */}
      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onConfirm={handleCreate}
        isLoading={isCreating}
      />

      <Toast toast={toast} />
    </div>
  );
}