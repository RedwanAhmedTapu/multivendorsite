"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Languages,
  FileText,
  ImageIcon,
  Images,
  ShieldCheck,
  SlidersHorizontal,
  Percent,
  Tag,
  Hash,
  Boxes,
  Check,
  X,
  RotateCcw,
  Save,
  Loader2,
  Store,
  LayoutGrid,
  Sparkles,
  AlertCircle,
  Search,
  Users,
  Layers,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  Copy,
  ChevronDown,
  Settings2,
  ArrowRight,
  LayoutList,
  CircleDot,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import {
  useGetVendorsQuery,
  type Vendor,
} from "@/features/vendorManageApi";
import {
  useGetVendorProductFieldRulesQuery,
  useBulkUpsertProductFieldRulesMutation,
  useDeleteScopeMutation,
  useListPermissionScopesQuery,
  type ProductField,
  type VendorProductFieldRule,
  type PermissionScope,
} from "@/features/productrequiredfieldsettingsAdmin";

// ─────────────────────────────────────────────────────────────────────────────
// Field catalog
// ─────────────────────────────────────────────────────────────────────────────

interface FieldMeta {
  field: ProductField;
  label: string;
  description: string;
  icon: React.ReactNode;
  group: "basic" | "media" | "pricing" | "inventory";
}

const FIELD_META: FieldMeta[] = [
  { field: "NAME_BN", label: "Bengali Name", description: "বাংলা product title shown alongside English name", icon: <Languages size={15} />, group: "basic" },
  { field: "DESCRIPTION", label: "Description", description: "Rich-text product description for detail page", icon: <FileText size={15} />, group: "basic" },
  { field: "ATTRIBUTES", label: "Attributes", description: "Category-specific specifications & features", icon: <SlidersHorizontal size={15} />, group: "basic" },
  { field: "IMAGES", label: "Product Images", description: "Main gallery images for the product listing", icon: <ImageIcon size={15} />, group: "media" },
  { field: "VARIANT_IMAGES", label: "Variant Images", description: "Separate images per variant (e.g. per colour)", icon: <Images size={15} />, group: "media" },
  { field: "WARRANTY", label: "Warranty", description: "Warranty duration, type and policy text", icon: <ShieldCheck size={15} />, group: "basic" },
  { field: "SPECIAL_PRICE", label: "Special Price", description: "Discounted price shown during promotions", icon: <Percent size={15} />, group: "pricing" },
  { field: "DISCOUNT", label: "Discount", description: "Percentage discount applied to variants", icon: <Tag size={15} />, group: "pricing" },
  { field: "SKU", label: "SKU", description: "Stock keeping unit identifier per variant", icon: <Hash size={15} />, group: "inventory" },
  { field: "STOCK", label: "Stock Quantity", description: "Available inventory count per variant", icon: <Boxes size={15} />, group: "inventory" },
];

const FIELD_GROUPS = [
  { key: "basic", label: "Basic Info", color: "#1D4ED8" },
  { key: "media", label: "Media", color: "#7C3AED" },
  { key: "pricing", label: "Pricing", color: "#0891B2" },
  { key: "inventory", label: "Inventory", color: "#059669" },
] as const;

type FieldState = Record<ProductField, { isEnabled: boolean; isRequired: boolean }>;

const defaultFieldState = (): FieldState =>
  FIELD_META.reduce((acc, f) => {
    acc[f.field] = { isEnabled: true, isRequired: false };
    return acc;
  }, {} as FieldState);

const ALL_SCOPE = "__VENDOR_WIDE__";

// ─────────────────────────────────────────────────────────────────────────────
// View modes
// ─────────────────────────────────────────────────────────────────────────────
type ViewMode = "assignments" | "configure";

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid #E5EAF2",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  color: "#3D5068",
  marginBottom: 10,
};

const hintStyle: React.CSSProperties = {
  fontSize: 10.5,
  color: "#9BAABB",
  marginTop: 8,
  lineHeight: 1.55,
};

