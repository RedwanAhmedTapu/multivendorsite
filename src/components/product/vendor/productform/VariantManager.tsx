"use client";
import React, { useState, useMemo, JSX, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Plus, X, Trash2, Copy, ChevronDown, Check, Package,
  AlertCircle, Image as ImageIcon,
} from "lucide-react";
import ImageUploader from "@/components/imageuploader/ImageUploader";
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

export default function VariantManager({
  variants,
  setVariants,
  variantNameParts,
  onGenerateVariantName,
  categoryAttributes = [],
}: Props) {
  const [showImageUploaders, setShowImageUploaders] = useState<Record<string, boolean>>({});
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

  const handleImagesChange = (id: string | undefined, images: (string | ProductImageInput)[]) => {
    if (!id) return;
    setVariants(variants.map((v) => (v.id === id ? { ...v, images: images.slice(0, 8) } : v)));
  };

  const toggleImageUploader = (id: string | undefined) => {
    if (!id) return;
    setShowImageUploaders((prev) => ({ ...prev, [id]: !prev[id] }));
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

  /* ── shared thin header input (apply-to-all) ── */
  const ApplyInput = ({ onApply, placeholder }: { onApply: (n: number) => void; placeholder: string }) => (
    <Input
      type="number"
      step="0.01"
      min="0"
      placeholder={placeholder}
      style={{ fontSize: 11, height: 28, marginTop: 4, borderColor: "#BFDBFE", background: "#F8FAFC" }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const val = Number((e.target as HTMLInputElement).value);
          if (val >= 0) { onApply(val); (e.target as HTMLInputElement).value = ""; }
        }
      }}
    />
  );

  /* ── Th helper ── */
  const Th = ({ children, minW = 120 }: { children: React.ReactNode; minW?: number }) => (
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

  /* ── Td helper ── */
  const Td = ({ children, center = false, span = 1 }: { children: React.ReactNode; center?: boolean; span?: number }) => (
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
                <Th minW={150}>
                  <div>SKU <span style={{ color: "#DC2626" }}>*</span></div>
                </Th>
                <Th minW={150}>
                  <div>Price <span style={{ color: "#DC2626" }}>*</span></div>
                  <ApplyInput onApply={applyPriceToAll} placeholder="Apply to all…" />
                </Th>
                <Th minW={150}>
                  <div>Special price</div>
                  <ApplyInput onApply={applySpecialPriceToAll} placeholder="Apply to all…" />
                </Th>
                <Th minW={120}>
                  <div>Stock</div>
                  <ApplyInput onApply={applyStockToAll} placeholder="Apply to all…" />
                </Th>
                <Th minW={110}>Availability</Th>
                <Th minW={120}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {displayVariants.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
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
                              <Input
                                value={variant.sku}
                                onChange={(e) => handleChange(variant.id, "sku", e.target.value)}
                                placeholder="Enter SKU"
                                required
                                style={{
                                  fontSize: 13,
                                  borderColor: variant.sku ? "#6EE7B7" : "#BFDBFE",
                                  background: variant.sku ? "#F0FDF4" : "#FFFFFF",
                                }}
                              />
                            </Td>

                            {/* Price */}
                            <Td>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.price || ""}
                                onChange={(e) => handleChange(variant.id, "price", Number(e.target.value))}
                                placeholder="0.00"
                                required
                                style={{
                                  fontSize: 13,
                                  borderColor: variant.price > 0 ? "#6EE7B7" : "#BFDBFE",
                                  background: variant.price > 0 ? "#F0FDF4" : "#FFFFFF",
                                }}
                              />
                            </Td>

                            {/* Special price */}
                            <Td>
                              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={variant.specialPrice || ""}
                                  onChange={(e) => handleSpecialPriceChange(variant.id, e.target.value ? Number(e.target.value) : null)}
                                  placeholder="0.00"
                                  style={{ fontSize: 13, flex: 1, borderColor: "#BFDBFE" }}
                                />
                                {variant.specialPrice && (
                                  <button
                                    onClick={() => handleSpecialPriceChange(variant.id, null)}
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 3, color: "#94A3B8", display: "flex", flexShrink: 0 }}
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                              {variant.specialPrice && variant.specialPrice >= variant.price && (
                                <p style={{ fontSize: 10.5, color: "#DC2626", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
                                  <AlertCircle size={10} /> Must be less than price
                                </p>
                              )}
                              {variant.specialPrice && variant.specialPrice < variant.price && (
                                <p style={{ fontSize: 10.5, color: "#059669", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
                                  <Check size={10} /> Save {variant.discount}%
                                </p>
                              )}
                            </Td>

                            {/* Stock */}
                            <Td>
                              <Input
                                type="number"
                                min="0"
                                value={variant.stock || 0}
                                onChange={(e) => handleChange(variant.id, "stock", Number(e.target.value))}
                                placeholder="0"
                                style={{ fontSize: 13, borderColor: "#BFDBFE" }}
                              />
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

                          {/* Image uploader row */}
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
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1D4ED8" }}>
                                    Variant images
                                    {variant.images && variant.images.length > 0 && (
                                      <span style={{ fontSize: 10.5, color: "#64748B", marginLeft: 6 }}>
                                        ({variant.images.length}/8)
                                      </span>
                                    )}
                                  </span>
                                  <button
                                    onClick={() => toggleImageUploader(variant.id)}
                                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: "#64748B", fontFamily: "inherit" }}
                                  >
                                    Close
                                  </button>
                                </div>
                                <ImageUploader
                                  images={(variant.images || []).map((img) => (typeof img === "string" ? img : img.url))}
                                  setImages={(images) => handleImagesChange(variant.id, images)}
                                  maxImages={8}
                                />
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

      {/* ── Summary bar ── */}
      {displayVariants.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            padding: "8px 14px",
            background: "#EFF6FF",
            border: "0.5px solid #BFDBFE",
            borderRadius: 9,
            fontSize: 11.5,
            color: "#1D4ED8",
            fontWeight: 500,
          }}
        >
          <span>{displayVariants.length} variant{displayVariants.length !== 1 ? "s" : ""} created</span>
          <span style={{ color: "#64748B" }}>
            {displayVariants.filter((v) => v.sku && v.price > 0).length}/{displayVariants.length} fully configured
          </span>
        </div>
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