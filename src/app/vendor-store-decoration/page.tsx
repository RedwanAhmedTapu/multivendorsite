
"use client"
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, Eye, Edit2, Archive, Copy, Trash2, Search,
  ChevronDown, CheckCircle, Clock, LayoutTemplate,
  Building2, ChevronRight, X, Check, AlertTriangle, Loader2,
  Smartphone, Monitor,
} from "lucide-react";
import {
  useListDecorationsQuery,
  useGetDecorationQuery,
  useCreateDecorationMutation,
  usePublishDecorationMutation,
  useArchiveDecorationMutation,
  useDuplicateDecorationMutation,
  useDeleteDecorationMutation,
  DecorationStatus,
  StoreDecorationSummary,
  ComponentType,
} from "@/features/storeEditorApi";
import { PreviewArea } from "../store-editor/PreviewArea";
import { ActiveModule } from "../store-editor/page";

// ─── Constants ────────────────────────────────────────────────────────────────

const EDITOR_PATH = "/store-editor";

const COMPONENT_TYPE_TO_MODULE: Record<ComponentType, { type: string; name: string; icon: string }> = {
  [ComponentType.STORE_BANNER]:      { type: "categoryBar",              name: "Category bar",             icon: "//id-live.slatic.net/original/7075aee0e853ad8e1042f3a3cfcccdaa.png" },
  [ComponentType.BANNER]:            { type: "graphicCarousel",          name: "Banner Carousel",           icon: "https://img.alicdn.com/imgextra/i1/O1CN01jXJ1ln1XYHH3YYADF_!!6000000002935-2-tps-72-73.png" },
  [ComponentType.COUNTDOWN_TIMER]:   { type: "countdownProduct",         name: "Countdown Products",        icon: "https://img.alicdn.com/imgextra/i1/O1CN01rPIhBB29LrwPfWVjR_!!6000000008052-2-tps-72-72.png" },
  [ComponentType.PRODUCT_CAROUSEL]:  { type: "carouselProductRecommend", name: "Products Carousel",         icon: "https://img.alicdn.com/imgextra/i2/O1CN01dWvm7F1lwvCeEJVm3_!!6000000004884-2-tps-72-72.png" },
  [ComponentType.PRODUCT_GRID]:      { type: "productRecommendation",    name: "Product Recommendation",    icon: "https://img.alicdn.com/imgextra/i1/O1CN01yA59ze1UDGFbMnQpX_!!6000000002483-2-tps-72-72.png" },
  [ComponentType.VOUCHER_PROMOTION]: { type: "voucher",                  name: "Voucher",                   icon: "https://img.alicdn.com/imgextra/i4/O1CN01uP1UbS1Jx67M1QR0L_!!6000000001094-2-tps-72-72.png" },
  [ComponentType.CATEGORY_SLIDER]:   { type: "brandList",                name: "Category List",             icon: "https://img.alicdn.com/imgextra/i2/O1CN01uaqewq1m3KkZnwwrP_!!6000000004898-2-tps-72-73.png" },
  [ComponentType.CATEGORY_GRID]:     { type: "categoryAuto",             name: "Smart Category Navigation", icon: "https://img.alicdn.com/imgextra/i4/O1CN01TEAeTy1x10VqTecnr_!!6000000006382-2-tps-72-72.png" },
  [ComponentType.FEATURED_PRODUCTS]: { type: "productRecommendation",    name: "Featured Products",         icon: "https://img.alicdn.com/imgextra/i1/O1CN01yA59ze1UDGFbMnQpX_!!6000000002483-2-tps-72-72.png" },
};