// ─────────────────────────────────────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  tone = "blue",
  size = "md",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  tone?: "blue" | "red";
  size?: "sm" | "md";
}) {
  const w = size === "sm" ? 32 : 38;
  const h = size === "sm" ? 18 : 22;
  const dot = size === "sm" ? 14 : 18;
  const onColor = tone === "red" ? "#DC2626" : "#1D4ED8";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: w,
        height: h,
        borderRadius: 999,
        border: "none",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#E5EAF2" : checked ? onColor : "#D8E0EC",
        transition: "background 0.2s ease",
        flexShrink: 0,
        padding: 0,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: size === "sm" ? 2 : 2,
          left: checked ? w - dot - 2 : 2,
          width: dot,
          height: dot,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          transition: "left 0.2s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chip
// ─────────────────────────────────────────────────────────────────────────────

function Chip({
  label,
  onRemove,
  tone = "blue",
  size = "md",
}: {
  label: string;
  onRemove: () => void;
  tone?: "blue" | "teal" | "gray";
  size?: "sm" | "md";
}) {
  const colors =
    tone === "teal"
      ? { bg: "#ECFEFF", border: "#A5F3FC", text: "#0E7490" }
      : tone === "gray"
      ? { bg: "#F1F5F9", border: "#E2E8F0", text: "#475569" }
      : { bg: "#EEF3FB", border: "#BFD4F5", text: "#1D4ED8" };
  const fontSize = size === "sm" ? 10.5 : 11.5;
  const pad = size === "sm" ? "3px 5px 3px 8px" : "4px 6px 4px 10px";
  const btnSize = size === "sm" ? 13 : 15;
  const iconSize = size === "sm" ? 8 : 9;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: pad,
        borderRadius: 999,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize,
        fontWeight: 600,
        animation: "fadeSlideIn 0.15s ease",
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: "50%",
          border: "none",
          background: "rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          color: "inherit",
        }}
      >
        <X size={iconSize} />
      </button>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vendor multi-select
// ─────────────────────────────────────────────────────────────────────────────

