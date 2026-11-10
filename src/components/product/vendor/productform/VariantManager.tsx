"use client";
import React, { useState, useMemo, JSX, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Plus, X, Trash2, Copy, ChevronDown, Check, Package,
  AlertCircle, Image as ImageIcon, Info, RefreshCw, FolderOpen, Upload,
} from "lucide-react";
import ImageUploader from "@/components/imageuploader/ImageUploader";
import MediaCenter, { MediaCenterItem } from "@/components/mediauploader/MediaCenter";
import { ProductVariantInput, ProductImageInput } from "@/types/product";
import { VariantNamePart } from "@/types/product";
import { Attribute, AttributeValue } from "@/types/type";

interface Props {
  variants: ProductVariantInput[];
  setVariants: (v: ProductVariantInput[]) => void;
  variantNameParts: Record<string, VariantNamePart>;
  onGenerateVariantName: () => string;
  categoryAttributes?: Attribute[];
}

/* ─── Module-scope helpers ───────────────────────────────────────────────
   Th / Td used to be declared INSIDE VariantManager's render body. That
   meant a brand-new component type was created on every render —
   including every keystroke in the SKU input — so React unmounted and
   remounted the whole <Td> (and the <Input> inside it) each time,
   killing focus after one character. Declaring them once here, at
   module scope, fixes it.
────────────────────────────────────────────────────────────────────── */

function Th({ children, minW = 120 }: { children: React.ReactNode; minW?: number }) {
  return (
    <th
      style={{
        padding: "10px 12px",
        textAlign: "left",
        fontSize: 11.5,
        fontWeight: 700,
        color: "#3D5068",
        background: "#EFF6FF",
        borderBottom: "0.5px solid #BFDBFE",
        borderRight: "0.5px solid #E2E8F0",
        minWidth: minW,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  center = false,
  span = 1,
}: {
  children: React.ReactNode;
  center?: boolean;
  span?: number;
}) {
  return (
    <td
      rowSpan={span}
      style={{
        padding: "8px 10px",
        fontSize: 13,
        color: "#0F172A",
        borderBottom: "0.5px solid #E2E8F0",
        borderRight: "0.5px solid #E2E8F0",
        textAlign: center ? "center" : "left",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

function ApplyInput({ onApply, placeholder }: { onApply: (n: number) => void; placeholder: string }) {
  return (
    <Input
      type="number"
      step="0.01"
      min="0"
      placeholder={placeholder}
      style={{ fontSize: 11, height: 28, marginTop: 4, borderColor: "#BFDBFE", background: "#F8FAFC" }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const val = Number((e.target as HTMLInputElement).value);
          if (val >= 0) {
            onApply(val);
            (e.target as HTMLInputElement).value = "";
          }
        }
      }}
    />
  );
}

/**
 * Small hover-tooltip icon. Replaced the old native `title` attribute
 * (plain OS tooltip, left-aligned to the cursor, no styling control)
 * with a custom floating panel that:
 *  - is horizontally centered on the icon itself (left: 50% + translateX(-50%))
 *  - opens upward with a colorful gradient card + arrow pointer
 *  - stays open on hover of either the icon or the panel
 */
function FieldHint({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        onClick={() => setShow((s) => !s)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          cursor: "help",
          color: "#1D4ED8",
          background: "#DBEAFE",
          transition: "all 0.15s",
        }}
      >
        <Info size={11} />
      </span>

      {show && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 260,
            maxWidth: "70vw",
            padding: "12px 14px",
            borderRadius: 12,
            background: "linear-gradient(135deg,#1D4ED8 0%,#0891B2 55%,#059669 100%)",
            color: "#FFFFFF",
            fontSize: 11.5,
            fontWeight: 500,
            lineHeight: 1.55,
            letterSpacing: "0.01em",
            textAlign: "left",
            boxShadow: "0 12px 28px rgba(29,78,216,0.35), 0 2px 8px rgba(0,0,0,0.08)",
            zIndex: 300,
            whiteSpace: "normal",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Info size={11} color="#fff" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.9 }}>
              SKU tip
            </span>
          </div>
          {text}

          {/* centered arrow pointer, anchored to the icon below */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "7px solid #0891B2",
            }}
          />
        </div>
      )}
    </span>
  );
}

