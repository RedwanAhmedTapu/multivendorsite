"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import { StoreModulesSidebar } from "./StoreModulesSidebar";
import { ModuleDemoModal } from "./ModuleDemoModal";
import { PreviewArea } from "./PreviewArea";
import { ConfigurationForm } from "./ConfigurationForm";
import { ChevronRight, ChevronLeft, Loader2, AlertTriangle, X, Trash2 } from "lucide-react";
import { ModulesGallery } from "./ModulesGallery";
import { TopBar } from "./TopBar";
import {
  useGetDecorationQuery,
  useListDecorationsQuery,
  useCreateDecorationMutation,
  useAddComponentMutation,
  useDeleteComponentMutation,
  useReorderComponentsMutation,
  ComponentType,
} from "@/features/storeEditorApi";
import { RootState } from "@/store/store";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModuleItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  disabled?: boolean;
  hot?: boolean;
}

export interface ModuleCategory {
  name: string;
  items: ModuleItem[];
}

export interface ActiveModule {
  id: string;
  name: string;
  icon: string;
  type: string;
  dbComponentId?: string;
}

// ─── Type mappings ────────────────────────────────────────────────────────────

const TYPE_TO_COMPONENT_TYPE: Record<string, ComponentType> = {
  categoryBar:              ComponentType.STORE_BANNER,
  graphicCarousel:          ComponentType.BANNER,
  graphicThreeImages:       ComponentType.BANNER,
  graphicOneImage:          ComponentType.BANNER,
  countdownProduct:         ComponentType.COUNTDOWN_TIMER,
  carouselProductRecommend: ComponentType.PRODUCT_CAROUSEL,
  productRecommendation:    ComponentType.PRODUCT_GRID,
  voucher:                  ComponentType.VOUCHER_PROMOTION,
  brandList:                ComponentType.CATEGORY_SLIDER,
  categoryAuto:             ComponentType.CATEGORY_GRID,
};

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

const INITIAL_MODULES: ActiveModule[] = [
  { id: "categoryBar_25723109",        name: "Category bar",       icon: "//id-live.slatic.net/original/7075aee0e853ad8e1042f3a3cfcccdaa.png",                           type: "categoryBar" },
  { id: "graphicThreeImages_26179633", name: "Three banners",      icon: "https://img.alicdn.com/imgextra/i3/O1CN01jm3FKE1rlMuQPP8cj_!!6000000005671-2-tps-72-73.png", type: "graphicThreeImages" },
  { id: "countdownProduct_26176877",   name: "Countdown Products", icon: "https://img.alicdn.com/imgextra/i1/O1CN01rPIhBB29LrwPfWVjR_!!6000000008052-2-tps-72-72.png", type: "countdownProduct" },
  { id: "graphicCarousel_26212860",    name: "Banner Carousel",    icon: "https://img.alicdn.com/imgextra/i1/O1CN01jXJ1ln1XYHH3YYADF_!!6000000002935-2-tps-72-73.png", type: "graphicCarousel" },
];