function VendorMultiSelect({
  selected,
  onChange,
  excludeIds,
}: {
  selected: Vendor[];
  onChange: (vendors: Vendor[]) => void;
  excludeIds?: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data, isFetching } = useGetVendorsQuery({
    search: debounced || undefined,
    limit: 30,
    page: 1,
  });

  const vendors = (data?.data ?? []).filter((v: Vendor) => !excludeIds?.has(v.id));
  const selectedIds = new Set(selected.map((v) => v.id));

  const toggleVendor = (v: Vendor) => {
    if (selectedIds.has(v.id)) {
      onChange(selected.filter((s) => s.id !== v.id));
    } else {
      onChange([...selected, v]);
    }
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        style={{
          minHeight: 42,
          border: `1.5px solid ${open ? "#BFD4F5" : "#E5EAF2"}`,
          borderRadius: 10,
          padding: "7px 10px",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          cursor: "text",
          background: "#FAFBFD",
          boxShadow: open ? "0 0 0 3px rgba(29,78,216,0.07)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <Users size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
        {selected.map((v) => (
          <Chip key={v.id} label={v.storeName} onRemove={() => toggleVendor(v)} />
        ))}
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? "Search vendors by store name…" : "Add another…"}
          style={{
            flex: 1,
            minWidth: 120,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12.5,
            fontFamily: "inherit",
            color: "#0D1B2E",
          }}
        />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: 260,
            overflowY: "auto",
            background: "#fff",
            border: "1.5px solid #E5EAF2",
            borderRadius: 10,
            boxShadow: "0 10px 30px rgba(13,27,46,0.14)",
            zIndex: 30,
            padding: 6,
            animation: "fadeSlideIn 0.15s ease",
          }}
        >
          {isFetching && (
            <div style={{ padding: 10, fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 6 }}>
              <Loader2 size={12} className="animate-spin" />
              Searching…
            </div>
          )}
          {!isFetching && vendors.length === 0 && (
            <div style={{ padding: 10, fontSize: 12, color: "#94A3B8" }}>No vendors found</div>
          )}
          {!isFetching &&
            vendors.map((v: Vendor) => {
              const active = selectedIds.has(v.id);
              return (
                <div
                  key={v.id}
                  onClick={() => toggleVendor(v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: active ? "#EEF3FB" : "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F8FAFC"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 5,
                      border: `1.5px solid ${active ? "#1D4ED8" : "#CBD5E1"}`,
                      background: active ? "#1D4ED8" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {active && <Check size={11} color="#fff" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0D1B2E" }}>{v.storeName}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{v.status}{v.user?.email ? ` · ${v.user.email}` : ""}</div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category scope select
// ─────────────────────────────────────────────────────────────────────────────

function CategoryScopeSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: categories, isLoading } = useGetCategoriesQuery();

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          onClick={() => toggle(ALL_SCOPE)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: 999,
            border: `1.5px solid ${selected.includes(ALL_SCOPE) ? "#1D4ED8" : "#E5EAF2"}`,
            background: selected.includes(ALL_SCOPE) ? "#EEF3FB" : "#fff",
            color: selected.includes(ALL_SCOPE) ? "#1D4ED8" : "#64748B",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          <Store size={12} />
          Vendor-wide default
          {selected.includes(ALL_SCOPE) && <Check size={12} />}
        </button>

        {isLoading && (
          <span style={{ fontSize: 11.5, color: "#94A3B8", display: "flex", alignItems: "center", gap: 5 }}>
            <Loader2 size={11} className="animate-spin" />
            Loading categories…
          </span>
        )}

        {(categories ?? []).map((c: any) => {
          const active = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: 999,
                border: `1.5px solid ${active ? "#0891B2" : "#E5EAF2"}`,
                background: active ? "#ECFEFF" : "#fff",
                color: active ? "#0E7490" : "#64748B",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <Layers size={12} />
              {c.name}
              {active && <Check size={12} />}
            </button>
          );
        })}
      </div>
      <p style={hintStyle}>
        Only root (top-level) categories can be targeted. A rule set here applies to every product the vendor lists under that root category.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assignments list — shows vendors that already have permissions
// ─────────────────────────────────────────────────────────────────────────────

function AssignmentsList({
  onEdit,
  onDelete,
}: {
  onEdit: (scope: PermissionScope) => void;
  onDelete: (scope: PermissionScope) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isFetching } = useListPermissionScopesQuery({
    search: search || undefined,
    page,
    limit,
  });

  const scopes = data?.scopes ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1B2E" }}>Existing Assignments</div>
          <div style={{ fontSize: 11, color: "#9BAABB", marginTop: 2 }}>
            {pagination?.total ?? 0} vendor-scope combination(s) configured
          </div>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          position: "relative",
          marginBottom: 12,
        }}
      >
        <Search
          size={14}
          color="#94A3B8"
          style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by vendor or category name…"
          style={{
            width: "100%",
            padding: "9px 12px 9px 34px",
            border: "1.5px solid #E5EAF2",
            borderRadius: 9,
            fontSize: 12.5,
            fontFamily: "inherit",
            background: "#FAFBFD",
            outline: "none",
            color: "#0D1B2E",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#BFD4F5";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.07)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#E5EAF2";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* List */}
      <div
        style={{
          maxHeight: 480,
          overflowY: "auto",
          borderRadius: 10,
          border: "1.5px solid #F0F4FA",
        }}
      >
        {isFetching && (
          <div style={{ padding: 30, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
            <Loader2 size={16} className="animate-spin" style={{ display: "inline-block", marginBottom: 6 }} />
            <div>Loading assignments…</div>
          </div>
        )}

        {!isFetching && scopes.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <LayoutList size={28} color="#CBD5E1" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B", marginBottom: 4 }}>No assignments yet</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>
              {search ? "No results match your search" : "Configure permissions for a vendor below to see them here"}
            </div>
          </div>
        )}

        {!isFetching &&
          scopes.map((scope, idx) => (
            <div
              key={`${scope.vendorId}-${scope.categoryId}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderBottom: idx < scopes.length - 1 ? "1px solid #F0F4FA" : "none",
                background: "#fff",
                transition: "background 0.1s",
                cursor: "default",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFD")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              {/* Vendor icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#EEF3FB,#F0F4FA)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Store size={15} color="#1D4ED8" />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {scope.vendorName}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: scope.categoryId ? "#ECFEFF" : "#EEF3FB",
                      color: scope.categoryId ? "#0E7490" : "#1D4ED8",
                      border: `1px solid ${scope.categoryId ? "#A5F3FC" : "#BFD4F5"}`,
                    }}
                  >
                    {scope.categoryName ?? "Vendor-wide"}
                  </span>
                  <span style={{ fontSize: 10, color: "#9BAABB" }}>
                    {scope.enabledCount}/{scope.totalFields} enabled · {scope.requiredCount} required
                  </span>
                </div>
              </div>

              {/* Time */}
              <div style={{ fontSize: 10, color: "#B0BAC6", flexShrink: 0, textAlign: "right", minWidth: 70 }}>
                {new Date(scope.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => onEdit(scope)}
                  title="Edit this assignment"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: "1px solid #E5EAF2",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748B",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#EEF3FB";
                    e.currentTarget.style.borderColor = "#BFD4F5";
                    e.currentTarget.style.color = "#1D4ED8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "#E5EAF2";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => {
                    onDelete(scope);
                  }}
                  title="Remove this assignment"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: "1px solid #E5EAF2",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748B",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FEF2F2";
                    e.currentTarget.style.borderColor = "#FECACA";
                    e.currentTarget.style.color = "#DC2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "#E5EAF2";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: "5px 10px",
              borderRadius: 7,
              border: "1px solid #E5EAF2",
              background: page <= 1 ? "#F8FAFC" : "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: page <= 1 ? "not-allowed" : "pointer",
              color: page <= 1 ? "#CBD5E1" : "#475569",
              fontFamily: "inherit",
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600, padding: "0 8px" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: "5px 10px",
              borderRadius: 7,
              border: "1px solid #E5EAF2",
              background: page >= totalPages ? "#F8FAFC" : "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              color: page >= totalPages ? "#CBD5E1" : "#475569",
              fontFamily: "inherit",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field card
// ─────────────────────────────────────────────────────────────────────────────

function FieldCard({
  meta,
  state,
  baseline,
  onChange,
  index,
}: {
  meta: FieldMeta;
  state: { isEnabled: boolean; isRequired: boolean };
  baseline: { isEnabled: boolean; isRequired: boolean };
  onChange: (patch: Partial<{ isEnabled: boolean; isRequired: boolean }>) => void;
  index: number;
}) {
  const changed = JSON.stringify(state) !== JSON.stringify(baseline);
  const groupInfo = FIELD_GROUPS.find((g) => g.key === meta.group);

  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${changed ? "#BFD4F5" : "#E5EAF2"}`,
        borderRadius: 14,
        padding: 14,
        boxShadow: changed ? "0 0 0 3px rgba(29,78,216,0.07)" : "0 1px 3px rgba(0,0,0,0.03)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        animation: `fadeSlideIn 0.35s ease ${index * 0.03}s both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: state.isEnabled ? `${groupInfo?.color}10` : "#F5F6F8",
            color: state.isEnabled ? groupInfo?.color : "#B0BAC6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: state.isEnabled ? "#0D1B2E" : "#94A3B8" }}>
              {meta.label}
            </span>
            {groupInfo && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: `${groupInfo.color}10`,
                  color: groupInfo.color,
                  letterSpacing: "0.03em",
                }}
              >
                {groupInfo.label.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 1, lineHeight: 1.4 }}>
            {meta.description}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px dashed #F0F4FA",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Toggle checked={state.isEnabled} onChange={(v) => onChange({ isEnabled: v })} size="sm" />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>Enabled</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Toggle
            checked={state.isRequired}
            onChange={(v) => onChange({ isRequired: v })}
            disabled={!state.isEnabled}
            tone="red"
            size="sm"
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: state.isEnabled ? "#64748B" : "#C3CCD8" }}>
            Required
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminProductFieldPermissions() {
  const [viewMode, setViewMode] = useState<ViewMode>("assignments");
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([]);
  const [scopeTargets, setScopeTargets] = useState<string[]>([]);
  const { data: categories } = useGetCategoriesQuery();

  const [fieldState, setFieldState] = useState<FieldState>(defaultFieldState());
  const [baseline, setBaseline] = useState<FieldState>(defaultFieldState());

  const [savingProgress, setSavingProgress] = useState<{ done: number; total: number } | null>(null);

  const isBulkMode = selectedVendors.length > 1 || scopeTargets.length > 1;
  const isSingleEditable = selectedVendors.length === 1 && scopeTargets.length === 1;

  const singleVendorId = isSingleEditable ? selectedVendors[0].id : undefined;
  const singleCategoryId = isSingleEditable
    ? scopeTargets[0] === ALL_SCOPE
      ? "null"
      : scopeTargets[0]
    : undefined;

  const {
    data: existingRules,
    isFetching: rulesFetching,
  } = useGetVendorProductFieldRulesQuery(
    { vendorId: singleVendorId as string, categoryId: singleCategoryId },
    { skip: !isSingleEditable }
  );

  const [bulkUpsert, { isLoading: saving }] = useBulkUpsertProductFieldRulesMutation();
  const [deleteScope, { isLoading: deleting }] = useDeleteScopeMutation();

  // Prefill when editing exactly one vendor + one scope
  useEffect(() => {
    if (isSingleEditable) {
      const next = defaultFieldState();
      (existingRules ?? []).forEach((r: VendorProductFieldRule) => {
        next[r.field] = { isEnabled: r.isEnabled, isRequired: r.isRequired };
      });
      setFieldState(next);
      setBaseline(next);
    } else {
      setFieldState(defaultFieldState());
      setBaseline(defaultFieldState());
    }
  }, [isSingleEditable, existingRules, singleVendorId, singleCategoryId]);

  const isDirty = useMemo(
    () => JSON.stringify(fieldState) !== JSON.stringify(baseline),
    [fieldState, baseline]
  );

  const enabledCount = Object.values(fieldState).filter((f) => f.isEnabled).length;
  const requiredCount = Object.values(fieldState).filter((f) => f.isRequired).length;

  const rootCategoryLabel = useCallback(
    (id: string) => (categories ?? []).find((c: any) => c.id === id)?.name ?? id,
    [categories]
  );

  const scopeLabels = scopeTargets.map((t) => (t === ALL_SCOPE ? "Vendor-wide" : rootCategoryLabel(t)));
  const combosCount = selectedVendors.length * scopeTargets.length;
  const readyToConfigure = selectedVendors.length > 0 && scopeTargets.length > 0;

  const updateField = (field: ProductField, patch: Partial<{ isEnabled: boolean; isRequired: boolean }>) => {
    setFieldState((prev) => {
      const current = prev[field];
      const nextEnabled = patch.isEnabled ?? current.isEnabled;
      return {
        ...prev,
        [field]: {
          isEnabled: nextEnabled,
          isRequired: nextEnabled ? patch.isRequired ?? current.isRequired : false,
        },
      };
    });
  };

  const handleReset = () => {
    setFieldState(baseline);
    toast.info("Changes discarded");
  };

  const handleResetToDefaults = () => {
    setFieldState(defaultFieldState());
    toast.info("Reset to system defaults");
  };

  // ── Edit from assignments list ──
  const handleEditScope = useCallback(
    (scope: PermissionScope) => {
      const fakeVendor: Vendor = {
        id: scope.vendorId,
        storeName: scope.vendorName,
        status: "ACTIVE",
      } as Vendor;
      setSelectedVendors([fakeVendor]);
      setScopeTargets([scope.categoryId ?? ALL_SCOPE]);
      setViewMode("configure");
    },
    []
  );

  // ── Delete from assignments list ──
  const handleDeleteScope = useCallback(
    (scope: PermissionScope) => {
      const label = `${scope.vendorName} → ${scope.categoryName ?? "Vendor-wide"}`;
      toast("Removing assignment…", {
        description: label,
        action: {
          label: "Confirm",
          onClick: async () => {
            try {
              await deleteScope({
                vendorId: scope.vendorId,
                categoryId: scope.categoryId,
              }).unwrap();
              toast.success("Assignment removed", { description: label });
            } catch (err: any) {
              toast.error("Failed to remove", {
                description: err?.data?.message || "Something went wrong",
              });
            }
          },
        },
        duration: 8000,
      });
    },
    [deleteScope]
  );

  // ── Save ──
  const handleSave = async () => {
    if (!readyToConfigure) return;
    const rulesPayload = FIELD_META.map((f) => ({
      field: f.field,
      isEnabled: fieldState[f.field].isEnabled,
      isRequired: fieldState[f.field].isRequired,
    }));

    const combos: { vendorId: string; categoryId: string | null }[] = [];
    selectedVendors.forEach((v) => {
      scopeTargets.forEach((t) => {
        combos.push({ vendorId: v.id, categoryId: t === ALL_SCOPE ? null : t });
      });
    });

    setSavingProgress({ done: 0, total: combos.length });
    try {
      let done = 0;
      for (const combo of combos) {
        await bulkUpsert({
          vendorId: combo.vendorId,
          body: { categoryId: combo.categoryId, rules: rulesPayload },
        }).unwrap();
        done += 1;
        setSavingProgress({ done, total: combos.length });
      }
      setBaseline(fieldState);
      toast.success(
        combos.length === 1
          ? "Permissions saved"
          : `Saved ${combos.length} rule set(s) across ${selectedVendors.length} vendor(s)`,
        {
          description:
            combos.length === 1
              ? `${selectedVendors[0].storeName} → ${scopeLabels[0]}`
              : `${selectedVendors.length} vendor(s) × ${scopeTargets.length} scope(s)`,
          duration: 4000,
        }
      );
    } catch (err: any) {
      toast.error("Could not save permissions", {
        description: err?.data?.message || "Something went wrong",
      });
    } finally {
      setSavingProgress(null);
    }
  };

  // ── Switch to configure from assignments ──
  const handleNewAssignment = () => {
    setSelectedVendors([]);
    setScopeTargets([]);
    setFieldState(defaultFieldState());
    setBaseline(defaultFieldState());
    setViewMode("configure");
  };

  // ── Back to assignments ──
  const handleBackToAssignments = () => {
    if (isDirty) {
      toast("You have unsaved changes", {
        description: "Going back will discard them.",
        action: {
          label: "Discard & go back",
          onClick: () => {
            setViewMode("assignments");
            setSelectedVendors([]);
            setScopeTargets([]);
          },
        },
        duration: 8000,
      });
    } else {
      setViewMode("assignments");
      setSelectedVendors([]);
      setScopeTargets([]);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
        paddingBottom: 40,
      }}
    >
      {/* ── Page header ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg,#1D4ED8,#0891B2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(29,78,216,0.25)",
              }}
            >
              <Settings2 size={19} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.3px" }}>
                Product Field Permissions
              </div>
              <div style={{ fontSize: 12, color: "#7A90AB", marginTop: 1 }}>
                Control which product fields are visible and required for each vendor
              </div>
            </div>
          </div>

          {viewMode === "assignments" && (
            <button
              onClick={handleNewAssignment}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 18px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#1D4ED8,#0891B2)",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(29,78,216,0.2)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(29,78,216,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(29,78,216,0.2)";
              }}
            >
              <Sparkles size={14} />
              New Assignment
            </button>
          )}

          {viewMode === "configure" && (
            <button
              onClick={handleBackToAssignments}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 9,
                border: "1.5px solid #E5EAF2",
                background: "#fff",
                color: "#64748B",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F8FAFC";
                e.currentTarget.style.borderColor = "#CBD5E1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#E5EAF2";
              }}
            >
              <ChevronRight size={13} style={{ transform: "rotate(180deg)" }} />
              All Assignments
            </button>
          )}
        </div>
      </div>

      {/* ═══ ASSIGNMENTS VIEW ═══ */}
      {viewMode === "assignments" && (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                ...cardStyle,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#EEF3FB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Store size={16} color="#1D4ED8" />
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: "#9BAABB", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Vendors Configured
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0D1B2E", marginTop: 1 }}>
                  —
                </div>
              </div>
            </div>
            <div
              style={{
                ...cardStyle,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#ECFEFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircleDot size={16} color="#0891B2" />
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: "#9BAABB", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Total Scopes
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0D1B2E", marginTop: 1 }}>
                  —
                </div>
              </div>
            </div>
            <div
              style={{
                ...cardStyle,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#F0FDF4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Filter size={16} color="#059669" />
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: "#9BAABB", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Total Field Rules
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0D1B2E", marginTop: 1 }}>
                  —
                </div>
              </div>
            </div>
          </div>

          <AssignmentsList onEdit={handleEditScope} onDelete={handleDeleteScope} />
        </div>
      )}

      {/* ═══ CONFIGURE VIEW ═══ */}
      {viewMode === "configure" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 15rem",
            gap: 16,
            maxWidth: 1200,
            margin: "0 auto",
            alignItems: "start",
          }}
        >
          {/* ════ LEFT ════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Vendors */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={sectionLabel}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={13} color="#1D4ED8" /> Vendors
                  </span>
                </div>
                {selectedVendors.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedVendors([]);
                      toast.info("Vendors cleared");
                    }}
                    style={{
                      fontSize: 10.5,
                      color: "#94A3B8",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                    }}
                  >
                    Clear ({selectedVendors.length})
                  </button>
                )}
              </div>
              <VendorMultiSelect selected={selectedVendors} onChange={setSelectedVendors} />
              <p style={hintStyle}>
                Select vendors to apply permissions. Pick one to edit existing settings, or several for bulk apply.
              </p>
            </div>

            {/* Category scope */}
            <div style={cardStyle}>
              <div style={sectionLabel}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Layers size={13} color="#0891B2" /> Apply to
                </span>
              </div>
              <CategoryScopeSelect selected={scopeTargets} onChange={setScopeTargets} />
            </div>

            {/* Field grid */}
            {!readyToConfigure ? (
              <div
                style={{
                  background: "#fff",
                  border: "1.5px dashed #E5EAF2",
                  borderRadius: 14,
                  padding: "50px 20px",
                  textAlign: "center",
                  color: "#94A3B8",
                }}
              >
                <LayoutGrid size={26} style={{ marginBottom: 10, opacity: 0.4 }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Select vendors & scopes</div>
                <div style={{ fontSize: 11.5, maxWidth: 320, margin: "0 auto", lineHeight: 1.6 }}>
                  Choose at least one vendor and one scope above to start configuring which product fields they can use.
                </div>
              </div>
            ) : (
              <>
                {isBulkMode && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                      fontSize: 11.5,
                      color: "#1D4ED8",
                      fontWeight: 600,
                      animation: "fadeSlideIn 0.2s ease",
                    }}
                  >
                    <Sparkles size={13} />
                    Bulk mode — settings will be applied to all {combosCount} combination(s).
                  </div>
                )}

                {rulesFetching && isSingleEditable && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      fontSize: 11.5,
                      color: "#64748B",
                      fontWeight: 600,
                    }}
                  >
                    <Loader2 size={13} className="animate-spin" />
                    Loading existing rules…
                  </div>
                )}

                {/* Grouped field grid */}
                {FIELD_GROUPS.map((group) => {
                  const groupFields = FIELD_META.filter((f) => f.group === group.key);
                  return (
                    <div key={group.key}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 10,
                          marginTop: group.key === "basic" ? 0 : 6,
                        }}
                      >
                        <div
                          style={{
                            width: 4,
                            height: 16,
                            borderRadius: 2,
                            background: group.color,
                          }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>{group.label}</span>
                        <span style={{ fontSize: 10, color: "#B0BAC6", fontWeight: 600 }}>
                          {groupFields.filter((f) => fieldState[f.field].isEnabled).length}/{groupFields.length} enabled
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                          opacity: rulesFetching && isSingleEditable ? 0.55 : 1,
                          transition: "opacity 0.15s ease",
                        }}
                      >
                        {groupFields.map((f, idx) => (
                          <FieldCard
                            key={f.field}
                            meta={f}
                            state={fieldState[f.field]}
                            baseline={baseline[f.field]}
                            onChange={(patch) => updateField(f.field, patch)}
                            index={FIELD_META.indexOf(f)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* ════ RIGHT — sticky summary ════ */}
          <div style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#9BAABB",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Sparkles size={12} /> Summary
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "#64748B" }}>Vendors</span>
                  <strong style={{ color: "#0D1B2E" }}>{selectedVendors.length}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "#64748B" }}>Scopes</span>
                  <strong style={{ color: "#0891B2" }}>{scopeTargets.length}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "#64748B" }}>Rule sets</span>
                  <strong style={{ color: "#7C3AED" }}>{combosCount}</strong>
                </div>
                <div style={{ height: 1, background: "#F0F4FA", margin: "2px 0" }} />

                {FIELD_GROUPS.map((group) => {
                  const groupFields = FIELD_META.filter((f) => f.group === group.key);
                  const enabled = groupFields.filter((f) => fieldState[f.field].isEnabled).length;
                  const required = groupFields.filter((f) => fieldState[f.field].isRequired).length;
                  return (
                    <div key={group.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#64748B", display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 3, background: group.color, flexShrink: 0 }} />
                        {group.label}
                      </span>
                      <span style={{ color: "#3D5068", fontWeight: 600 }}>
                        {enabled}/{groupFields.length}
                        {required > 0 && (
                          <span style={{ color: "#DC2626", marginLeft: 4, fontSize: 10 }}>
                            {required} req
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}

                <div style={{ height: 1, background: "#F0F4FA", margin: "2px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "#64748B" }}>Total enabled</span>
                  <strong style={{ color: "#0D1B2E" }}>{enabledCount} / {FIELD_META.length}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "#64748B" }}>Total required</span>
                  <strong style={{ color: "#DC2626" }}>{requiredCount}</strong>
                </div>
              </div>

              {scopeLabels.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                  {scopeLabels.map((l, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#0E7490",
                        background: "#ECFEFF",
                        border: "1px solid #A5F3FC",
                        borderRadius: 999,
                        padding: "2px 8px",
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}

              {isDirty && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    fontSize: 10.5,
                    color: "#92400E",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    animation: "fadeSlideIn 0.2s ease",
                  }}
                >
                  <AlertCircle size={12} style={{ flexShrink: 0 }} />
                  Unsaved changes
                </div>
              )}

              {savingProgress && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    <Loader2 size={11} className="animate-spin" />
                    Saving {savingProgress.done}/{savingProgress.total}…
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: "#F0F4FA", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(savingProgress.done / savingProgress.total) * 100}%`,
                        background: "linear-gradient(90deg,#1D4ED8,#0891B2)",
                        transition: "width 0.2s ease",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                <button
                  onClick={handleSave}
                  disabled={!readyToConfigure || !isDirty || saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "none",
                    background:
                      !readyToConfigure || !isDirty || saving
                        ? "#CBD5E1"
                        : "linear-gradient(135deg,#1D4ED8,#0891B2)",
                    color: "#fff",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: !readyToConfigure || !isDirty || saving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    boxShadow:
                      !readyToConfigure || !isDirty || saving
                        ? "none"
                        : "0 4px 12px rgba(29,78,216,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    if (readyToConfigure && isDirty && !saving) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(29,78,216,0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      !readyToConfigure || !isDirty || saving
                        ? "none"
                        : "0 4px 12px rgba(29,78,216,0.2)";
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      {combosCount > 1 ? `Save to ${combosCount} scopes` : "Save changes"}
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={!isDirty || saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    padding: "8px 0",
                    borderRadius: 9,
                    border: "1.5px solid #E5EAF2",
                    background: "#fff",
                    color: "#64748B",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: !isDirty || saving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: !isDirty || saving ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  <RotateCcw size={12} />
                  Discard changes
                </button>
                <button
                  onClick={handleResetToDefaults}
                  disabled={saving}
                  style={{
                    padding: "6px 0",
                    borderRadius: 9,
                    border: "none",
                    background: "transparent",
                    color: "#94A3B8",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!saving) e.currentTarget.style.color = "#64748B"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
                >
                  Reset all to system defaults
                </button>
              </div>
            </div>

            {/* How it works */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "12px 13px",
                fontSize: 11,
                color: "#475569",
                lineHeight: 1.65,
              }}
            >
              <strong style={{ color: "#1E293B", fontWeight: 700 }}>How it works</strong>
              <br />
              • <strong>Edit:</strong> Pick one vendor + one scope to view and modify its current rules.
              <br />
              • <strong>Bulk:</strong> Pick several vendors and/or scopes to push the same settings to all at once.
              <br />
              • Each vendor×scope combination is saved as its own independent rule set.
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .admin-field-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}