"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, Save, Trash2, ChevronRight,
  Loader2, CheckCircle, AlertCircle, Lock, Upload, X,
} from "lucide-react";
import { ActiveModule, ModuleItem } from "./page";
import {
  useUpdateComponentMutation,
  useUpsertBannerCustomizationMutation,
  ComponentConfigInput,
} from "@/features/storeEditorApi";

interface ConfigurationFormProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  selectedModule: ActiveModule | null;
  onClose: () => void;
  selectedSidebarModule: ModuleItem | null;
  onDeleteModule?: (moduleId: string) => void;
  decorationId: string;
}

type Toast = { type: "success" | "error"; message: string } | null;

// ─── Compact color picker ────────────────────────────────────────────────────
// Shows a small swatch button. Click → a tiny popover with a native <input type="color">
// + a hex text field. Takes almost no vertical space.

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Sync draft when value changes externally
  useEffect(() => { setDraft(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const commit = (v: string) => {
    setDraft(v);
    onChange(v);
  };

  const handleHexInput = (raw: string) => {
    setDraft(raw);
    // Only propagate once it looks like a full hex colour
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) onChange(raw);
  };

  return (
    <div className="flex items-center justify-between gap-3" ref={ref}>
      <span className="text-sm text-gray-700 leading-none">{label}</span>
      <div className="relative flex items-center gap-1.5 shrink-0">
        {/* Swatch button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-md border border-gray-300 shadow-sm hover:scale-105 transition-transform"
          style={{ backgroundColor: value }}
          title={value}
        />
        <span
          className="text-xs font-mono text-gray-500 cursor-pointer hover:text-gray-700 w-16 text-right"
          onClick={() => setOpen((v) => !v)}
        >
          {value}
        </span>

        {/* Popover */}
        {open && (
          <div className="absolute right-0 top-9 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 flex flex-col gap-2 w-44">
            <input
              type="color"
              value={draft}
              onChange={(e) => commit(e.target.value)}
              className="w-full h-10 cursor-pointer border-none bg-transparent rounded"
            />
            <input
              type="text"
              value={draft}
              onChange={(e) => handleHexInput(e.target.value)}
              maxLength={7}
              placeholder="#000000"
              className="w-full text-xs font-mono border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-blue-500 hover:text-blue-700 text-right"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Image upload slot ────────────────────────────────────────────────────────

const ImageUploadSlot = ({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  hint?: string;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-sm text-gray-700">{label}</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
    {value ? (
      <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
        <img src={value} alt={label} className="w-full h-20 object-cover" />
        <button
          onClick={() => onChange(undefined)}
          className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        >
          <X size={12} className="text-red-500" />
        </button>
      </div>
    ) : (
      <label className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all group">
        <Upload size={14} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
        <span className="text-xs text-gray-400 group-hover:text-blue-500">Upload image</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(URL.createObjectURL(file));
          }}
        />
      </label>
    )}
  </div>
);

// ─── Toggle row ───────────────────────────────────────────────────────────────

const ToggleRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-blue-500" : "bg-gray-300"}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </div>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

// ─── RadioGroup ───────────────────────────────────────────────────────────────

const RadioGroup = ({
  name, options, value, onChange,
}: {
  name: string; options: string[]; value: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-4">
    {options.map((opt) => (
      <label key={opt} className="flex items-center gap-2 cursor-pointer">
        <input type="radio" name={name} checked={value === opt} onChange={() => onChange(opt)} className="hidden" />
        <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${value === opt ? "border-blue-500" : "border-gray-300"}`}>
          {value === opt && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
        </div>
        <span className="text-sm">{opt}</span>
      </label>
    ))}
  </div>
);

// ─── Section divider ──────────────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h5>
    {children}
  </div>
);

// ─── Header configuration form ────────────────────────────────────────────────
// No tab switcher. Background colour and images are shown together, each in one
// compact row. Colors use the single-swatch popover picker.

const HeaderConfigForm = ({
  formData,
  onInputChange,
}: {
  formData: any;
  onInputChange: (field: string, value: any) => void;
}) => (
  <div className="space-y-6">

    {/* Locked notice */}
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
      <Lock size={12} className="text-slate-400 shrink-0" />
      <p className="text-xs text-slate-500">
        Store Header is always pinned to the top and cannot be moved or removed.
      </p>
    </div>

    {/* ── Background ────────────────────────────────────────────────────── */}
    <Section title="Background">
      <ColorField
        label="Background colour"
        value={formData.headerBgColor ?? "#ffffff"}
        onChange={(v) => onInputChange("headerBgColor", v)}
      />
      <ImageUploadSlot
        label="Mobile image"
        hint="375 × 200 px"
        value={formData.headerBgImageMobile}
        onChange={(v) => onInputChange("headerBgImageMobile", v)}
      />
      <ImageUploadSlot
        label="Desktop image"
        hint="1200 × 280 px"
        value={formData.headerBgImageDesktop}
        onChange={(v) => onInputChange("headerBgImageDesktop", v)}
      />
      {/* Overlay opacity — only relevant when an image is set */}
      {(formData.headerBgImageMobile || formData.headerBgImageDesktop) && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700">Image overlay opacity</span>
            <span className="text-xs font-mono text-gray-500">{formData.headerOverlayOpacity ?? 0}%</span>
          </div>
          <input
            type="range" min={0} max={100}
            value={formData.headerOverlayOpacity ?? 0}
            onChange={(e) => onInputChange("headerOverlayOpacity", Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      )}
    </Section>

    {/* ── Element colours ───────────────────────────────────────────────── */}
    <Section title="Text & icon colours">
      {(
        [
          ["storeNameColor",      "Store name",          "#0f172a"],
          ["followersColor",      "Followers & labels",  "#334155"],
          ["iconsColor",          "Rating & badge icons","#0d9488"],
          ["logoRingColor",       "Logo border",         "#ffffff"],
          ["chatButtonColor",     "Chat button",         "#0d9488"],
          ["chatButtonTextColor", "Chat button text",    "#ffffff"],
        ] as [string, string, string][]
      ).map(([field, label, def]) => (
        <ColorField
          key={field}
          label={label}
          value={formData[field] ?? def}
          onChange={(v) => onInputChange(field, v)}
        />
      ))}
    </Section>

    {/* ── Visibility ────────────────────────────────────────────────────── */}
    <Section title="Visible elements">
      {(
        [
          ["showLogo",         "Store logo"],
          ["showStoreName",    "Store name"],
          ["showFollowers",    "Followers count"],
          ["showRating",       "Rating"],
          ["showVerifiedBadge","Verified badge"],
          ["showChatButton",   "Chat button"],
        ] as [string, string][]
      ).map(([field, label]) => (
        <ToggleRow
          key={field}
          label={label}
          checked={formData[field] ?? true}
          onChange={(v) => onInputChange(field, v)}
        />
      ))}
    </Section>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const ConfigurationForm = ({
  formData,
  onInputChange,
  selectedModule,
  onClose,
  selectedSidebarModule,
  onDeleteModule,
  decorationId,
}: ConfigurationFormProps) => {
  const displayModule = selectedModule || selectedSidebarModule;

  const [updateComponent, { isLoading: isSaving }]      = useUpdateComponentMutation();
  const [upsertBanner,    { isLoading: isSavingBanner }] = useUpsertBannerCustomizationMutation();
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const canSave =
    !!selectedModule && !!decorationId && !!selectedModule.dbComponentId;

  const missingComponentReason = !selectedModule
    ? null
    : !decorationId
    ? "Decoration not loaded yet."
    : !selectedModule.dbComponentId
    ? "Module hasn't synced yet — wait a moment."
    : null;

  const buildConfigPayload = (): ComponentConfigInput => {
    const t = selectedModule?.type ?? "";
    const toISO = (v?: string) => (v ? new Date(v).toISOString() : undefined);

    switch (t) {
      case "countdownProduct":
        return {
          countdownEndDate:  toISO(formData.countdownEndDate),
          showProductPrice:  formData.showProductPrice ?? true,
          showProductRating: formData.showProductRating ?? true,
          showAddToCart:     formData.showAddToCart ?? true,
          settings: {
            countdownTitle:           formData.countdownTitle,
            countdownBackgroundColor: formData.countdownBackgroundColor,
            timerPosition:            formData.timerPosition,
            showDays:    formData.showDays ?? true,
            showHours:   formData.showHours ?? true,
            showMinutes: formData.showMinutes ?? true,
            showSeconds: formData.showSeconds ?? true,
          },
        };

      case "graphicCarousel":
        return {
          autoSlide:     !!formData.carouselSpeed,
          slideInterval: formData.carouselSpeed ? parseInt(formData.carouselSpeed) * 1000 : undefined,
          settings: { bannerImages: formData.bannerImages ?? [], bannerHeight: formData.fullWidth ?? "1200px" },
        };

      case "graphicThreeImages":
        return {
          settings: {
            bannerType:   formData.bannerType,
            bannerLayout: formData.bannerLayout,
            bannerImages: formData.bannerImages ?? [],
          },
        };

      case "categoryBar":
        return {
          settings: {
            showChatButton:    formData.showChatButton ?? true,
            showRating:        formData.showRating ?? true,
            showVerifiedBadge: formData.showVerifiedBadge ?? true,
            showFollowers:     formData.showFollowers ?? true,
            showLogo:          formData.showLogo ?? true,
            showStoreName:     formData.showStoreName ?? true,
            headerBgColor:          formData.headerBgColor ?? "#ffffff",
            headerBgImageMobile:    formData.headerBgImageMobile,
            headerBgImageDesktop:   formData.headerBgImageDesktop,
            headerOverlayOpacity:   formData.headerOverlayOpacity ?? 0,
            storeNameColor:      formData.storeNameColor ?? "#0f172a",
            followersColor:      formData.followersColor ?? "#334155",
            iconsColor:          formData.iconsColor ?? "#0d9488",
            logoRingColor:       formData.logoRingColor ?? "#ffffff",
            chatButtonColor:     formData.chatButtonColor ?? "#0d9488",
            chatButtonTextColor: formData.chatButtonTextColor ?? "#ffffff",
          },
        };

      default:
        return {};
    }
  };

  const handleSave = async () => {
    if (!canSave) { showToast("error", missingComponentReason ?? "Cannot save."); return; }
    try {
      await updateComponent({
        decorationId,
        componentId: selectedModule!.dbComponentId!,
        data: { isVisible: formData.isVisible ?? true, config: buildConfigPayload() },
      }).unwrap();
      showToast("success", "Changes saved successfully");
    } catch (err: any) {
      showToast("error", err?.data?.message ?? "Failed to save changes");
    }
  };

  const isAnySaving = isSaving || isSavingBanner;
  const isHeader    = selectedModule?.type === "categoryBar";

  const renderForm = () => {
    const t = selectedModule?.type ?? displayModule?.id;
    switch (t) {
      case "graphicCarousel":
        return (
          <div className="space-y-6">
            <Section title="Display">
              <RadioGroup name="title" options={["Display", "Hidden"]} value={formData.title ?? "Hidden"} onChange={(v) => onInputChange("title", v)} />
            </Section>
            <Section title="Width">
              <RadioGroup name="fullWidth" options={["1200px", "1920px"]} value={formData.fullWidth ?? "1200px"} onChange={(v) => onInputChange("fullWidth", v)} />
            </Section>
            <Section title="Images">
              <button className="w-full py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">Upload Images</button>
              <p className="text-xs text-gray-400">JPG, PNG, GIF · max 5 MB each</p>
            </Section>
            <Section title="Carousel speed">
              <RadioGroup name="carouselSpeed" options={["3 seconds", "5 seconds", "10 seconds", "15 seconds"]} value={formData.carouselSpeed ?? "5 seconds"} onChange={(v) => onInputChange("carouselSpeed", v)} />
            </Section>
          </div>
        );

      case "countdownProduct":
        return (
          <div className="space-y-6">
            <Section title="Timer">
              <div>
                <label className="text-sm text-gray-700 mb-1.5 block">End time <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={formData.countdownEndDate ?? ""} onChange={(e) => onInputChange("countdownEndDate", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-700 mb-1.5 block">Title</label>
                <input type="text" placeholder="e.g. Flash Sale!" value={formData.countdownTitle ?? ""} onChange={(e) => onInputChange("countdownTitle", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <ColorField label="Background colour" value={formData.countdownBackgroundColor ?? "#0d9488"} onChange={(v) => onInputChange("countdownBackgroundColor", v)} />
              <div>
                <label className="text-sm text-gray-700 mb-1.5 block">Timer position</label>
                <select value={formData.timerPosition ?? "TOP_RIGHT"} onChange={(e) => onInputChange("timerPosition", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["TOP_LEFT","TOP_CENTER","TOP_RIGHT","CENTER","BOTTOM_LEFT","BOTTOM_CENTER","BOTTOM_RIGHT","OVERLAY_TOP","OVERLAY_BOTTOM"].map((p) => (
                    <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </Section>
            <Section title="Show units">
              <div className="grid grid-cols-2 gap-3">
                {(["showDays","showHours","showMinutes","showSeconds"] as const).map((f) => (
                  <ToggleRow key={f} label={f.replace("show", "")} checked={formData[f] ?? true} onChange={(v) => onInputChange(f, v)} />
                ))}
              </div>
            </Section>
            <Section title="Product display">
              <ToggleRow label="Show price"       checked={formData.showProductPrice ?? true}  onChange={(v) => onInputChange("showProductPrice", v)} />
              <ToggleRow label="Show rating"      checked={formData.showProductRating ?? true} onChange={(v) => onInputChange("showProductRating", v)} />
              <ToggleRow label="Show add to cart" checked={formData.showAddToCart ?? true}     onChange={(v) => onInputChange("showAddToCart", v)} />
            </Section>
          </div>
        );

      case "graphicThreeImages":
        return (
          <div className="space-y-6">
            <Section title="Layout">
              <div className="grid grid-cols-2 gap-3">
                {["Layout 1","Layout 2","Layout 3","Layout 4"].map((l) => (
                  <button key={l} onClick={() => onInputChange("bannerLayout", l)}
                    className={`p-3 border rounded text-sm transition-colors ${formData.bannerLayout === l ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 hover:border-blue-400"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Images">
              <button className="w-full py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors mb-2">Upload Main Banner</button>
              <button className="w-full py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">Upload Side Banners</button>
            </Section>
          </div>
        );

      case "categoryBar":
        return <HeaderConfigForm formData={formData} onInputChange={onInputChange} />;

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <img src={displayModule?.icon} alt={displayModule?.name} className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">{displayModule?.name}</p>
            <p className="text-sm text-gray-400 mt-1">Configuration options will be available soon.</p>
          </div>
        );
    }
  };

  if (!displayModule) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 flex items-center justify-center h-screen">
        <p className="text-gray-500 text-sm">Select a module to configure</p>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 relative">
      <button onClick={onClose}
        className="absolute -left-6 top-1/2 -translate-y-1/2 bg-blue-500 text-white p-1 rounded-l shadow-lg hover:bg-blue-600 transition-colors z-10"
        title="Close configuration">
        <ChevronRight size={16} />
      </button>

      <div className="h-screen overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ChevronLeft size={16} className="text-gray-600 cursor-pointer hover:text-gray-800" onClick={onClose} />
            <span className="text-base font-semibold">{displayModule.name}</span>
            {isHeader && (
              <span className="flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <Lock size={9} /> Pinned
              </span>
            )}
          </div>
          {selectedModule && onDeleteModule && !isHeader && (
            <button onClick={() => onDeleteModule(selectedModule.id)} className="p-1 hover:bg-red-50 rounded" title="Delete">
              <Trash2 size={15} className="text-red-500" />
            </button>
          )}
        </div>

        {/* Sync strip */}
        <div className="px-4 py-1.5 text-xs text-gray-400 border-b border-gray-100 bg-gray-50 flex-shrink-0 flex items-center gap-2">
          {selectedModule?.dbComponentId ? (
            <><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />ID: {selectedModule.dbComponentId}</>
          ) : selectedModule ? (
            <><span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />Syncing…</>
          ) : `Type: ${selectedSidebarModule?.id ?? "—"}`}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-4 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 text-sm flex-shrink-0 ${
            toast.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {toast.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {toast.message}
          </div>
        )}

        {/* Not-added notice */}
        {!selectedModule && selectedSidebarModule && (
          <div className="mx-4 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 flex-shrink-0">
            <img src={selectedSidebarModule.icon} alt="" className="w-9 h-9" />
            <p className="text-xs text-blue-700">Drag to the canvas to enable configuration.</p>
          </div>
        )}

        {/* Pending-sync notice */}
        {selectedModule && !selectedModule.dbComponentId && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 flex-shrink-0">
            <Loader2 size={13} className="animate-spin text-amber-500" />
            <p className="text-xs text-amber-700">Saving to server — configure in a moment.</p>
          </div>
        )}

        {/* Form */}
        <div className="p-4 flex-1 overflow-y-auto">
          {renderForm()}

          {/* Common settings — not shown for header */}
          {!isHeader && (
            <div className="mt-8 pt-5 border-t border-gray-200 space-y-3">
              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Common</h5>
              <ToggleRow label="Hide bottom margin" checked={formData.displayBottomMargin ?? false} onChange={(v) => onInputChange("displayBottomMargin", v)} />
              <ToggleRow label="Make module visible" checked={formData.isVisible ?? true} onChange={(v) => onInputChange("isVisible", v)} />
            </div>
          )}
        </div>

        {/* Save footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={handleSave}
            disabled={!canSave || isAnySaving}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              canSave && !isAnySaving ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isAnySaving
              ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : <><Save size={15} /> {canSave ? "Save changes" : "Waiting for server…"}</>}
          </button>
          {missingComponentReason && (
            <p className="text-xs text-gray-400 text-center mt-2">{missingComponentReason}</p>
          )}
        </div>
      </div>
    </div>
  );
};