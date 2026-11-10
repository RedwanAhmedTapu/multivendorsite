"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, Save, Trash2, ChevronRight,
  Loader2, CheckCircle, AlertCircle, Lock, Upload, X, Plus, Package,
} from "lucide-react";
import { ActiveModule, ModuleItem } from "./page";
import {
  useUpdateComponentMutation,
  useUpsertBannerCustomizationMutation,
  useSetComponentProductsMutation,
  useSetComponentCategoriesMutation,
  useUploadStoreImageMutation,
  ComponentConfigInput,
} from "@/features/storeEditorApi";
import { StoreProductPicker, PickedProduct } from "./Storeproductpicker";
import { StoreCategoryPicker, PickedCategory } from "./Storecategorypicker";
import { SORT_BY_OPTIONS } from "./componentspreview/useAutoProducts";

interface ConfigurationFormProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  selectedModule: ActiveModule | null;
  onClose: () => void;
  selectedSidebarModule: ModuleItem | null;
  onDeleteModule?: (moduleId: string) => void;
  decorationId: string;
}

// ─── Design tokens ──────────────────────────────────────────────────────────
// Matches AddProductForm.tsx's palette (SectionCard / FieldLabel / VAT card
// etc. in components/product/AddProductForm.tsx) so the store editor's
// config panel doesn't look like a visually distinct app from the rest of
// the vendor dashboard: soft blue-grey surfaces, navy text, a blue→purple
// accent, and the same 'Plus Jakarta Sans' type scale. Also noticeably more
// compact than before — smaller type, tighter padding — since this panel is
// only 384px wide and was fighting itself for space.
const PANEL_BG      = "#F7F9FC";
const CARD_BORDER   = "#E5EAF2";
const CARD_HEADER_BG= "#FAFBFD";
const TEXT_DARK      = "#0D1B2E";
const TEXT_LABEL     = "#3D5068";
const TEXT_MUTED     = "#7A90AB";
const TEXT_HINT      = "#9BAABB";
const ACCENT_BLUE    = "#1D4ED8";
const ACCENT_BLUE_HOVER = "#2563EB";
const ACCENT_PURPLE  = "#7C3AED";
const ICON_TINT_BG   = "#EEF3FB";
const ERROR_RED      = "#DC2626";
const SUCCESS_GREEN  = "#16A34A";

const FONT_FAMILY = "'Plus Jakarta Sans', system-ui, sans-serif";

const INPUT_CLASS =
  "w-full px-2.5 py-2 border border-[#E5EAF2] rounded-lg text-[13px] text-[#0D1B2E] " +
  "placeholder:text-[#9BAABB] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15 " +
  "focus:border-[#1D4ED8] transition-colors bg-white";