// ─── Helper: build formData from a backend component ─────────────────────────

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
    // Spreads everything from settings:
    // headerBgColor, storeNameColor, chatButtonColor, bannerImages, etc.
    ...settings,
  };
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteModalProps {
  moduleName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmModal({ moduleName, onConfirm, onCancel, isDeleting }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-rose-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
              <Trash2 size={15} className="text-rose-500" />
            </div>
            <span className="font-bold text-slate-700 text-sm">Delete component</span>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3 mb-5 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-0.5">
                Delete &ldquo;{moduleName}&rdquo;?
              </p>
              <p className="text-xs text-slate-500">
                This will permanently remove the component and all its configuration. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 disabled:opacity-60 shadow-sm shadow-rose-200 transition-all active:scale-95"
            >
              {isDeleting
                ? <><Loader2 size={12} className="animate-spin" /> Deleting&hellip;</>
                : <><Trash2 size={12} /> Delete permanently</>
              }
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
    <div className={`fixed bottom-5 right-5 z-[300] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-none transition-all
      ${toast.type === "success" ? "bg-slate-800 text-white" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
    >
      {toast.type === "success"
        ? <div className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        : <AlertTriangle size={14} className="flex-shrink-0" />
      }
      {toast.msg}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const StoreLayoutEditor = () => {
  const searchParams    = useSearchParams();
  const urlDecorationId = searchParams.get("decorationId") ?? undefined;

  const [showStoreModules, setShowStoreModules]         = useState(true);
  const [selectedModule, setSelectedModule]             = useState<ModuleItem | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen]           = useState(false);
  const [sidebarWidth, setSidebarWidth]                 = useState(280);
  const [showRightPanel, setShowRightPanel]             = useState(true);
  const [showConfigForm, setShowConfigForm]             = useState(false);
  const [selectedActiveModule, setSelectedActiveModule] = useState<ActiveModule | null>(null);
  const [currentView, setCurrentView]                   = useState<"mobile" | "desktop">("mobile");
  const [formDataMap, setFormDataMap]                   = useState<Record<string, any>>({});
  const [activeModules, setActiveModules]               = useState<ActiveModule[]>([]);
  const [decorationId, setDecorationId]                 = useState<string | undefined>(urlDecorationId);
  const [isBootstrapping, setIsBootstrapping]           = useState(false);
  const [hydrated, setHydrated]                         = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ActiveModule | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  // Toast
  const [toast, setToast]   = useState<ToastState | null>(null);
  const toastTimerRef       = useRef<ReturnType<typeof setTimeout>>();
  const reorderTimerRef     = useRef<ReturnType<typeof setTimeout>>();
  const syncedRef           = useRef<string | null>(null);
  const sidebarRef          = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string, type: ToastState["type"] = "success") => {
    setToast({ msg, type });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Auth
  const vendorId = useSelector((state: RootState) => state.auth.user?.vendorId);

  // API hooks
  const { data: decorationList, isLoading: isListLoading } =
    useListDecorationsQuery(undefined, { skip: !vendorId || !!urlDecorationId });

  const [createDecoration, { isLoading: isCreating }] = useCreateDecorationMutation();
  const [addComponent]                                = useAddComponentMutation();
  const [deleteComponent]                             = useDeleteComponentMutation();
  const [reorderComponents]                           = useReorderComponentsMutation();

  const { data: decorationDetail, isLoading: isDetailLoading } =
    useGetDecorationQuery(decorationId!, { skip: !decorationId });

  // ── Step 1: Resolve decorationId ──────────────────────────────────────────
  useEffect(() => {
    if (urlDecorationId) return;
    if (!decorationList) return;

    const existing =
      decorationList.data?.find((d) => d.isDefault) ??
      decorationList.data?.[0];

    if (existing) { setDecorationId(existing.id); return; }

    setIsBootstrapping(true);
    createDecoration({ name: "My Store", isDefault: true })
      .unwrap()
      .then((res) => setDecorationId(res.data.id))
      .catch(console.error)
      .finally(() => setIsBootstrapping(false));
  }, [urlDecorationId, decorationList]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 2: Hydrate canvas + formDataMap ───────────────────────────────────
  useEffect(() => {
    if (!decorationId) return;
    if (!decorationDetail?.data) return;
    if (syncedRef.current === decorationId) return;
    syncedRef.current = decorationId;

    const backendComponents = decorationDetail.data.components ?? [];

    // ── Path A: opened via ?decorationId= URL param ─────────────────────────
    if (urlDecorationId && !hydrated && backendComponents.length > 0) {
      const sorted = backendComponents
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const hydratedModules: ActiveModule[] = sorted.map((c) => {
        const meta = COMPONENT_TYPE_TO_MODULE[c.type];
        return {
          id:            `${meta?.type ?? c.type}_${c.id.slice(-8)}`,
          name:          meta?.name ?? c.type,
          icon:          meta?.icon ?? "",
          type:          meta?.type ?? c.type,
          dbComponentId: c.id,
        };
      });

      // Restore saved config into formDataMap so StoreHeader (and other
      // components) immediately reflect the persisted colours/settings.
      const restoredFormData: Record<string, any> = {};
      sorted.forEach((c, i) => {
        restoredFormData[hydratedModules[i].id] = componentToFormData(c);
      });

      setActiveModules(hydratedModules);
      setFormDataMap(restoredFormData);
      setHydrated(true);
      return;
    }

    // ── Path B: default decoration (no URL param) ────────────────────────────
    if (!urlDecorationId && activeModules.length === 0) {
      setActiveModules(INITIAL_MODULES);
    }

    const runSync = async () => {
      const claimedIds = new Set<string>(
        activeModules.filter((m) => m.dbComponentId).map((m) => m.dbComponentId!)
      );
      const updates: { localId: string; dbComponentId: string }[] = [];

      for (let i = 0; i < activeModules.length; i++) {
        const mod = activeModules[i];
        if (mod.dbComponentId) continue;

        const componentType = TYPE_TO_COMPONENT_TYPE[mod.type];
        if (!componentType) continue;

        const match = backendComponents.find(
          (c) => c.type === componentType && !claimedIds.has(c.id)
        );
        if (match) {
          claimedIds.add(match.id);
          updates.push({ localId: mod.id, dbComponentId: match.id });
          continue;
        }

        try {
          const res = await addComponent({
            decorationId,
            data: { type: componentType, sortOrder: i, isVisible: true },
          }).unwrap();
          claimedIds.add(res.data.id);
          updates.push({ localId: mod.id, dbComponentId: res.data.id });
        } catch (err) {
          console.error(`Failed to create backend component for "${mod.id}":`, err);
        }
      }

      if (updates.length > 0) {
        setActiveModules((prev) =>
          prev.map((m) => {
            const hit = updates.find((u) => u.localId === m.id);
            return hit ? { ...m, dbComponentId: hit.dbComponentId } : m;
          })
        );

        // Restore saved config for each matched/created component.
        // Only fills entries that don't already have user edits.
        setFormDataMap((prev) => {
          const next = { ...prev };
          updates.forEach(({ localId, dbComponentId }) => {
            if (next[localId] && Object.keys(next[localId]).length > 0) return; // keep user edits
            const c = backendComponents.find((bc) => bc.id === dbComponentId);
            if (!c) return;
            next[localId] = componentToFormData(c);
          });
          return next;
        });
      }
    };

    runSync();
  }, [decorationId, decorationDetail]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced reorder sync ─────────────────────────────────────────────────
  const syncReorder = useCallback((modules: ActiveModule[]) => {
    if (!decorationId) return;
    clearTimeout(reorderTimerRef.current);
    reorderTimerRef.current = setTimeout(async () => {
      const orderedIds = modules
        .map((m) => m.dbComponentId)
        .filter(Boolean) as string[];

      if (orderedIds.length === 0) return;

      try {
        await reorderComponents({ decorationId, orderedIds }).unwrap();
        showToast("Order saved.");
      } catch {
        showToast("Failed to save order.", "error");
      }
    }, 600);
  }, [decorationId, reorderComponents, showToast]);

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(reorderTimerRef.current);
    clearTimeout(toastTimerRef.current);
  }, []);

  // ── Per-module form data ───────────────────────────────────────────────────
  const DEFAULT_FORM_DATA = {
    title: "Hidden",
    fullWidth: "1200px",
    carouselSpeed: "5 seconds",
    displayBottomMargin: false,
    isVisible: true,
  };

  const getFormData = useCallback(
    (moduleId: string) => formDataMap[moduleId] ?? DEFAULT_FORM_DATA,
    [formDataMap]
  );

  const handleInputChange = useCallback((field: string, value: any) => {
    setSelectedActiveModule((current) => {
      if (!current) return current;
      setFormDataMap((prev) => ({
        ...prev,
        [current.id]: { ...(prev[current.id] ?? DEFAULT_FORM_DATA), [field]: value },
      }));
      return current;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Module categories ──────────────────────────────────────────────────────
  const moduleCategories: ModuleCategory[] = [
    {
      name: "Advanced Modules (1)",
      items: [
        { id: "countdownProduct", name: "Countdown Products", icon: "https://img.alicdn.com/imgextra/i1/O1CN01rPIhBB29LrwPfWVjR_!!6000000008052-2-tps-72-72.png", count: 1 },
      ],
    },
    {
      name: "Category (2)",
      items: [
        { id: "brandList",    name: "Category List",             icon: "https://img.alicdn.com/imgextra/i2/O1CN01uaqewq1m3KkZnwwrP_!!6000000004898-2-tps-72-73.png", count: 1 },
        { id: "categoryAuto", name: "Smart Category Navigation", icon: "https://img.alicdn.com/imgextra/i4/O1CN01TEAeTy1x10VqTecnr_!!6000000006382-2-tps-72-72.png", count: 1 },
      ],
    },
    {
      name: "Banner (6)",
      items: [
        { id: "graphicThreeImages", name: "Three banners",    icon: "https://img.alicdn.com/imgextra/i3/O1CN01jm3FKE1rlMuQPP8cj_!!6000000005671-2-tps-72-73.png", count: 1 },
        { id: "graphicOneImage",    name: "Single Banner",    icon: "https://img.alicdn.com/imgextra/i3/O1CN01FHanhX1YBfKqdYp5p_!!6000000003021-2-tps-72-73.png", count: 1, hot: true },
        { id: "graphicCarousel",    name: "Banner Carousel",  icon: "https://img.alicdn.com/imgextra/i1/O1CN01jXJ1ln1XYHH3YYADF_!!6000000002935-2-tps-72-73.png", count: 1 },
        { id: "graphicMultiImages", name: "Multiple banners", icon: "https://img.alicdn.com/imgextra/i3/O1CN01YYCWdk1SfXTXmMY3y_!!6000000002274-2-tps-72-73.png", count: 1 },
        { id: "fourBannersA",       name: "Four Banners A",   icon: "https://img.alicdn.com/imgextra/i4/O1CN01fkakT21Bxzy4D28Dj_!!6000000000013-2-tps-72-73.png", count: 1 },
        { id: "fiveBannersA",       name: "Five banners A",   icon: "https://img.alicdn.com/imgextra/i3/O1CN01dcCTVz1sjpBvUpvLH_!!6000000005803-2-tps-72-73.png", count: 0 },
      ],
    },
    {
      name: "Product (5)",
      items: [
        { id: "carouselProductRecommend", name: "Products Carousel",             icon: "https://img.alicdn.com/imgextra/i2/O1CN01dWvm7F1lwvCeEJVm3_!!6000000004884-2-tps-72-72.png", count: 1 },
        { id: "productRecommendation",    name: "Product Recommendation",        icon: "https://img.alicdn.com/imgextra/i1/O1CN01yA59ze1UDGFbMnQpX_!!6000000002483-2-tps-72-72.png", count: 1 },
        { id: "sliderRecommend",          name: "Slider Product Recommendation", icon: "https://img.alicdn.com/imgextra/i1/O1CN01nkrYf41RTnhzHvTyE_!!6000000002113-2-tps-72-72.png", count: 1 },
        { id: "productPromotion",         name: "Product Highlights",            icon: "https://img.alicdn.com/imgextra/i2/O1CN01wQxPMu1OSTiWYg7wy_!!6000000001704-2-tps-72-72.png", count: 1 },
        { id: "threeColumnProducts",      name: "Three Columns Products List",   icon: "https://img.alicdn.com/imgextra/i2/O1CN01zVzTM01yHKF13lWhZ_!!6000000006553-2-tps-72-72.png", count: 1 },
      ],
    },
    {
      name: "Promotion (1)",
      items: [
        { id: "voucher", name: "Voucher", icon: "https://img.alicdn.com/imgextra/i4/O1CN01uP1UbS1Jx67M1QR0L_!!6000000001094-2-tps-72-72.png", count: 1 },
      ],
    },
  ];

  // ── Sidebar width ──────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => { if (sidebarRef.current) setSidebarWidth(sidebarRef.current.offsetWidth); };
    update();
    const t = setTimeout(update, 100);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("resize", update); clearTimeout(t); };
  }, [showStoreModules]);

  // ── Drop ───────────────────────────────────────────────────────────────────
  const handleModuleDrop = async (moduleId: string, position: number) => {
    let item: ModuleItem | undefined;
    for (const cat of moduleCategories) {
      item = cat.items.find((i) => i.id === moduleId);
      if (item) break;
    }
    if (!item || item.disabled) return;

    const localId   = `${item.id}_${Date.now()}`;
    const newModule: ActiveModule = { id: localId, name: item.name, icon: item.icon, type: item.id };

    setActiveModules((prev) => {
      const next = [...prev];
      next.splice(position, 0, newModule);
      return next;
    });

    if (!decorationId) return;
    const componentType = TYPE_TO_COMPONENT_TYPE[item.id];
    if (!componentType) return;

    try {
      const res = await addComponent({
        decorationId,
        data: { type: componentType, sortOrder: position, isVisible: true },
      }).unwrap();
      setActiveModules((prev) =>
        prev.map((m) => m.id === localId ? { ...m, dbComponentId: res.data.id } : m)
      );
      showToast(`"${item!.name}" added.`);
    } catch {
      showToast("Failed to add component.", "error");
    }
  };

  // ── Move up ────────────────────────────────────────────────────────────────
  const handleMoveUp = useCallback((moduleId: string) => {
    setActiveModules((prev) => {
      const idx = prev.findIndex((m) => m.id === moduleId);
      if (idx <= 1) return prev; // index 0 is locked header; index 1 can't go above it
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      syncReorder(next);
      return next;
    });
  }, [syncReorder]);

  // ── Move down ──────────────────────────────────────────────────────────────
  const handleMoveDown = useCallback((moduleId: string) => {
    setActiveModules((prev) => {
      const idx = prev.findIndex((m) => m.id === moduleId);
      if (idx === 0 || idx === prev.length - 1) return prev; // locked or last
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      syncReorder(next);
      return next;
    });
  }, [syncReorder]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((moduleId: string) => {
    const mod = activeModules.find((m) => m.id === moduleId);
    if (!mod) return;

    // Block deleting the locked header (always index 0)
    if (activeModules[0]?.id === moduleId) {
      showToast("Store Header cannot be deleted — it's required in the first position.", "error");
      return;
    }

    setDeleteTarget(mod);
  }, [activeModules, showToast]);

  // ── Confirm delete ─────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.dbComponentId && decorationId) {
        await deleteComponent({
          decorationId,
          componentId: deleteTarget.dbComponentId,
        }).unwrap();
      }

      setActiveModules((prev) => prev.filter((m) => m.id !== deleteTarget.id));

      // Clean up formDataMap entry
      setFormDataMap((prev) => {
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      if (selectedActiveModule?.id === deleteTarget.id) {
        setSelectedActiveModule(null);
        setShowConfigForm(false);
      }

      showToast(`"${deleteTarget.name}" deleted.`);
    } catch {
      showToast("Failed to delete component.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Copy ───────────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async (moduleId: string) => {
    const src = activeModules.find((m) => m.id === moduleId);
    if (!src) return;
    const idx     = activeModules.findIndex((m) => m.id === moduleId);
    const localId = `${src.type}_${Date.now()}`;

    setActiveModules((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, { ...src, id: localId, dbComponentId: undefined });
      return next;
    });

    // Copy formData too so the new module inherits the same settings
    setFormDataMap((prev) => ({
      ...prev,
      [localId]: { ...(prev[src.id] ?? DEFAULT_FORM_DATA) },
    }));

    if (!decorationId) return;
    const componentType = TYPE_TO_COMPONENT_TYPE[src.type];
    if (!componentType) return;

    try {
      const res = await addComponent({
        decorationId,
        data: { type: componentType, sortOrder: idx + 1, isVisible: true },
      }).unwrap();
      setActiveModules((prev) =>
        prev.map((m) => m.id === localId ? { ...m, dbComponentId: res.data.id } : m)
      );
      showToast(`"${src.name}" copied.`);
    } catch {
      setActiveModules((prev) => prev.filter((m) => m.id !== localId));
      setFormDataMap((prev) => { const n = { ...prev }; delete n[localId]; return n; });
      showToast("Failed to copy component.", "error");
    }
  }, [activeModules, decorationId, addComponent, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const handleSidebarModuleClick  = (m: ModuleItem)   => { setSelectedModule(m); setIsDemoModalOpen(true); };
  const handleCloseModal          = ()                => { setIsDemoModalOpen(false); setSelectedModule(null); };
  const handleActiveModuleSelect  = (m: ActiveModule)  => { setSelectedActiveModule(m); setShowConfigForm(true); };
  const handleConfigFormClose     = ()                => { setShowConfigForm(false); setSelectedActiveModule(null); };
  const handleGalleryModuleSelect = (m: ActiveModule)  => { setSelectedActiveModule(m); setShowConfigForm(true); };
  const toggleRightPanel          = ()                => setShowRightPanel((v) => !v);
  const togglePanelView           = ()                => {
    if (selectedActiveModule) setShowConfigForm((v) => !v);
    else setShowRightPanel((v) => !v);
  };

  const isGlobalLoading = isListLoading || isCreating || isBootstrapping || isDetailLoading;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <TopBar
          currentView={currentView}
          onViewChange={setCurrentView}
          onPublish={() => alert(`Publishing ${currentView} view...`)}
        />
      </div>

      {isGlobalLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-lg">
            <Loader2 className="animate-spin text-blue-500" size={22} />
            <span className="text-sm font-medium text-gray-700">
              {isCreating || isBootstrapping ? "Setting up your store..." : "Loading decoration..."}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-1 pt-16">
        <div ref={sidebarRef} className="h-[calc(100vh-64px)] sticky top-16">
          <StoreModulesSidebar
            showStoreModules={showStoreModules}
            setShowStoreModules={setShowStoreModules}
            moduleCategories={moduleCategories}
            onModuleClick={handleSidebarModuleClick}
            selectedModuleId={selectedModule?.id || null}
          />
        </div>

        <div className="flex-1 flex min-h-[calc(100vh-64px)]">
          <div className="flex-1">
            <PreviewArea
              activeModules={activeModules}
              onModuleDrop={handleModuleDrop}
              selectedModuleId={selectedActiveModule?.id || null}
              onModuleSelect={handleActiveModuleSelect}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onCopy={handleCopy}
              onDelete={handleDelete}
              currentView={currentView}
              formDataMap={formDataMap}
            />
          </div>

          {!showRightPanel && (
            <button
              onClick={toggleRightPanel}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-teal-500 text-white p-2 rounded-l-lg shadow-lg hover:bg-teal-600 transition-colors z-10"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {showRightPanel && (
            <div className="w-96 bg-white border-l border-gray-200 h-[calc(100vh-64px)] overflow-y-auto sticky top-16">
              <button
                onClick={togglePanelView}
                className="absolute -left-6 top-1/2 transform -translate-y-1/2 bg-teal-500 text-white p-1 rounded-l shadow-lg hover:bg-teal-600 transition-colors z-10"
                title={showConfigForm ? "Show Modules" : "Show Configuration"}
              >
                {showConfigForm ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>

              {selectedActiveModule && showConfigForm ? (
                <ConfigurationForm
                  formData={getFormData(selectedActiveModule.id)}
                  onInputChange={handleInputChange}
                  selectedModule={selectedActiveModule}
                  onClose={handleConfigFormClose}
                  selectedSidebarModule={selectedModule}
                  onDeleteModule={handleDelete}
                  decorationId={decorationId ?? ""}
                />
              ) : (
                <ModulesGallery
                  selectedSidebarModule={selectedModule}
                  moduleCategories={moduleCategories}
                  activeModules={activeModules}
                  onModuleSelect={handleGalleryModuleSelect}
                  onModuleDelete={handleDelete}
                />
              )}
            </div>
          )}
        </div>

        <ModuleDemoModal
          isOpen={isDemoModalOpen}
          onClose={handleCloseModal}
          module={selectedModule}
          sidebarWidth={sidebarWidth}
        />
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          moduleName={deleteTarget.name}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => { if (!isDeleting) setDeleteTarget(null); }}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
};

export default StoreLayoutEditor;