const DEFAULT_HEADER_FORM_DATA: Record<string, any> = {
  headerBgColor: "#0f172a",
  headerBgImageMobile: undefined,
  headerBgImageDesktop: undefined,
  headerOverlayOpacity: 0,
  storeNameColor: "#ffffff",
  followersColor: "#cbd5e1",
  iconsColor: "#f59e0b",
  logoRingColor: "#ffffff",
  chatButtonColor: "#f97316",
  chatButtonTextColor: "#ffffff",
  showLogo: true,
  showStoreName: true,
  showFollowers: true,
  showRating: true,
  showVerifiedBadge: true,
  showChatButton: true,
  isVisible: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function componentToFormData(c: {
  isVisible: boolean;
  config?: {
    autoSlide?: boolean;
    slideInterval?: number | null;
    countdownEndDate?: string | null;
    showProductPrice?: boolean;
    showProductRating?: boolean;
    showAddToCart?: boolean;
    bannerImage?: string | null;
    settings?: Record<string, unknown> | null;
  } | null;
}): Record<string, any> {
  const cfg      = c.config ?? {};
  const settings = (cfg.settings as Record<string, unknown>) ?? {};
  return {
    isVisible:         c.isVisible ?? true,
    autoSlide:         cfg.autoSlide,
    slideInterval:     cfg.slideInterval,
    countdownEndDate:  cfg.countdownEndDate,
    showProductPrice:  cfg.showProductPrice,
    showProductRating: cfg.showProductRating,
    showAddToCart:     cfg.showAddToCart,
    bannerImage:       cfg.bannerImage,
    ...settings,
  };
}

function buildPreviewData(detail: { components?: any[] } | undefined): {
  activeModules: ActiveModule[];
  formDataMap: Record<string, any>;
} {
  const components = detail?.components ?? [];
  const sorted = [...components].sort((a, b) => a.sortOrder - b.sortOrder);

  const activeModules: ActiveModule[] = sorted.map((c) => {
    const meta = COMPONENT_TYPE_TO_MODULE[c.type as ComponentType];
    return {
      id:   `${meta?.type ?? c.type}_${String(c.id).slice(-8)}`,
      name: meta?.name ?? c.type,
      icon: meta?.icon ?? "",
      type: meta?.type ?? c.type,
    };
  });

  const formDataMap: Record<string, any> = {};
  sorted.forEach((c, i) => {
    const localId = activeModules[i].id;
    const meta    = COMPONENT_TYPE_TO_MODULE[c.type as ComponentType];
    const base    = meta?.type === "categoryBar" ? DEFAULT_HEADER_FORM_DATA : {};
    formDataMap[localId] = { ...base, ...componentToFormData(c) };
  });

  return { activeModules, formDataMap };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Scrollbar hide ───────────────────────────────────────────────────────────

function HideScrollbarStyle() {
  return (
    <style>{`
      .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      .no-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
    `}</style>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DecorationStatus }) {
  const map: Record<DecorationStatus, { dot: string; text: string; cls: string }> = {
    [DecorationStatus.PUBLISHED]: { dot: "bg-emerald-500", text: "Published",  cls: "bg-emerald-50  text-emerald-700 border-emerald-200" },
    [DecorationStatus.DRAFT]:     { dot: "bg-slate-400",   text: "Draft",      cls: "bg-slate-50   text-slate-600   border-slate-200"   },
    [DecorationStatus.ARCHIVED]:  { dot: "bg-amber-400",   text: "Archived",   cls: "bg-amber-50   text-amber-700   border-amber-200"   },
    [DecorationStatus.SCHEDULED]: { dot: "bg-violet-500",  text: "Scheduled",  cls: "bg-violet-50  text-violet-700  border-violet-200"  },
  };
  const { dot, text, cls } = map[status] ?? map[DecorationStatus.DRAFT];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {text}
    </span>
  );
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function Thumbnail({ color = "#bfdbfe" }: { color?: string }) {
  return (
    <div className="w-16 h-11 rounded-lg border border-slate-100 bg-slate-50 flex-shrink-0 overflow-hidden flex flex-col gap-1 p-1.5">
      <div className="w-full h-2 rounded" style={{ background: color }} />
      <div className="w-full h-3 rounded" style={{ background: color + "99" }} />
      <div className="grid grid-cols-2 gap-1">
        <div className="h-2 rounded" style={{ background: color + "66" }} />
        <div className="h-2 rounded" style={{ background: color + "66" }} />
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

// ─── Dropdown ─────────────────────────────────────────────────────────────────

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

function DropdownMenu({ items }: { items: DropdownItem[] }) {
  const [open, setOpen]     = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef              = useRef<HTMLButtonElement>(null);
  const menuRef             = useRef<HTMLDivElement>(null);
  const MENU_WIDTH          = 176;

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    setCoords({ top: r.bottom + 6, left });
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) place();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
      >
        <span className="hidden sm:inline">More</span>
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
          className="bg-white border border-slate-200 rounded-xl shadow-xl z-[100] overflow-hidden py-1"
        >
          {items.map((item, i) =>
            item.label === "__sep__" ? (
              <div key={i} className="h-px bg-slate-100 my-1" />
            ) : (
              <button
                key={i}
                disabled={item.disabled}
                onClick={(e) => { e.stopPropagation(); item.onClick(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  ${item.danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <span className={item.danger ? "text-rose-500" : "text-slate-400"}>{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </>
  );
}

// ─── Page Row ─────────────────────────────────────────────────────────────────

interface PageRowProps {
  store: StoreDecorationSummary;
  isPublished?: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function PageRow({ store, isPublished, isSelected, onSelect, onEdit, onPublish, onArchive, onDuplicate, onDelete }: PageRowProps) {
  const menuItems: DropdownItem[] = [
    ...(store.status !== DecorationStatus.PUBLISHED
      ? [{ label: "Publish",   icon: <CheckCircle size={13} />, onClick: () => onPublish(store.id) }]
      : []),
    { label: "Duplicate", icon: <Copy size={13} />,    onClick: () => onDuplicate(store.id) },
    ...(store.status !== DecorationStatus.ARCHIVED
      ? [{ label: "Archive",   icon: <Archive size={13} />,     onClick: () => onArchive(store.id) }]
      : []),
    { label: "__sep__",   icon: null,                   onClick: () => {} },
    {
      label: "Delete", icon: <Trash2 size={13} />, danger: true,
      disabled: store.status === DecorationStatus.PUBLISHED,
      onClick: () => onDelete(store.id),
    },
  ];

  return (
    <div
      onClick={() => onSelect(store.id)}
      className={`bg-white rounded-2xl border shadow-sm shadow-blue-50 cursor-pointer transition-all
        ${isSelected ? "border-cyan-300 ring-2 ring-cyan-100" : "border-blue-100 hover:border-cyan-200"}
        ${isPublished ? "border-l-[3px] border-l-cyan-500" : ""}`}
    >
      <div className="flex items-center gap-3 p-3.5">
        <div className="rounded-lg overflow-hidden flex-shrink-0">
          <Thumbnail color={thumbColor(store.id)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-700 truncate max-w-[120px] sm:max-w-[200px]">
              {store.name}
            </span>
            {store.isDefault && (
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded-md px-1.5 py-0.5">
                Default
              </span>
            )}
            <StatusBadge status={store.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={10} /> {fmtDate(store.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(store.id); }}
            title="Preview"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Eye size={12} /> <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(store.id); }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white
              bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl
              hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200
              transition-all hover:shadow-md active:scale-95"
          >
            <Edit2 size={12} /> <span className="hidden sm:inline">Edit</span>
          </button>
          <DropdownMenu items={menuItems} />
        </div>
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  open, onClose, onConfirm, isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const inputRef        = useRef<HTMLInputElement>(null);

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
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
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
      ${toast.type === "success" ? "bg-slate-800 text-white" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
    >
      {toast.type === "success"
        ? <Check size={14} className="text-emerald-400" />
        : <AlertTriangle size={14} />}
      {toast.msg}
    </div>
  );
}

// ─── Filter button ────────────────────────────────────────────────────────────

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap
        ${active ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
    >
      {label}
    </button>
  );
}

// ─── Device Frame ─────────────────────────────────────────────────────────────

function DeviceFrame({ viewMode, children }: { viewMode: "mobile" | "desktop"; children: React.ReactNode }) {
  if (viewMode === "mobile") {
    return (
      // maxWidth 391 = 375px canvas + 8px border each side
      <div className="relative mx-auto w-full" style={{ maxWidth: 391 }}>
        <div className="rounded-[2.25rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden">
          <div className="relative bg-white rounded-[1.5rem] overflow-hidden h-[70vh] max-h-[680px] min-h-[500px]">
            {/* Pill notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-slate-900 rounded-full z-10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
            <div className="no-scrollbar h-full overflow-y-auto overflow-x-hidden pt-5">
              {children}
            </div>
          </div>
        </div>
        {/* Home indicator */}
        <div className="h-1.5 w-24 bg-slate-300 rounded-full mx-auto mt-2" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border-[8px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Top bezel with camera dot */}
        <div className="flex items-center justify-center py-1.5 bg-slate-900">
          <div className="w-2 h-2 rounded-full bg-slate-700" />
        </div>
        <div className="no-scrollbar bg-white overflow-y-auto overflow-x-hidden h-[70vh] max-h-[680px] min-h-[500px]">
          {children}
        </div>
      </div>
      {/* Monitor stand */}
      <div className="flex flex-col items-center">
        <div className="h-4 w-16 bg-slate-700" />
        <div className="h-2 w-32 bg-slate-300 rounded-b-xl" />
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type FilterType = "all" | DecorationStatus.DRAFT | DecorationStatus.ARCHIVED;

export default function StoreDecorationDashboard() {
  const [viewMode,     setViewMode]     = useState<"mobile" | "desktop">("mobile");
  const [filterStatus, setFilterStatus] = useState<FilterType>("all");
  const [search,       setSearch]       = useState("");
  const [createOpen,   setCreateOpen]   = useState(false);
  const [toast,        setToast]        = useState<ToastState | null>(null);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── API ────────────────────────────────────────────────────────────────────
  const { data: listData, isLoading } = useListDecorationsQuery();

  const [createDecoration,   { isLoading: isCreating }] = useCreateDecorationMutation();
  const [publishDecoration]                              = usePublishDecorationMutation();
  const [archiveDecoration]                              = useArchiveDecorationMutation();
  const [duplicateDecoration]                            = useDuplicateDecorationMutation();
  const [deleteDecoration]                               = useDeleteDecorationMutation();

  const stores = listData?.data ?? [];

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Derived lists ──────────────────────────────────────────────────────────
  const published   = stores.filter((s) => s.status === DecorationStatus.PUBLISHED);
  const unpublished = stores
    .filter((s) => s.status !== DecorationStatus.PUBLISHED)
    .filter((s) => {
      const matchQ = !search || s.name.toLowerCase().includes(search.toLowerCase());
      const matchF = filterStatus === "all" || s.status === filterStatus;
      return matchQ && matchF;
    });

  // ── Auto-select: prefer published, else first ──────────────────────────────
  useEffect(() => {
    if (selectedId && stores.some((s) => s.id === selectedId)) return;
    const fallback = published[0]?.id ?? stores[0]?.id ?? null;
    if (fallback) setSelectedId(fallback);
  }, [stores, published, selectedId]);

  const selectedStore = stores.find((s) => s.id === selectedId) ?? null;

  // ── Fetch full decoration detail for preview ───────────────────────────────
  // useListDecorationsQuery returns lightweight StoreDecorationSummary objects
  // that contain no component data. We call useGetDecorationQuery separately
  // to get the full component tree needed to build the preview canvas.
  const { data: decorationDetail, isFetching: isPreviewLoading } =
    useGetDecorationQuery(selectedId!, { skip: !selectedId });

  const { activeModules: previewModules, formDataMap: previewFormDataMap } = useMemo(
    () => buildPreviewData(decorationDetail?.data),
    [decorationDetail],
  );

  // ── Actions ────────────────────────────────────────────────────────────────
  const openEditor = (id: string) => window.open(`${EDITOR_PATH}?decorationId=${id}`, "_blank");

  const handleCreate = async (name: string) => {
    try {
      await createDecoration({ name, isDefault: false }).unwrap();
      setCreateOpen(false);
      showToast(`"${name}" created.`);
    } catch { showToast("Failed to create page.", "error"); }
  };

  const handlePublish = async (id: string) => {
    const store = stores.find((s) => s.id === id);
    try {
      await publishDecoration(id).unwrap();
      showToast(`"${store?.name}" is now published.`);
    } catch { showToast("Failed to publish.", "error"); }
  };

  const handleArchive = async (id: string) => {
    const store = stores.find((s) => s.id === id);
    try {
      await archiveDecoration(id).unwrap();
      showToast(`"${store?.name}" archived.`);
    } catch { showToast("Failed to archive.", "error"); }
  };

  const handleDuplicate = async (id: string) => {
    const store = stores.find((s) => s.id === id);
    try {
      await duplicateDecoration({ id, data: { name: `${store?.name} (copy)` } }).unwrap();
      showToast(`Duplicated "${store?.name}".`);
    } catch { showToast("Failed to duplicate.", "error"); }
  };

  const handleDelete = async (id: string) => {
    const store = stores.find((s) => s.id === id);
    if (store?.status === DecorationStatus.PUBLISHED) {
      showToast("Cannot delete a published page.", "error");
      return;
    }
    try {
      await deleteDecoration(id).unwrap();
      if (selectedId === id) setSelectedId(null);
      showToast(`"${store?.name}" deleted.`);
    } catch { showToast("Failed to delete.", "error"); }
  };

  // Read-only preview — module actions live inside the real editor
  const noop = () => {};

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans text-slate-800 overflow-hidden">
      <HideScrollbarStyle />

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm shadow-blue-50 flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-600 flex-shrink-0">
              <Building2 size={14} />
              <span className="hidden sm:inline">ERP</span>
            </div>
            <ChevronRight size={12} className="flex-shrink-0 hidden sm:block" />
            <span className="text-slate-500 truncate hidden sm:block">Store</span>
            <ChevronRight size={12} className="flex-shrink-0 hidden sm:block" />
            <span className="font-semibold text-slate-700 truncate">Page Decoration</span>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-200 transition-all hover:shadow-lg active:scale-95 flex-shrink-0"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Create new version</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center gap-3">
          <Loader2 size={22} className="animate-spin text-cyan-500" />
          <span className="text-sm font-medium text-slate-500">Loading decorations…</span>
        </div>
      ) : (
        /**
         * Two-column layout (lg and up):
         *   LEFT  — fixed-width preview panel with device frame
         *   RIGHT — scrollable page list (published + unpublished)
         *
         * Below lg the columns stack vertically.
         */
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row">

            {/* ══════════════════════════════════════════════════════════════
                LEFT — Preview panel
            ══════════════════════════════════════════════════════════════ */}
            <div className="
              flex-shrink-0
              w-full lg:w-[420px] xl:w-[500px]
              flex flex-col
              bg-white/70 border-b lg:border-b-0 lg:border-r border-blue-100
              lg:h-full
            ">
              {/* Panel top bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-blue-50 flex-shrink-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Live Preview
                </span>
                {/* View-mode toggle */}
                <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("mobile")}
                    title="Mobile"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                      ${viewMode === "mobile"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Smartphone size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode("desktop")}
                    title="Desktop"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                      ${viewMode === "desktop"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Monitor size={14} />
                  </button>
                </div>
              </div>

              {/* Scrollable preview area */}
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col items-center justify-start px-4 py-6 gap-5">
                {selectedStore ? (
                  <>
                    <DeviceFrame viewMode={viewMode}>
                      {isPreviewLoading ? (
                        <div className="flex items-center justify-center h-full gap-2 text-slate-400">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-xs font-medium">Loading preview…</span>
                        </div>
                      ) : previewModules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300 px-8 text-center">
                          <LayoutTemplate size={28} />
                          <p className="text-xs font-semibold text-slate-400">No components yet</p>
                          <p className="text-[11px]">Click Edit to start building this page.</p>
                        </div>
                      ) : (
                        <PreviewArea
                          key={`${selectedStore.id}-${viewMode}`}
                          activeModules={previewModules}
                          onModuleDrop={noop}
                          selectedModuleId={null}
                          onModuleSelect={noop}
                          onMoveUp={noop}
                          onMoveDown={noop}
                          onCopy={noop}
                          onDelete={noop}
                          currentView={viewMode}
                          formDataMap={previewFormDataMap}
                        />
                      )}
                    </DeviceFrame>

                    {/* Meta + quick edit button */}
                    <div className="text-center flex-shrink-0 pb-2">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-sm font-bold text-slate-700">{selectedStore.name}</span>
                        <StatusBadge status={selectedStore.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Last updated {fmtDate(selectedStore.updatedAt)}
                      </p>
                      <button
                        onClick={() => openEditor(selectedStore.id)}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white
                          bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl
                          hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200
                          transition-all hover:shadow-md active:scale-95"
                      >
                        <Edit2 size={12} /> Edit this page
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-[420px] rounded-2xl border border-dashed border-slate-200">
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <LayoutTemplate size={28} />
                      <span className="text-sm font-medium">Select a page to preview</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                RIGHT — Page list
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 lg:h-full flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 sm:px-6 py-6 flex flex-col gap-6">

                {/* ── Published ── */}
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
                        <PageRow
                          key={s.id}
                          store={s}
                          isPublished
                          isSelected={s.id === selectedId}
                          onSelect={setSelectedId}
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
                <div className="h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent flex-shrink-0" />

                {/* ── Unpublished ── */}
                <section className="flex flex-col gap-4">
                  {/* Section header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
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
                      <Plus size={12} />
                      <span className="hidden sm:inline">Create new version</span>
                      <span className="sm:hidden">Create</span>
                    </button>
                  </div>

                  {/* Search & filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex-1 min-w-[160px] flex items-center gap-2 bg-white border border-cyan-200 rounded-xl px-3 py-2 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
                      <Search size={13} className="text-cyan-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search page name…"
                        className="flex-1 text-sm text-slate-700 bg-transparent outline-none placeholder-slate-300 min-w-0"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <FilterBtn label="All"      active={filterStatus === "all"}                    onClick={() => setFilterStatus("all")} />
                      <FilterBtn label="Draft"    active={filterStatus === DecorationStatus.DRAFT}    onClick={() => setFilterStatus(DecorationStatus.DRAFT)} />
                      <FilterBtn label="Archived" active={filterStatus === DecorationStatus.ARCHIVED} onClick={() => setFilterStatus(DecorationStatus.ARCHIVED)} />
                    </div>
                  </div>

                  {/* List or empty */}
                  {unpublished.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-blue-100 px-6 py-10 text-center">
                      <Search size={28} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">No pages match</p>
                      <p className="text-xs text-slate-300 mt-1">Try adjusting your search or filter.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {unpublished.map((s) => (
                        <PageRow
                          key={s.id}
                          store={s}
                          isSelected={s.id === selectedId}
                          onSelect={setSelectedId}
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

                <div className="h-4 flex-shrink-0" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
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