const LABEL_CLASS = "text-[12px] font-semibold text-[#3D5068] mb-1 block";

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
    <div className="flex items-center justify-between gap-3 py-0.5" ref={ref}>
      <span className="text-[12.5px] font-medium text-[#3D5068] leading-none">{label}</span>
      <div className="relative flex items-center gap-1.5 shrink-0">
        {/* Swatch button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-6 h-6 rounded-md border border-[#E5EAF2] shadow-sm hover:scale-105 transition-transform"
          style={{ backgroundColor: value }}
          title={value}
        />
        <span
          className="text-[11px] font-mono text-[#7A90AB] cursor-pointer hover:text-[#3D5068] w-14 text-right"
          onClick={() => setOpen((v) => !v)}
        >
          {value}
        </span>

        {/* Popover */}
        {open && (
          <div className="absolute right-0 top-8 z-50 bg-white border border-[#E5EAF2] rounded-xl shadow-xl p-2.5 flex flex-col gap-2 w-40">
            <input
              type="color"
              value={draft}
              onChange={(e) => commit(e.target.value)}
              className="w-full h-9 cursor-pointer border-none bg-transparent rounded"
            />
            <input
              type="text"
              value={draft}
              onChange={(e) => handleHexInput(e.target.value)}
              maxLength={7}
              placeholder="#000000"
              className="w-full text-[11px] font-mono border border-[#E5EAF2] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15 focus:border-[#1D4ED8]"
            />
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-[#1D4ED8] hover:text-[#2563EB] text-right"
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

// Previously this just did `onChange(URL.createObjectURL(file))` — a
// browser-only blob: URL that was never actually uploaded anywhere. It
// "worked" in the same tab/session, then died on reload and was broken for
// every other visitor. It now POSTs the file to the real R2 upload endpoint
// (via useUploadStoreImageMutation → POST /vendor-storage/upload, the same
// route your vendor-storage.routes.ts already exposes) and stores the
// permanent URL that comes back.
// The upload endpoint (POST /vendor-storage/upload) returns the R2 KEY, not
// a full URL — e.g. "vendors/xxx/productimages/172...-name.jpg". This turns
// that into something an <img src> can actually load.
//
// ⚠️ ADJUST ME: this assumes a public R2 domain is exposed to the frontend
// via NEXT_PUBLIC_R2_PUBLIC_DOMAIN. If your project uses a different env
// var name (or serves images through your own API instead of R2 directly),
// change the fallback below to match.
const R2_PUBLIC_DOMAIN =
  process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN?.replace(/\/$/, "") ?? "";

function resolveStoreImageUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl; // already a full URL
  if (!R2_PUBLIC_DOMAIN) {
    // No public domain configured — return the key as-is. This WILL 404 in
    // <img>; see the comment above for what to set.
    return rawUrl;
  }
  return `${R2_PUBLIC_DOMAIN}/${rawUrl.replace(/^\//, "")}`;
}

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
}) => {
  const [uploadImage, { isLoading: isUploading }] = useUploadStoreImageMutation();
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await uploadImage(body).unwrap();
      // Backend returns { success, file: { url, ... } } — previously this
      // read `res.data.url`, which was always undefined (the field is
      // `res.file.url`), so every upload showed "Failed to upload" even
      // though the file had already been saved to R2 successfully.
      const resolved = resolveStoreImageUrl(res.file.url);
      if (!/^https?:\/\//i.test(resolved)) {
        // resolveStoreImageUrl couldn't turn the R2 key into a real URL
        // because NEXT_PUBLIC_R2_PUBLIC_DOMAIN isn't set. Previously this
        // failed completely silently — the upload "succeeded", the value
        // got saved, and the image (or header background) just never
        // rendered anywhere, with zero indication of why. Surface it here
        // instead of leaving it to be a mystery.
        setError(
          "Uploaded, but NEXT_PUBLIC_R2_PUBLIC_DOMAIN isn't set — the image won't display until that's configured (see console for the raw path)."
        );
        console.warn("[ImageUploadSlot] Missing NEXT_PUBLIC_R2_PUBLIC_DOMAIN — raw R2 key:", res.file.url);
      }
      onChange(resolved);
    } catch (err: any) {
      setError(err?.data?.message ?? "Upload failed. Try again.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12.5px] font-medium text-[#3D5068]">{label}</span>
        {hint && <span className="text-[10.5px] text-[#9BAABB]">{hint}</span>}
      </div>
      {isUploading ? (
        <div className="flex items-center justify-center gap-2 h-14 border-2 border-dashed border-[#C7D7F5] rounded-lg bg-[#EEF3FB]/60">
          <Loader2 size={13} className="animate-spin text-[#1D4ED8]" />
          <span className="text-[11.5px] text-[#1D4ED8]">Uploading…</span>
        </div>
      ) : value ? (
        <div className="relative rounded-lg overflow-hidden border border-[#E5EAF2] group">
          <img src={value} alt={label} className="w-full h-16 object-cover" />
          <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors cursor-pointer">
            <span className="opacity-0 group-hover:opacity-100 text-white text-[11px] font-semibold transition-opacity">Replace</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          <button
            onClick={() => onChange(undefined)}
            className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10"
          >
            <X size={11} className="text-[#DC2626]" />
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 h-14 border-2 border-dashed border-[#E5EAF2] rounded-lg cursor-pointer hover:border-[#1D4ED8] hover:bg-[#EEF3FB]/50 transition-all group">
          <Upload size={13} className="text-[#9BAABB] group-hover:text-[#1D4ED8] transition-colors" />
          <span className="text-[11.5px] text-[#9BAABB] group-hover:text-[#1D4ED8]">Upload image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}
      {error && <p className="text-[11px] text-[#DC2626] mt-1">{error}</p>}
    </div>
  );
};

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
  <label className="flex items-center justify-between gap-3 cursor-pointer select-none py-0.5">
    <span className="text-[12.5px] font-medium text-[#3D5068]">{label}</span>
    <div
      onClick={() => onChange(!checked)}
      className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 ${checked ? "bg-[#1D4ED8]" : "bg-[#D8E1EE]"}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-[14px] h-[14px] bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-[14px]" : "translate-x-0"
        }`}
      />
    </div>
  </label>
);

// ─── RadioGroup ───────────────────────────────────────────────────────────────

const RadioGroup = ({
  name, options, value, onChange,
}: {
  name: string; options: string[]; value: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-3">
    {options.map((opt) => (
      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
        <input type="radio" name={name} checked={value === opt} onChange={() => onChange(opt)} className="hidden" />
        <div className={`w-3.5 h-3.5 border rounded-full flex items-center justify-center transition-colors ${value === opt ? "border-[#1D4ED8]" : "border-[#C7D3E0]"}`}>
          {value === opt && <div className="w-1.5 h-1.5 bg-[#1D4ED8] rounded-full" />}
        </div>
        <span className="text-[12.5px] text-[#3D5068]">{opt}</span>
      </label>
    ))}
  </div>
);

// ─── Section divider ──────────────────────────────────────────────────────────
// Styled like AddProductForm's SectionCard — a soft white card with a tinted
// header strip — but flattened/compact for this 384px-wide panel (no icon,
// no badge, tighter padding) rather than a literal 1:1 copy of that larger
// component.

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-[#E5EAF2] bg-white overflow-hidden">
    <div className="px-3 py-2 bg-[#FAFBFD] border-b border-[#F0F4FA]">
      <h5 className="text-[10.5px] font-bold text-[#7A90AB] uppercase tracking-wider">{title}</h5>
    </div>
    <div className="px-3 py-3 space-y-2.5">{children}</div>
  </div>
);

// ─── Multi-image banner editor ─────────────────────────────────────────────────
// Used by graphicCarousel / graphicThreeImages. Previously these just showed
// a dead "Upload Images" button with no onClick/onChange at all — nothing
// was ever saved. Each slot now uses the same real-upload ImageUploadSlot.
//
// NOTE ON SHAPE: BannerCarosoel.tsx / ThreeBanners.tsx already read
// `formData.bannerImages` as a plain `string[]` (URLs only, no per-slide
// link) — see their FormData interfaces. We keep that exact shape here so
// neither preview component needs to change. The richer `BannerImage[]`
// ({ url, link, alt }) shape declared in storeEditorApi.ts is what
// buildConfigPayload() converts these plain URLs into on save (see
// `settings.bannerImages` below), matching the DB schema. Per-slide link
// editing (not just upload) can be added later by switching both preview
// components over to the object shape at the same time.

const BannerImagesEditor = ({
  images,
  onChange,
  max,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}) => {
  const slotCount = max ?? images.length + 1;
  const slots = Array.from({ length: slotCount }, (_, i) => images[i]);

  const updateSlot = (index: number, url: string | undefined) => {
    const next = [...images];
    if (url) {
      next[index] = url;
    } else {
      next.splice(index, 1);
    }
    onChange(next.filter(Boolean));
  };

  return (
    <div className="space-y-3">
      {slots.map((url, i) => (
        <ImageUploadSlot
          key={i}
          label={`Slide ${i + 1}`}
          value={url}
          onChange={(v) => updateSlot(i, v)}
        />
      ))}
    </div>
  );
};

// ─── Product targeting section ─────────────────────────────────────────────────
// Shared by every "product-based" component (countdown, product carousel,
// product recommendation, slider, three-column list, product highlight).
// Opens StoreProductPicker, shows the current selection as thumbnail chips,
// and persists the selection to the backend via setComponentProducts —
// completely separate from the component's own config save, since products
// live on the DecorationComponentProduct relation, not on config.settings.

const ProductsTargetSection = ({
  products,
  onChange,
  onPersist,
  maxSelect,
  label = "Target products",
}: {
  products: PickedProduct[];
  onChange: (products: PickedProduct[]) => void;
  onPersist: (productIds: string[]) => Promise<void> | void;
  maxSelect?: number;
  label?: string;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async (picked: PickedProduct[]) => {
    onChange(picked);
    setIsSaving(true);
    try {
      await onPersist(picked.map((p) => p.id));
    } finally {
      setIsSaving(false);
    }
  };

  const removeOne = async (id: string) => {
    const next = products.filter((p) => p.id !== id);
    onChange(next);
    setIsSaving(true);
    try {
      await onPersist(next.map((p) => p.id));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Section title={label}>
      {products.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {products.map((p) => (
            <div key={p.id} className="relative rounded-lg overflow-hidden border border-[#E5EAF2] group">
              <div className="w-full aspect-square bg-[#F7F9FC] flex items-center justify-center">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={18} className="text-[#C7D3E0]" />
                )}
              </div>
              <p className="text-[10px] text-[#5B6B82] px-1 py-0.5 truncate">{p.name || "…"}</p>
              <button
                onClick={() => removeOne(p.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                title="Remove"
              >
                <X size={10} className="text-[#DC2626]" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#9BAABB] mb-2">No products targeted yet — this will show placeholder products in the meantime.</p>
      )}

      <button
        onClick={() => setPickerOpen(true)}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-[#E5EAF2] rounded-lg text-xs font-medium text-[#5B6B82] hover:border-[#1D4ED8] hover:text-[#1D4ED8] hover:bg-[#EEF3FB]/60 transition-all disabled:opacity-50"
      >
        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        {products.length > 0 ? "Change products" : "Select products"}
      </button>

      <StoreProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedProductIds={products.map((p) => p.id)}
        onConfirm={handleConfirm}
        maxSelect={maxSelect}
      />
    </Section>
  );
};

// ─── Positional (fixed-slot) image editor ──────────────────────────────────────
// Used by FourBanners / FiveBanners — unlike BannerImagesEditor (carousel
// slides, where order-among-equals is fine to compact), these components
// render each index at a FIXED, differently-styled position (e.g. "large
// hero banner" vs "small corner banner"), so removing one image must leave
// a hole rather than shift every later slot into the wrong visual spot.
// Produces a fixed-length `(string | undefined)[]`.

const PositionalImagesEditor = ({
  labels,
  images,
  onChange,
}: {
  labels: string[];
  images: (string | undefined)[];
  onChange: (images: (string | undefined)[]) => void;
}) => {
  const updateSlot = (index: number, url: string | undefined) => {
    const next = [...images];
    while (next.length < labels.length) next.push(undefined);
    next[index] = url;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {labels.map((label, i) => (
        <ImageUploadSlot key={i} label={label} value={images[i]} onChange={(v) => updateSlot(i, v)} />
      ))}
    </div>
  );
};

// ─── Category targeting section ────────────────────────────────────────────────
// Same pattern as ProductsTargetSection but for categories (CategoryList /
// SmartCategory) — persists via setComponentCategories, independent of the
// "Save changes" button, so a refresh never loses the selection.

const CategoriesTargetSection = ({
  categories,
  onChange,
  onPersist,
  maxSelect,
}: {
  categories: PickedCategory[];
  onChange: (categories: PickedCategory[]) => void;
  onPersist: (categoryIds: string[]) => Promise<void> | void;
  maxSelect?: number;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async (picked: PickedCategory[]) => {
    onChange(picked);
    setIsSaving(true);
    try { await onPersist(picked.map((c) => c.id)); } finally { setIsSaving(false); }
  };

  const removeOne = async (id: string) => {
    const next = categories.filter((c) => c.id !== id);
    onChange(next);
    setIsSaving(true);
    try { await onPersist(next.map((c) => c.id)); } finally { setIsSaving(false); }
  };

  return (
    <Section title="Categories">
      {categories.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {categories.map((c) => (
            <div key={c.id} className="relative rounded-lg overflow-hidden border border-[#E5EAF2] group">
              <div className="w-full aspect-square bg-[#F7F9FC] flex items-center justify-center">
                {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" /> : <Package size={18} className="text-[#C7D3E0]" />}
              </div>
              <p className="text-[10px] text-[#5B6B82] px-1 py-0.5 truncate">{c.name || "…"}</p>
              <button
                onClick={() => removeOne(c.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <X size={10} className="text-[#DC2626]" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#9BAABB] mb-2">No categories picked yet — showing placeholder categories in the meantime.</p>
      )}
      <button
        onClick={() => setPickerOpen(true)}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-[#E5EAF2] rounded-lg text-xs font-medium text-[#5B6B82] hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-[#F5F0FE]/60 transition-all disabled:opacity-50"
      >
        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        {categories.length > 0 ? "Change categories" : "Select categories"}
      </button>
      <StoreCategoryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedCategoryIds={categories.map((c) => c.id)}
        onConfirm={handleConfirm}
        maxSelect={maxSelect}
      />
    </Section>
  );
};

// ─── Header configuration form ────────────────────────────────────────────────
// No tab switcher. Background colour and images are shown together, each in one
// compact row. Colors use the single-swatch popover picker.
//
// IMPORTANT: the fallback values below (the third element of each tuple, and
// the literal defaults passed to ColorField/ToggleRow) intentionally mirror
// StoreHeader's own internal defaults exactly (componentspreview/StoreHeader.tsx):
// a dark navy band (#0f172a), white text (#ffffff), amber icons (#f59e0b),
// and an orange chat button (#f97316). Previously this form defaulted to a
// teal/white theme while StoreHeader itself defaulted to dark navy — so the
// configurator's swatches didn't match what a brand-new, unconfigured header
// actually looked like in the preview. Keep these three files in sync.

const HeaderConfigForm = ({
  formData,
  onInputChange,
  onImageChange,
}: {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  /** Same shape as onInputChange, but also persists to the backend right
   *  away (see persistField in the parent) — used for image fields so an
   *  upload survives a refresh without requiring "Save changes" first. */
  onImageChange: (field: string, value: any) => void;
}) => (
  <div className="space-y-4">

    {/* Locked notice */}
    <div className="flex items-center gap-2 bg-[#F7F9FC] border border-[#E5EAF2] rounded-xl px-3 py-2.5">
      <Lock size={12} className="text-[#9BAABB] shrink-0" />
      <p className="text-xs text-[#7A90AB]">
        Store Header is always pinned to the top and cannot be moved or removed.
      </p>
    </div>

    {/* ── Background ────────────────────────────────────────────────────── */}
    <Section title="Background">
      <ColorField
        label="Background colour"
        value={formData.headerBgColor ?? "#0f172a"}
        onChange={(v) => onInputChange("headerBgColor", v)}
      />
      <ImageUploadSlot
        label="Mobile image"
        hint="Optional — falls back to desktop image if empty"
        value={formData.headerBgImageMobile}
        onChange={(v) => onImageChange("headerBgImageMobile", v)}
      />
      <ImageUploadSlot
        label="Desktop image"
        hint="Set just this one to use it for both screen sizes"
        value={formData.headerBgImageDesktop}
        onChange={(v) => onImageChange("headerBgImageDesktop", v)}
      />
      {/* Overlay opacity — only relevant when an image is set */}
      {(formData.headerBgImageMobile || formData.headerBgImageDesktop) && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12.5px] font-medium text-[#3D5068]">Image overlay opacity</span>
            <span className="text-[11px] font-mono text-[#7A90AB]">{formData.headerOverlayOpacity ?? 0}%</span>
          </div>
          <input
            type="range" min={0} max={100}
            value={formData.headerOverlayOpacity ?? 0}
            onChange={(e) => onInputChange("headerOverlayOpacity", Number(e.target.value))}
            className="w-full accent-[#1D4ED8]"
          />
        </div>
      )}
    </Section>

    {/* ── Element colours ───────────────────────────────────────────────── */}
    <Section title="Text & icon colours">
      {(
        [
          ["storeNameColor",      "Store name",          "#ffffff"],
          ["followersColor",      "Followers & labels",  "#cbd5e1"],
          ["iconsColor",          "Rating & badge icons","#f59e0b"],
          ["logoRingColor",       "Logo border",         "#ffffff"],
          ["chatButtonColor",     "Chat button",         "#f97316"],
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

  const [updateComponent, { isLoading: isSaving }]        = useUpdateComponentMutation();
  const [upsertBanner,    { isLoading: isSavingBanner }]  = useUpsertBannerCustomizationMutation();
  const [setComponentProducts]                            = useSetComponentProductsMutation();
  const [setComponentCategories]                          = useSetComponentCategoriesMutation();
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

  // Persists the product selection to DecorationComponentProduct via
  // PUT /:decorationId/components/:componentId/products. This is
  // independent of the "Save changes" button/config save below — products
  // live on a relation, not on config.settings, and the picker persists
  // immediately on confirm so a vendor doesn't lose the selection if they
  // close the panel without hitting Save.
  const persistProducts = async (productIds: string[]) => {
    if (!canSave) {
      showToast("error", missingComponentReason ?? "Cannot save products yet.");
      return;
    }
    try {
      await setComponentProducts({
        decorationId,
        componentId: selectedModule!.dbComponentId!,
        productIds,
      }).unwrap();
      showToast("success", "Products updated.");
    } catch (err: any) {
      showToast("error", err?.data?.message ?? "Failed to save products.");
    }
  };

  // Same as persistProducts, for the CategoryList / SmartCategory pickers.
  const persistCategories = async (categoryIds: string[]) => {
    if (!canSave) {
      showToast("error", missingComponentReason ?? "Cannot save categories yet.");
      return;
    }
    try {
      await setComponentCategories({
        decorationId,
        componentId: selectedModule!.dbComponentId!,
        categoryIds,
      }).unwrap();
      showToast("success", "Categories updated.");
    } catch (err: any) {
      showToast("error", err?.data?.message ?? "Failed to save categories.");
    }
  };

  const buildConfigPayload = (data: any = formData): ComponentConfigInput => {
    const t = selectedModule?.type ?? "";
    const toISO = (v?: string) => (v ? new Date(v).toISOString() : undefined);

    // Wrapped in an IIFE so `moduleVariant` can be merged into whatever
    // `settings` each case below returns, in ONE place, guaranteed on every
    // path (including `default: return {}`).
    //
    // WHY THIS MATTERS: config.settings is a JSON column, and Prisma's
    // `update` REPLACES it wholesale rather than deep-merging. Several
    // frontend module types share one backend ComponentType (see
    // resolveModuleMeta's comment in page.tsx), so each component's exact
    // frontend identity is recorded in `settings.moduleVariant` at creation
    // time. Every one of the cases below used to build its OWN `settings`
    // object from scratch — the very first save after creation (even just
    // an image upload auto-save) silently wiped `moduleVariant`, so a
    // FourBanners component would misidentify itself as a plain
    // "Banner Carousel" on the next reload. Merging it back in here, after
    // the switch, closes that hole for every case at once instead of
    // requiring every future case to remember to include it.
    const payload: ComponentConfigInput = (() => {
    switch (t) {
      case "countdownProduct":
        return {
          countdownEndDate:  toISO(data.countdownEndDate),
          showProductPrice:  data.showProductPrice ?? true,
          showProductRating: data.showProductRating ?? true,
          showAddToCart:     data.showAddToCart ?? true,
          settings: {
            countdownTitle:           data.countdownTitle,
            countdownBackgroundColor: data.countdownBackgroundColor,
            timerPosition:            data.timerPosition,
            showDays:    data.showDays ?? true,
            showHours:   data.showHours ?? true,
            showMinutes: data.showMinutes ?? true,
            showSeconds: data.showSeconds ?? true,
          },
        };

      case "graphicCarousel":
        return {
          autoSlide:     !!data.carouselSpeed,
          slideInterval: data.carouselSpeed ? parseInt(data.carouselSpeed) * 1000 : undefined,
          settings: {
            // Stored as { url } objects to match the BannerImage[] shape
            // declared in ComponentConfigInput.settings.bannerImages — the
            // form itself works with plain url strings (see
            // BannerImagesEditor), this is just the save-time conversion.
            bannerImages: (data.bannerImages ?? []).map((url: string) => ({ url })),
            bannerHeight: data.fullWidth ?? "1200px",
          },
        };

      case "graphicThreeImages":
        return {
          settings: {
            bannerType:   data.bannerType,
            bannerLayout: data.bannerLayout,
            bannerImages: (data.bannerImages ?? []).map((url: string) => ({ url })),
          },
        };

      case "categoryBar":
        return {
          settings: {
            showChatButton:    data.showChatButton ?? true,
            showRating:        data.showRating ?? true,
            showVerifiedBadge: data.showVerifiedBadge ?? true,
            showFollowers:     data.showFollowers ?? true,
            showLogo:          data.showLogo ?? true,
            showStoreName:     data.showStoreName ?? true,
            headerBgColor:          data.headerBgColor ?? "#0f172a",
            headerBgImageMobile:    data.headerBgImageMobile,
            headerBgImageDesktop:   data.headerBgImageDesktop,
            headerOverlayOpacity:   data.headerOverlayOpacity ?? 0,
            storeNameColor:      data.storeNameColor ?? "#ffffff",
            followersColor:      data.followersColor ?? "#cbd5e1",
            iconsColor:          data.iconsColor ?? "#f59e0b",
            logoRingColor:       data.logoRingColor ?? "#ffffff",
            chatButtonColor:     data.chatButtonColor ?? "#f97316",
            chatButtonTextColor: data.chatButtonTextColor ?? "#ffffff",
          },
        };

      // ── Product-list components ─────────────────────────────────────────
      // Products themselves are saved separately via persistProducts() /
      // setComponentProducts — this only saves the display-level settings
      // (title, auto-fill count/sort, visibility toggles). `data.products`
      // is NOT written into settings; it is re-derived on load from
      // `component.products` (see componentToFormData in page.tsx).
      case "carouselProductRecommend":
      case "productRecommendation":
      case "sliderRecommend":
      case "threeColumnProducts":
        return {
          settings: {
            title:           data.title,
            showTitle:       data.showTitle ?? true,
            showProductName: data.showProductName ?? true,
            productCount:    Math.min(54, Math.max(1, Number(data.productCount) || 8)),
            sortBy:          data.sortBy ?? "personalized",
            // Only carouselProductRecommend (ProductsCarousel) actually
            // renders this, but it's harmless to carry for the other three
            // — they simply never read it.
            sideImage:       data.sideImage,
          },
        };

      // ── Product Highlight ────────────────────────────────────────────────
      case "productPromotion":
        return {
          settings: {
            title: data.title,
            mode:  data.mode === "manual" ? "manual" : "auto",
          },
        };

      // ── Voucher ───────────────────────────────────────────────────────
      case "voucher":
        return {
          settings: {
            voucherTitle:             data.voucherTitle,
            voucherDescription:       data.voucherDescription,
            voucherCode:              data.voucherCode,
            discountPercentage:       data.discountPercentage ? Number(data.discountPercentage) : undefined,
            discountAmount:           data.discountAmount ? Number(data.discountAmount) : undefined,
            minOrderAmount:           data.minOrderAmount ? Number(data.minOrderAmount) : undefined,
            voucherValidFrom:         toISO(data.voucherValidFrom),
            voucherValidTo:           toISO(data.voucherValidTo),
            voucherBackgroundColor:   data.voucherBackgroundColor ?? "#0d9488",
            voucherTextColor:         data.voucherTextColor ?? "#ffffff",
            showVoucherCode:          data.showVoucherCode ?? true,
          },
        };

      // ── Category-based components — only title/subtitle live on config;
      // the picked categories themselves are saved separately via
      // persistCategories() / setComponentCategories.
      case "brandList":
      case "categoryAuto":
        return {
          settings: {
            title:    data.title,
            subtitle: data.subtitle,
          },
        };

      case "graphicOneImage":
        return {
          settings: {
            bannerHeight:       data.bannerHeight ?? "short",
            bannerImageMobile:  data.bannerImageMobile,
            bannerImageDesktop: data.bannerImageDesktop,
          },
        };

      case "fourBannersA":
        return {
          settings: {
            // Stored as { url } | null to preserve fixed slot positions —
            // see PositionalImagesEditor's comment for why this can't be
            // compacted like the carousel `bannerImages` arrays.
            slotImages: (data.slotImages ?? []).map((url?: string) => (url ? { url } : null)),
            titles:     data.titles,
            subtitles:  data.subtitles,
          },
        };

      case "fiveBannersA":
        return {
          settings: {
            slotImages: (data.slotImages ?? []).map((url?: string) => (url ? { url } : null)),
          },
        };

      case "graphicMultiImages":
        return {
          settings: {
            bannerImages: (data.bannerImages ?? []).map((url: string) => ({ url })),
          },
        };

      default:
        return {};
    }
    })();

    return {
      ...payload,
      settings: { ...(payload.settings ?? {}), moduleVariant: t },
    };
  };

  // Auto-persists a single field change (e.g. an image upload) immediately,
  // instead of waiting for the vendor to hit "Save changes". Uploading an
  // image already hits R2 right away — leaving the *reference* to that
  // image only in local React state (until Save is clicked) meant a
  // refresh, or navigating to another module, silently threw the whole
  // upload away even though the file itself was safely on R2. Mirrors how
  // persistProducts() already auto-saves product picks.
  //
  // `patch` is merged over the current formData to build a config payload
  // that reflects the brand-new value synchronously — we can't just call
  // buildConfigPayload() right after onInputChange(), because the
  // onInputChange state update hasn't re-rendered yet and buildConfigPayload
  // would still read the OLD formData out of this closure.
  const persistField = async (patch: Record<string, any>) => {
    Object.entries(patch).forEach(([key, value]) => onInputChange(key, value));
    if (!canSave) return; // nothing to persist yet (new/unsynced component) — patch still applied locally
    try {
      await updateComponent({
        decorationId,
        componentId: selectedModule!.dbComponentId!,
        data: {
          isVisible: formData.isVisible ?? true,
          config: buildConfigPayload({ ...formData, ...patch }),
        },
      }).unwrap();
    } catch (err: any) {
      showToast("error", err?.data?.message ?? "Failed to save image.");
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

    // Block real editing until the component has actually synced to the
    // backend (dbComponentId assigned). Every image upload / product pick
    // below auto-saves immediately via persistField / persistProducts /
    // persistCategories — but those silently no-op while `canSave` is
    // false (see their own `if (!canSave) return`, needed so they don't
    // throw on a component that legitimately hasn't synced yet). Without
    // this guard, a vendor who edits within that brief window (very easy
    // to do right after dragging a new module in) would see their change
    // reflected locally and then silently lose it — no error, no save.
    // Sync is normally a ~1-2s round trip; this just makes that wait
    // visible instead of leaving the form open to a silent-loss window.
    if (selectedModule && !canSave) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Loader2 size={22} className="animate-spin text-[#1D4ED8]" />
          <p className="text-sm text-[#7A90AB]">
            {missingComponentReason ?? "Syncing this component to the server…"}
          </p>
          <p className="text-xs text-[#9BAABB]">This only takes a moment. Your changes will be editable as soon as it's done.</p>
        </div>
      );
    }

    switch (t) {
      case "graphicCarousel":
        return (
          <div className="space-y-4">
            <Section title="Display">
              <RadioGroup name="title" options={["Display", "Hidden"]} value={formData.title ?? "Hidden"} onChange={(v) => onInputChange("title", v)} />
            </Section>
            <Section title="Width">
              <RadioGroup name="fullWidth" options={["1200px", "1920px"]} value={formData.fullWidth ?? "1200px"} onChange={(v) => onInputChange("fullWidth", v)} />
            </Section>
            <Section title="Images">
              <BannerImagesEditor
                images={formData.bannerImages ?? []}
                onChange={(imgs) => persistField({ bannerImages: imgs })}
              />
              <p className="text-xs text-[#9BAABB]">JPG, PNG, GIF · max 5 MB each</p>
            </Section>
            <Section title="Carousel speed">
              <RadioGroup name="carouselSpeed" options={["3 seconds", "5 seconds", "10 seconds", "15 seconds"]} value={formData.carouselSpeed ?? "5 seconds"} onChange={(v) => onInputChange("carouselSpeed", v)} />
            </Section>
          </div>
        );

      case "countdownProduct":
        return (
          <div className="space-y-4">
            <Section title="Timer">
              <div>
                <label className={LABEL_CLASS}>End time <span className="text-[#DC2626]">*</span></label>
                <input type="datetime-local" value={formData.countdownEndDate ?? ""} onChange={(e) => onInputChange("countdownEndDate", e.target.value)}
                  className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Title</label>
                <input type="text" placeholder="e.g. Flash Sale!" value={formData.countdownTitle ?? ""} onChange={(e) => onInputChange("countdownTitle", e.target.value)}
                  className={INPUT_CLASS} />
              </div>
              <ColorField label="Background colour" value={formData.countdownBackgroundColor ?? "#0d9488"} onChange={(v) => onInputChange("countdownBackgroundColor", v)} />
              <div>
                <label className={LABEL_CLASS}>Timer position</label>
                <select value={formData.timerPosition ?? "TOP_RIGHT"} onChange={(e) => onInputChange("timerPosition", e.target.value)}
                  className={INPUT_CLASS}>
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
            <ProductsTargetSection
              label="Target products"
              products={formData.products ?? []}
              onChange={(products) => onInputChange("products", products)}
              onPersist={persistProducts}
              maxSelect={12}
            />
          </div>
        );

      // ── Product-list components (all share the same shape: a title +
      // a set of targeted products) ─────────────────────────────────────
      // ── Product-list components: title + manual product picker (which
      // wins when non-empty) + auto-fetch settings (used only when no
      // products have been manually picked — see useAutoProducts.ts) ──────
      case "carouselProductRecommend":
      case "productRecommendation":
      case "sliderRecommend":
      case "threeColumnProducts": {
        const TITLE_DEFAULTS: Record<string, string> = {
          carouselProductRecommend: "Recommended For You",
          productRecommendation:    "Recommended For You",
          sliderRecommend:          "Drag Module",
          threeColumnProducts:      "Best Sellers",
        };
        const hasManualPicks = (formData.products ?? []).length > 0;
        return (
          <div className="space-y-4">
            <Section title="Content">
              <div>
                <label className={LABEL_CLASS}>Section title</label>
                <input
                  type="text"
                  placeholder={TITLE_DEFAULTS[t as string]}
                  value={formData.title ?? ""}
                  onChange={(e) => onInputChange("title", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <ToggleRow label="Title"        checked={formData.showTitle ?? true}       onChange={(v) => onInputChange("showTitle", v)} />
              <ToggleRow label="Product Name" checked={formData.showProductName ?? true} onChange={(v) => onInputChange("showProductName", v)} />
            </Section>

            {t === "carouselProductRecommend" && (
              <Section title="Side banner">
                <ImageUploadSlot
                  label="Side image"
                  hint="Shown in the left panel next to the products"
                  value={formData.sideImage}
                  onChange={(v) => persistField({ sideImage: v })}
                />
              </Section>
            )}

            <Section title="Auto-fill settings">
              <p className="text-xs text-[#9BAABB]">
                {hasManualPicks
                  ? "Manually-picked products below are shown instead — clear them to use these settings."
                  : "No products picked below, so these settings choose what's shown automatically."}
              </p>
              <div>
                <label className={LABEL_CLASS}>Number of Products to Display</label>
                <input
                  type="number"
                  min={1}
                  max={54}
                  value={formData.productCount ?? 8}
                  onChange={(e) => onInputChange("productCount", Math.min(54, Math.max(1, Number(e.target.value) || 1)))}
                  className={INPUT_CLASS}
                />
                <p className="text-xs text-[#9BAABB] mt-1">Max 54</p>
              </div>
              <div>
                <label className={LABEL_CLASS}>Sort By</label>
                <select
                  value={formData.sortBy ?? "personalized"}
                  onChange={(e) => onInputChange("sortBy", e.target.value)}
                  className={INPUT_CLASS}
                >
                  {SORT_BY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </Section>

            <ProductsTargetSection
              label="Manually pick products (optional)"
              products={formData.products ?? []}
              onChange={(products) => onInputChange("products", products)}
              onPersist={persistProducts}
              maxSelect={20}
            />
          </div>
        );
      }

      // ── Product Highlight — auto (4 newest, live) or manual (exactly 4,
      // vendor-picked) ─────────────────────────────────────────────────────
      case "productPromotion": {
        const mode = formData.mode ?? "auto";
        const pickedCount = (formData.products ?? []).length;
        return (
          <div className="space-y-4">
            <Section title="Content">
              <div>
                <label className={LABEL_CLASS}>Section title</label>
                <input
                  type="text"
                  placeholder="Product Highlight"
                  value={formData.title ?? ""}
                  onChange={(e) => onInputChange("title", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </Section>

            <Section title="Products">
              <RadioGroup
                name="highlightMode"
                options={["auto", "manual"]}
                value={mode}
                onChange={(v) => onInputChange("mode", v)}
              />
              {mode === "auto" ? (
                <p className="text-xs text-[#9BAABB]">
                  The system will display the four most recently added products automatically.
                </p>
              ) : (
                <>
                  <p className={`text-xs mb-2 ${pickedCount === 4 ? "text-emerald-600" : "text-amber-600"}`}>
                    {pickedCount === 4
                      ? "4 products picked."
                      : `Pick exactly 4 products — you currently have ${pickedCount}. Not 4? It won't display correctly.`}
                  </p>
                  <ProductsTargetSection
                    label="Pick exactly 4 products"
                    products={formData.products ?? []}
                    onChange={(products) => onInputChange("products", products)}
                    onPersist={persistProducts}
                    maxSelect={4}
                  />
                </>
              )}
            </Section>
          </div>
        );
      }

      case "voucher":
        return (
          <div className="space-y-4">
            <Section title="Voucher details">
              <div>
                <label className={LABEL_CLASS}>Title</label>
                <input type="text" placeholder="e.g. Mega Sale" value={formData.voucherTitle ?? ""} onChange={(e) => onInputChange("voucherTitle", e.target.value)}
                  className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Description</label>
                <input type="text" placeholder="e.g. Flat discount on all orders" value={formData.voucherDescription ?? ""} onChange={(e) => onInputChange("voucherDescription", e.target.value)}
                  className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Voucher code</label>
                <input type="text" placeholder="e.g. SAVE50NOW" value={formData.voucherCode ?? ""} onChange={(e) => onInputChange("voucherCode", e.target.value.toUpperCase())}
                  className={`${INPUT_CLASS} font-mono tracking-wide`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Discount %</label>
                  <input type="number" min={0} max={100} placeholder="50" value={formData.discountPercentage ?? ""} onChange={(e) => onInputChange("discountPercentage", e.target.value)}
                    className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Or flat amount</label>
                  <input type="number" min={0} placeholder="৳100" value={formData.discountAmount ?? ""} onChange={(e) => onInputChange("discountAmount", e.target.value)}
                    className={INPUT_CLASS} />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Minimum order amount</label>
                <input type="number" min={0} placeholder="৳500" value={formData.minOrderAmount ?? ""} onChange={(e) => onInputChange("minOrderAmount", e.target.value)}
                  className={INPUT_CLASS} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Valid from</label>
                  <input type="date" value={formData.voucherValidFrom ?? ""} onChange={(e) => onInputChange("voucherValidFrom", e.target.value)}
                    className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Valid to</label>
                  <input type="date" value={formData.voucherValidTo ?? ""} onChange={(e) => onInputChange("voucherValidTo", e.target.value)}
                    className={INPUT_CLASS} />
                </div>
              </div>
              <ColorField label="Background colour" value={formData.voucherBackgroundColor ?? "#0d9488"} onChange={(v) => onInputChange("voucherBackgroundColor", v)} />
              <ColorField label="Text colour" value={formData.voucherTextColor ?? "#ffffff"} onChange={(v) => onInputChange("voucherTextColor", v)} />
              <ToggleRow label="Show voucher code" checked={formData.showVoucherCode ?? true} onChange={(v) => onInputChange("showVoucherCode", v)} />
            </Section>
          </div>
        );

      case "graphicThreeImages":
        return (
          <div className="space-y-4">
            <Section title="Layout">
              <div className="grid grid-cols-2 gap-3">
                {["Layout 1","Layout 2","Layout 3","Layout 4"].map((l) => (
                  <button key={l} onClick={() => onInputChange("bannerLayout", l)}
                    className={`p-3 border rounded text-sm transition-colors ${formData.bannerLayout === l ? "border-[#1D4ED8] bg-[#EEF3FB] text-[#1D4ED8]" : "border-[#E5EAF2] hover:border-[#1D4ED8]"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Images (up to 3)">
              <BannerImagesEditor
                images={formData.bannerImages ?? []}
                onChange={(imgs) => persistField({ bannerImages: imgs })}
                max={3}
              />
            </Section>
          </div>
        );

      case "categoryBar":
        return (
          <HeaderConfigForm
            formData={formData}
            onInputChange={onInputChange}
            onImageChange={(field, value) => persistField({ [field]: value })}
          />
        );

      // ── Category-based components (same shape: title/subtitle + a
      // manually-picked set of categories) ────────────────────────────
      case "brandList":
      case "categoryAuto":
        return (
          <div className="space-y-4">
            <Section title="Content">
              <div>
                <label className={LABEL_CLASS}>Title</label>
                <input type="text" placeholder="Shop by Category" value={formData.title ?? ""} onChange={(e) => onInputChange("title", e.target.value)}
                  className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Subtitle</label>
                <input type="text" placeholder="Browse our wide range of products" value={formData.subtitle ?? ""} onChange={(e) => onInputChange("subtitle", e.target.value)}
                  className={INPUT_CLASS} />
              </div>
            </Section>
            <CategoriesTargetSection
              categories={formData.categories ?? []}
              onChange={(categories) => onInputChange("categories", categories)}
              onPersist={persistCategories}
              maxSelect={8}
            />
          </div>
        );

      // ── Single full-width banner ──────────────────────────────────────
      case "graphicOneImage":
        return (
          <div className="space-y-4">
            <Section title="Height">
              <RadioGroup
                name="bannerHeight"
                options={["short", "tall", "wide"]}
                value={formData.bannerHeight ?? "short"}
                onChange={(v) => onInputChange("bannerHeight", v)}
              />
            </Section>
            <Section title="Images">
              <ImageUploadSlot
                label="Mobile image"
                value={formData.bannerImageMobile}
                onChange={(v) => persistField({ bannerImageMobile: v })}
              />
              <ImageUploadSlot
                label="Desktop image"
                value={formData.bannerImageDesktop}
                onChange={(v) => persistField({ bannerImageDesktop: v })}
              />
            </Section>
          </div>
        );

      // ── Four-banner grid (1 large + 3 small, each with title/subtitle) ─
      case "fourBannersA": {
        const FOUR_LABELS = ["Large banner (top)", "Second banner", "Third banner", "Fourth banner"];
        const slotImages: (string | undefined)[] = formData.slotImages ?? [];
        const titles: string[] = formData.titles ?? ["FASHION", "KIDS SALE", "Men Brands", "WOMEN FASHION"];
        const subtitles: string[] = formData.subtitles ?? ["New Collection", "Up to 50% Off", "Top Picks", "Latest Trends"];

        const updateAt = (arr: string[], i: number, v: string) => {
          const next = [...arr];
          next[i] = v;
          return next;
        };

        return (
          <div className="space-y-4">
            <Section title="Images">
              <PositionalImagesEditor
                labels={FOUR_LABELS}
                images={slotImages}
                onChange={(imgs) => persistField({ slotImages: imgs })}
              />
            </Section>
            <Section title="Text">
              {FOUR_LABELS.map((label, i) => (
                <div key={i} className="border border-[#F0F4FA] rounded-xl p-2.5 space-y-2 mb-2">
                  <p className="text-xs font-medium text-[#7A90AB]">{label}</p>
                  <input type="text" placeholder="Title" value={titles[i] ?? ""} onChange={(e) => onInputChange("titles", updateAt(titles, i, e.target.value))}
                    className="w-full p-1.5 border border-[#E5EAF2] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]" />
                  <input type="text" placeholder="Subtitle" value={subtitles[i] ?? ""} onChange={(e) => onInputChange("subtitles", updateAt(subtitles, i, e.target.value))}
                    className="w-full p-1.5 border border-[#E5EAF2] rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]" />
                </div>
              ))}
            </Section>
          </div>
        );
      }

      // ── Five-banner grid (topLeft, topRight, centerMain, bottomLeft, bottomRight) ─
      case "fiveBannersA":
        return (
          <div className="space-y-4">
            <Section title="Images">
              <PositionalImagesEditor
                labels={["Top left", "Top right", "Center (main)", "Bottom left", "Bottom right"]}
                images={formData.slotImages ?? []}
                onChange={(imgs) => persistField({ slotImages: imgs })}
              />
            </Section>
          </div>
        );

      // ── Multiple equal-size banners in a row (up to 4) ─────────────────
      case "graphicMultiImages":
        return (
          <div className="space-y-4">
            <Section title="Images (up to 4)">
              <BannerImagesEditor
                images={formData.bannerImages ?? []}
                onChange={(imgs) => persistField({ bannerImages: imgs })}
                max={4}
              />
            </Section>
          </div>
        );

      default:
        return (
          <div className="text-center text-[#7A90AB] py-8">
            <img src={displayModule?.icon} alt={displayModule?.name} className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">{displayModule?.name}</p>
            <p className="text-sm text-[#9BAABB] mt-1">Configuration options will be available soon.</p>
          </div>
        );
    }
  };

  if (!displayModule) {
    return (
      <div className="w-96 bg-[#F7F9FC] border-l border-[#E5EAF2] flex items-center justify-center h-screen" style={{ fontFamily: FONT_FAMILY }}>
        <p className="text-[#7A90AB] text-[13px]">Select a module to configure</p>
      </div>
    );
  }

  return (
    <div className="w-96 bg-[#F7F9FC] border-l border-[#E5EAF2] relative" style={{ fontFamily: FONT_FAMILY }}>
      <button onClick={onClose}
        className="absolute -left-6 top-1/2 -translate-y-1/2 bg-gradient-to-b from-[#1D4ED8] to-[#7C3AED] text-white p-1 rounded-l-lg shadow-lg hover:brightness-110 transition-all z-10"
        title="Close configuration">
        <ChevronRight size={16} />
      </button>

      <div className="h-screen overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-3.5 py-3 border-b border-[#E5EAF2] flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-1.5">
            <ChevronLeft size={15} className="text-[#7A90AB] cursor-pointer hover:text-[#0D1B2E]" onClick={onClose} />
            <span className="text-[13.5px] font-bold text-[#0D1B2E] tracking-[-0.2px]">{displayModule.name}</span>
            {isHeader && (
              <span className="flex items-center gap-1 bg-[#EEF3FB] text-[#7A90AB] text-[9.5px] font-bold px-1.5 py-0.5 rounded-full">
                <Lock size={9} /> Pinned
              </span>
            )}
          </div>
          {selectedModule && onDeleteModule && !isHeader && (
            <button onClick={() => onDeleteModule(selectedModule.id)} className="p-1 hover:bg-red-50 rounded-md transition-colors" title="Delete">
              <Trash2 size={14} className="text-[#DC2626]" />
            </button>
          )}
        </div>

        {/* Sync strip */}
        <div className="px-3.5 py-1.5 text-[10.5px] text-[#9BAABB] border-b border-[#F0F4FA] bg-[#FAFBFD] flex-shrink-0 flex items-center gap-1.5">
          {selectedModule?.dbComponentId ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />ID: {selectedModule.dbComponentId}</>
          ) : selectedModule ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />Syncing…</>
          ) : `Type: ${selectedSidebarModule?.id ?? "—"}`}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-3.5 mt-2.5 px-3 py-2 rounded-lg flex items-center gap-2 text-[12.5px] font-medium flex-shrink-0 ${
            toast.type === "success" ? "bg-[#F0F9F0] border border-[#BBF7D0] text-[#16A34A]" : "bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626]"
          }`}>
            {toast.type === "success" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
            {toast.message}
          </div>
        )}

        {/* Not-added notice */}
        {!selectedModule && selectedSidebarModule && (
          <div className="mx-3.5 mt-2.5 p-2.5 bg-[#EEF3FB] border border-[#C7D7F5] rounded-lg flex items-center gap-2.5 flex-shrink-0">
            <img src={selectedSidebarModule.icon} alt="" className="w-8 h-8" />
            <p className="text-[11.5px] text-[#1D4ED8] font-medium">Drag to the canvas to enable configuration.</p>
          </div>
        )}

        {/* Pending-sync notice */}
        {selectedModule && !selectedModule.dbComponentId && (
          <div className="mx-3.5 mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 flex-shrink-0">
            <Loader2 size={12} className="animate-spin text-amber-500" />
            <p className="text-[11.5px] text-amber-700 font-medium">Saving to server — configure in a moment.</p>
          </div>
        )}

        {/* Form */}
        <div className="p-3.5 flex-1 overflow-y-auto space-y-3.5">
          {renderForm()}

          {/* Common settings — not shown for header */}
          {!isHeader && (
            <Section title="Common">
              <ToggleRow label="Hide bottom margin" checked={formData.displayBottomMargin ?? false} onChange={(v) => onInputChange("displayBottomMargin", v)} />
              <ToggleRow label="Make module visible" checked={formData.isVisible ?? true} onChange={(v) => onInputChange("isVisible", v)} />
            </Section>
          )}
        </div>

        {/* Save footer */}
        <div className="p-3.5 border-t border-[#E5EAF2] flex-shrink-0 bg-white">
          <button
            onClick={handleSave}
            disabled={!canSave || isAnySaving}
            className={`w-full py-2.5 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
              canSave && !isAnySaving
                ? "bg-gradient-to-r from-[#1D4ED8] to-[#7C3AED] text-white hover:brightness-110 shadow-sm shadow-[#7C3AED]/25"
                : "bg-[#F0F4FA] text-[#9BAABB] cursor-not-allowed"
            }`}
          >
            {isAnySaving
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : <><Save size={14} /> {canSave ? "Save changes" : "Waiting for server…"}</>}
          </button>
          {missingComponentReason && (
            <p className="text-[10.5px] text-[#9BAABB] text-center mt-2">{missingComponentReason}</p>
          )}
        </div>
      </div>
    </div>
  );
};