/** Generates a SKU that's extremely unlikely to collide with existing ones. */
function generateUniqueSKU(variant: ProductVariantInput): string {
  const namePart =
    (variant.name || "SKU").replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "SKU";
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${namePart}-${timePart}-${randPart}`;
}

/**
 * Formats manually-typed SKU input: forces uppercase and converts any
 * run of whitespace into a single hyphen, so vendor-typed SKUs stay
 * consistent with the auto-generated ones (e.g. "red shirt m" -> "RED-SHIRT-M").
 */
function formatSkuInput(value: string): string {
  return value.toUpperCase().replace(/\s+/g, "-");
}

const SKU_HINT =
  "Unique code identifying this exact variant (e.g. size/color combo). It must be unique across your entire store — a duplicate SKU will be rejected when you save. Use the Generate button for a safe, collision-free code, or write your own using a consistent pattern like CATEGORY-COLOR-SIZE.";

/**
 * Generates a scannable EAN-13 barcode number (13 digits, valid check
 * digit) using the 200xxxxxxxxxx internal-use GS1 prefix range — safe to
 * use without a registered GS1 company prefix since it's for in-store /
 * POS scanning only, not retail resale.
 */
function generateUniqueBarcode(): string {
  const timePart = Date.now().toString().slice(-6);
  const randPart = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  const digits12 = `200${timePart}${randPart}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(digits12[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${digits12}${check}`;
}

const BARCODE_HINT =
  "Scannable code for this variant, used at POS to add it to a sale instantly. Leave empty and the system auto-generates a unique EAN-13 code when you save — or click Generate to preview/print one now, or type your own if you already have physical barcode labels.";

/** Small pill-style toggle used to switch between "Upload" and "Media Center" inside the image panel. */
function SourceToggle({
  active,
  onChange,
}: {
  active: "upload" | "media";
  onChange: (v: "upload" | "media") => void;
}) {
  const tabs: { id: "upload" | "media"; label: string; icon: React.ReactNode }[] = [
    { id: "upload", label: "Upload new", icon: <Upload size={12} /> },
    { id: "media", label: "Media Center", icon: <FolderOpen size={12} /> },
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 3,
        borderRadius: 9,
        background: "#E2E8F0",
        gap: 2,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 7,
              border: "none",
              background: isActive ? "#FFFFFF" : "transparent",
              color: isActive ? "#1D4ED8" : "#64748B",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function VariantManager({
  variants,
  setVariants,
  variantNameParts,
  onGenerateVariantName,
  categoryAttributes = [],
}: Props) {
  const [showImageUploaders, setShowImageUploaders] = useState<Record<string, boolean>>({});
  const [imageSourceTab, setImageSourceTab] = useState<Record<string, "upload" | "media">>({});
  const [mediaCenterVariantId, setMediaCenterVariantId] = useState<string | null>(null);
  const [showAttributeDropdown, setShowAttributeDropdown] = useState(false);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);
  const [showValueDropdown, setShowValueDropdown] = useState(false);

  const isDefaultEmptyVariant = (variant: ProductVariantInput): boolean =>
    !variant.name &&
    !variant.sku &&
    variant.price === 0 &&
    variant.stock === 0 &&
    (!variant.attributes || variant.attributes.length === 0);

  const attributeValuesMap = useMemo(() => {
    const map: Record<string, AttributeValue[]> = {};
    categoryAttributes.forEach((attr) => {
      if (attr.values && attr.values.length > 0) map[attr.id] = attr.values;
    });
    return map;
  }, [categoryAttributes]);

  const availableAttributes = useMemo(() => {
    return Object.entries(variantNameParts)
      .filter(([_, part]) => part.include && part.value && part.value !== "")
      .map(([id, part]) => ({
        id,
        name: part.name || "",
        value: part.value,
        includeInVariant: part.include,
        attributeValues: attributeValuesMap[id] || [],
      }));
  }, [variantNameParts, attributeValuesMap]);

  const findAttributeValueId = (attributeId: string, value: string): string => {
    const values = attributeValuesMap[attributeId];
    if (!values || values.length === 0) return attributeId;
    return values.find((v) => v.value === value)?.id || attributeId;
  };

  const variantExists = (attributeId: string, value: string): boolean => {
    const attributeValueId = findAttributeValueId(attributeId, value);
    return variants.some((v) => v.attributes?.some((a) => a.attributeValueId === attributeValueId));
  };

  const toggleVariantByAttribute = (attributeId: string, attributeName: string, value: string) => {
    const attributeValueId = findAttributeValueId(attributeId, value);
    const exists = variantExists(attributeId, value);

    if (exists) {
      setVariants(variants.filter((v) => !v.attributes?.some((a) => a.attributeValueId === attributeValueId)));
    } else {
      const filteredVariants = variants.filter((v) => !isDefaultEmptyVariant(v));
      setVariants([
        ...filteredVariants,
        {
          id: String(Date.now()),
          name: `${attributeName}: ${value}`,
          sku: "",
          price: 0,
          stock: 0,
          images: [],
          attributes: [{ attributeValueId, value }],
          availability: true,
        },
      ]);
    }
  };

  const removeVariant = (id?: string) => {
    if (!id) return;
    if (variants.length <= 1) { alert("At least one variant row is required"); return; }
    setVariants(variants.filter((v) => v.id !== id));
    setShowImageUploaders((prev) => { const s = { ...prev }; delete s[id]; return s; });
  };

  const handleChange = (id: string | undefined, field: keyof ProductVariantInput, value: string | number | boolean | null) => {
    if (!id) return;
    setVariants(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const handleSkuChange = (id: string | undefined, rawValue: string) => {
    if (!id) return;
    handleChange(id, "sku", formatSkuInput(rawValue));
  };

  const handleImagesChange = (id: string | undefined, images: (string | ProductImageInput)[]) => {
    if (!id) return;
    setVariants(variants.map((v) => (v.id === id ? { ...v, images: images.slice(0, 8) } : v)));
  };

  /** Called when the vendor confirms a selection inside MediaCenter for a specific variant. */
  const handleMediaCenterSelect = (variantId: string, items: MediaCenterItem[]) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    const existingUrls = new Set(
      (variant.images || []).map((img) => (typeof img === "string" ? img : img.url))
    );
    const newUrls = items.map((it) => it.url).filter((url) => !existingUrls.has(url));

    const merged: (string | ProductImageInput)[] = [
      ...(variant.images || []),
      ...newUrls,
    ].slice(0, 8);

    handleImagesChange(variantId, merged);
    setMediaCenterVariantId(null);
  };

  const toggleImageUploader = (id: string | undefined) => {
    if (!id) return;
    setShowImageUploaders((prev) => ({ ...prev, [id]: !prev[id] }));
    setImageSourceTab((prev) => (prev[id] ? prev : { ...prev, [id]: "upload" }));
  };

  const handleSpecialPriceChange = (id: string | undefined, specialPrice: number | null) => {
    if (!id) return;
    const variant = variants.find((v) => v.id === id);
    if (!variant) return;
    const discount = specialPrice && specialPrice < variant.price
      ? Math.round(((variant.price - specialPrice) / variant.price) * 100)
      : 0;
    setVariants(variants.map((v) => (v.id === id ? { ...v, specialPrice: specialPrice || null, discount } : v)));
  };

  const applyPriceToAll = (price: number) => {
    if (price <= 0) return;
    setVariants(variants.map((v) => ({ ...v, price })));
  };

  const applySpecialPriceToAll = (specialPrice: number) => {
    if (specialPrice <= 0) return;
    setVariants(variants.map((v) => {
      const discount = specialPrice < v.price ? Math.round(((v.price - specialPrice) / v.price) * 100) : 0;
      return { ...v, specialPrice, discount };
    }));
  };

  const applyStockToAll = (stock: number) => {
    if (stock < 0) return;
    setVariants(variants.map((v) => ({ ...v, stock })));
  };

  const duplicateVariant = (variantId: string) => {
    const v = variants.find((v) => v.id === variantId);
    if (!v) return;
    setVariants([...variants, { ...v, id: String(Date.now()), sku: "", name: `${v.name} (Copy)` }]);
  };

  useEffect(() => {
    const hasNonEmpty = variants.some((v) => !isDefaultEmptyVariant(v));
    if (variants.length === 0 || (!hasNonEmpty && variants.length === 1)) {
      setVariants([{ id: String(Date.now()), name: "", sku: "", price: 0, stock: 0, images: [], attributes: [], availability: true }]);
    } else if (hasNonEmpty) {
      const filtered = variants.filter((v) => !isDefaultEmptyVariant(v));
      if (filtered.length !== variants.length) setVariants(filtered);
    }
  }, [variants.length]);

  const displayVariants = variants.filter((v) => !isDefaultEmptyVariant(v) || variants.length === 1);

  const renderValueDropdown = () => {
    if (!selectedAttributeId) return null;
    const attribute = availableAttributes.find((a) => a.id === selectedAttributeId);
    if (!attribute) return null;

    let values: Array<{ id: string; value: string }> = [];

    if (attribute.attributeValues && attribute.attributeValues.length > 0) {
      values = attribute.attributeValues.map((av) => ({ id: av.id, value: av.value }));
    } else {
      try {
        const parsed = JSON.parse(attribute.value);
        values = Array.isArray(parsed)
          ? parsed.map((v, idx) => ({ id: `${attribute.id}-${idx}`, value: String(v) }))
          : [{ id: attribute.id, value: String(parsed || attribute.value) }];
      } catch {
        values = [{ id: attribute.id, value: String(attribute.value) }];
      }
    }

    if (values.length === 0) {
      return (
        <div style={{ padding: "12px 14px", fontSize: 12, color: "#64748B" }}>No values available</div>
      );
    }

    return values.map((item) => {
      const exists = variantExists(attribute.id, item.value);
      return (
        <button
          key={item.id}
          onClick={() => toggleVariantByAttribute(attribute.id, attribute.name, item.value)}
          style={{
            width: "100%",
            padding: "9px 14px",
            textAlign: "left",
            background: exists ? "#EFF6FF" : "none",
            border: "none",
            borderBottom: "0.5px solid #F0F4FA",
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => { if (!exists) e.currentTarget.style.background = "#F8FAFC"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = exists ? "#EFF6FF" : "none"; }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              border: `1.5px solid ${exists ? "#1D4ED8" : "#CBD5E1"}`,
              background: exists ? "#1D4ED8" : "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            {exists && <Check size={10} color="#FFFFFF" />}
          </div>
          <span style={{ fontSize: 13, color: exists ? "#1D4ED8" : "#0F172A", fontWeight: exists ? 600 : 400 }}>
            {item.value}
          </span>
        </button>
      );
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>

      {/* ── Header row ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#DBEAFE", border: "0.5px solid #93C5FD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={14} color="#1D4ED8" />
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0D1B2E", letterSpacing: "-0.2px" }}>
              Product variants
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: "#64748B", marginLeft: 36 }}>
            Manage variants with different attributes — SKU, price, and stock per combination
          </p>
          {availableAttributes.length === 0 && (
            <div
              style={{
                marginTop: 8,
                marginLeft: 36,
                display: "flex",
                alignItems: "flex-start",
                gap: 7,
                padding: "8px 12px",
                background: "#FFFBEB",
                border: "0.5px solid #FCD34D",
                borderRadius: 8,
                fontSize: 12,
                color: "#92400E",
              }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              No attributes marked for variant. Go to Specifications and toggle the "Use for variant" switch.
            </div>
          )}
        </div>

        {/* Select Variant button + dropdown */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => {
              if (availableAttributes.length === 0) {
                alert("No attributes available. Please mark attributes as 'Use for variant' in Specifications.");
                return;
              }
              setShowAttributeDropdown((p) => !p);
              setShowValueDropdown(false);
              setSelectedAttributeId(null);
            }}
            disabled={availableAttributes.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 16px",
              borderRadius: 9,
              border: "none",
              background: availableAttributes.length === 0
                ? "#CBD5E1"
                : "linear-gradient(135deg,#1D4ED8,#0891B2)",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              cursor: availableAttributes.length === 0 ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            <Plus size={14} />
            Select variant
            <ChevronDown size={13} />
          </button>

          {/* Attribute dropdown */}
          {showAttributeDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: "#FFFFFF",
                border: "0.5px solid #BFDBFE",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(37,99,235,0.1)",
                zIndex: 100,
                minWidth: 200,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "7px 12px", background: "#EFF6FF", borderBottom: "0.5px solid #BFDBFE", fontSize: 10.5, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Choose attribute
              </div>
              {availableAttributes.map((attr) => (
                <button
                  key={attr.id}
                  onClick={() => { setSelectedAttributeId(attr.id); setShowValueDropdown(true); setShowAttributeDropdown(false); }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    borderBottom: "0.5px solid #F0F4FA",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={12} color="#10B981" />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{attr.name}</span>
                  </div>
                  <ChevronDown size={12} color="#94A3B8" style={{ transform: "rotate(-90deg)" }} />
                </button>
              ))}
            </div>
          )}

          {/* Value dropdown */}
          {showValueDropdown && selectedAttributeId && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: "#FFFFFF",
                border: "0.5px solid #BFDBFE",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(37,99,235,0.1)",
                zIndex: 100,
                minWidth: 220,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "8px 12px", background: "#EFF6FF", borderBottom: "0.5px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>
                  {availableAttributes.find((a) => a.id === selectedAttributeId)?.name}
                </span>
                <button
                  onClick={() => { setShowValueDropdown(false); setSelectedAttributeId(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#64748B", display: "flex" }}
                >
                  <X size={13} />
                </button>
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {renderValueDropdown()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div
        style={{
          border: "0.5px solid #BFDBFE",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(37,99,235,0.06)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th minW={160}>Attribute</Th>
                <Th minW={140}>Value</Th>
                <Th minW={190}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    SKU <span style={{ color: "#DC2626" }}>*</span>
                    <FieldHint text={SKU_HINT} />
                  </div>
                </Th>

                <Th minW={200}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    Barcode
                    <FieldHint text={BARCODE_HINT} />
                  </div>
                </Th>

                <Th minW={110}>Availability</Th>
                <Th minW={120}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {displayVariants.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{ padding: "40px 0", textAlign: "center", borderBottom: "0.5px solid #E2E8F0" }}
                  >
                    <Package size={28} color="#BFDBFE" style={{ margin: "0 auto 10px" }} />
                    <p style={{ fontSize: 13, color: "#64748B", marginBottom: 4 }}>No variants created yet</p>
                    <p style={{ fontSize: 11.5, color: "#94A3B8" }}>
                      Use "Select variant" above to add product variants
                    </p>
                  </td>
                </tr>
              ) : (
                (() => {
                  const groupedVariants: Record<string, ProductVariantInput[]> = {};
                  displayVariants.forEach((variant) => {
                    const firstAttr = variant.attributes?.[0];
                    const groupKey = firstAttr
                      ? `${firstAttr.attributeValueId}-${firstAttr.value}`
                      : "no-attr";
                    if (!groupedVariants[groupKey]) groupedVariants[groupKey] = [];
                    groupedVariants[groupKey].push(variant);
                  });

                  const rows: JSX.Element[] = [];
                  Object.entries(groupedVariants).forEach(([, groupVariants]) => {
                    groupVariants.forEach((variant, variantIndex) => {
                      const isFirstInGroup = variantIndex === 0;
                      const firstAttr = variant.attributes?.[0];
                      const activeTab = imageSourceTab[variant.id!] || "upload";

                      rows.push(
                        <React.Fragment key={`${variant.id}-${variantIndex}`}>
                          <tr
                            style={{ background: variantIndex % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}
                          >
                            {/* Attribute name cell (spans group) */}
                            {isFirstInGroup && (
                              <td
                                rowSpan={groupVariants.length}
                                style={{
                                  padding: "10px 12px",
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  color: "#1D4ED8",
                                  background: "#EFF6FF",
                                  borderBottom: "0.5px solid #BFDBFE",
                                  borderRight: "0.5px solid #BFDBFE",
                                  verticalAlign: "middle",
                                  textAlign: "center",
                                }}
                              >
                                {firstAttr
                                  ? (() => {
                                      const attr = categoryAttributes?.find((a) =>
                                        a.values?.some((v) => v.id === firstAttr.attributeValueId)
                                      );
                                      return attr?.name || "Attribute";
                                    })()
                                  : "No attribute"}
                              </td>
                            )}

                            {/* Attribute value cell (spans group) */}
                            {isFirstInGroup && (
                              <td
                                rowSpan={groupVariants.length}
                                style={{
                                  padding: "10px 12px",
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  color: "#0369A1",
                                  background: "#F0F9FF",
                                  borderBottom: "0.5px solid #BFDBFE",
                                  borderRight: "0.5px solid #E2E8F0",
                                  verticalAlign: "middle",
                                  textAlign: "center",
                                }}
                              >
                                {firstAttr?.value || "—"}
                              </td>
                            )}

                            {/* SKU */}
                            <Td>
                              <div style={{ display: "flex", gap: 5 }}>
                                <div style={{ position: "relative", flex: 1 }}>
                                  <Input
                                    value={variant.sku}
                                    onChange={(e) => handleSkuChange(variant.id, e.target.value)}
                                    placeholder="Enter SKU"
                                    required
                                    style={{
                                      fontSize: 13,
                                      textTransform: "uppercase",
                                      borderColor: variant.sku ? "#6EE7B7" : "#BFDBFE",
                                      background: variant.sku ? "#F0FDF4" : "#FFFFFF",
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  title="Generate a unique SKU so it won't clash with existing SKUs"
                                  onClick={() =>
                                    handleChange(variant.id, "sku", generateUniqueSKU(variant))
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 30,
                                    height: 30,
                                    flexShrink: 0,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#1D4ED8",
                                    background: "#DBEAFE",
                                    border: "0.5px solid #93C5FD",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  <RefreshCw size={12} />
                                </button>
                              </div>
                            </Td>

                            {/* Barcode */}
                            <Td>
                              <div style={{ display: "flex", gap: 5 }}>
                                <div style={{ position: "relative", flex: 1 }}>
                                  <Input
                                    value={variant.barcode ?? ""}
                                    onChange={(e) => handleChange(variant.id, "barcode", e.target.value)}
                                    placeholder="Auto on save"
                                    style={{
                                      fontSize: 13,
                                      borderColor: variant.barcode ? "#6EE7B7" : "#BFDBFE",
                                      background: variant.barcode ? "#F0FDF4" : "#FFFFFF",
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  title="Generate a scannable barcode now (or leave empty — one is auto-created on save)"
                                  onClick={() =>
                                    handleChange(variant.id, "barcode", generateUniqueBarcode())
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 30,
                                    height: 30,
                                    flexShrink: 0,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#1D4ED8",
                                    background: "#DBEAFE",
                                    border: "0.5px solid #93C5FD",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  <RefreshCw size={12} />
                                </button>
                              </div>
                            </Td>

                            {/* Availability toggle */}
                            <Td center>
                              <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={variant.availability !== false}
                                  onChange={(e) => handleChange(variant.id, "availability", e.target.checked)}
                                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                                />
                                <div
                                  style={{
                                    width: 40,
                                    height: 22,
                                    borderRadius: 11,
                                    background: variant.availability !== false ? "#1D4ED8" : "#CBD5E1",
                                    position: "relative",
                                    transition: "background 0.2s",
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 2,
                                      left: variant.availability !== false ? 20 : 2,
                                      width: 18,
                                      height: 18,
                                      borderRadius: "50%",
                                      background: "#FFFFFF",
                                      transition: "left 0.2s",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                    }}
                                  />
                                </div>
                              </label>
                            </Td>

                            {/* Actions */}
                            <Td center>
                              <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                                <button
                                  onClick={() => toggleImageUploader(variant.id)}
                                  title="Add images"
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 7,
                                    border: "0.5px solid #BFDBFE",
                                    background: showImageUploaders[variant.id!] ? "#EFF6FF" : "#F8FAFC",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#1D4ED8",
                                    transition: "all 0.12s",
                                  }}
                                >
                                  <ImageIcon size={13} />
                                </button>
                                <button
                                  onClick={() => duplicateVariant(variant.id!)}
                                  title="Duplicate"
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 7,
                                    border: "0.5px solid #BFDBFE",
                                    background: "#F8FAFC",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#0891B2",
                                    transition: "all 0.12s",
                                  }}
                                >
                                  <Copy size={13} />
                                </button>
                                <button
                                  onClick={() => removeVariant(variant.id)}
                                  title="Delete"
                                  disabled={variants.length <= 1}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 7,
                                    border: "0.5px solid #FCA5A5",
                                    background: "#FEF2F2",
                                    cursor: variants.length <= 1 ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: variants.length <= 1 ? "#CBD5E1" : "#DC2626",
                                    transition: "all 0.12s",
                                    opacity: variants.length <= 1 ? 0.4 : 1,
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </Td>
                          </tr>

                          {/* Image uploader row — vendor picks Upload vs Media Center */}
                          {showImageUploaders[variant.id!] && (
                            <tr>
                              <td
                                colSpan={8}
                                style={{
                                  padding: "14px 16px",
                                  background: "#EFF6FF",
                                  borderBottom: "0.5px solid #BFDBFE",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1D4ED8" }}>
                                      Variant images
                                      {variant.images && variant.images.length > 0 && (
                                        <span style={{ fontSize: 10.5, color: "#64748B", marginLeft: 6 }}>
                                          ({variant.images.length}/8)
                                        </span>
                                      )}
                                    </span>
                                    <SourceToggle
                                      active={activeTab}
                                      onChange={(tab) =>
                                        setImageSourceTab((prev) => ({ ...prev, [variant.id!]: tab }))
                                      }
                                    />
                                  </div>
                                  <button
                                    onClick={() => toggleImageUploader(variant.id)}
                                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: "#64748B", fontFamily: "inherit" }}
                                  >
                                    Close
                                  </button>
                                </div>

                                {activeTab === "upload" ? (
                                  <ImageUploader
                                    images={(variant.images || []).map((img) => (typeof img === "string" ? img : img.url))}
                                    setImages={(images) => handleImagesChange(variant.id, images)}
                                    maxImages={8}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 10,
                                      padding: "26px 16px",
                                      border: "1.5px dashed #93C5FD",
                                      borderRadius: 10,
                                      background: "#FFFFFF",
                                      textAlign: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: "#EFF6FF",
                                        border: "0.5px solid #BFDBFE",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <FolderOpen size={18} color="#1D4ED8" />
                                    </div>
                                    <p style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A", margin: 0 }}>
                                      Reuse images already in your Media Center
                                    </p>
                                    <p style={{ fontSize: 11, color: "#64748B", margin: 0, maxWidth: 320 }}>
                                      Pick from previously uploaded files or existing product images — no need to upload again.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setMediaCenterVariantId(variant.id!)}
                                      style={{
                                        marginTop: 4,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "7px 16px",
                                        borderRadius: 8,
                                        border: "none",
                                        background: "linear-gradient(135deg,#1D4ED8,#0891B2)",
                                        color: "#FFFFFF",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                      }}
                                    >
                                      <FolderOpen size={13} />
                                      Open Media Center
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}

                          {/* Image preview row */}
                          {variant.images && variant.images.length > 0 && !showImageUploaders[variant.id!] && (
                            <tr>
                              <td
                                colSpan={8}
                                style={{
                                  padding: "8px 12px",
                                  background: "#F8FAFC",
                                  borderBottom: "0.5px solid #E2E8F0",
                                }}
                              >
                                <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                                  {variant.images.slice(0, 6).map((img, imgIdx) => (
                                    <div
                                      key={imgIdx}
                                      style={{
                                        flexShrink: 0,
                                        width: 44,
                                        height: 44,
                                        borderRadius: 7,
                                        overflow: "hidden",
                                        border: "0.5px solid #BFDBFE",
                                      }}
                                    >
                                      <img
                                        src={typeof img === "string" ? img : img.url}
                                        alt={typeof img === "string" ? `Image ${imgIdx + 1}` : (img.altText || "")}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                    </div>
                                  ))}
                                  {variant.images.length > 6 && (
                                    <div
                                      style={{
                                        flexShrink: 0,
                                        width: 44,
                                        height: 44,
                                        borderRadius: 7,
                                        background: "#EFF6FF",
                                        border: "0.5px solid #BFDBFE",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#1D4ED8",
                                      }}
                                    >
                                      +{variant.images.length - 6}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    });
                  });

                  return rows;
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Media Center dialog — opened per-variant via "Open Media Center" */}
      {mediaCenterVariantId && (
        <MediaCenter
          open={!!mediaCenterVariantId}
          onOpenChange={(open: boolean) => {
            if (!open) setMediaCenterVariantId(null);
          }}
          fileType="IMAGE"
          multiple
          maxSelect={Math.max(
            1,
            8 - ((variants.find((v) => v.id === mediaCenterVariantId)?.images || []).length)
          )}
          title="Choose variant images"
          description="Select one or more images from your uploaded files or existing product images."
          onSelect={(items: MediaCenterItem[]) => handleMediaCenterSelect(mediaCenterVariantId, items)}
        />
      )}

      <style>{`
        @media (max-width: 640px) {
          table { font-size: 12px; }
          th, td { padding: 6px 8px !important; }
        }
      `}</style>
    </div>
  );
}