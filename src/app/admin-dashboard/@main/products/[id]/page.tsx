"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetProductByIdQuery } from "@/features/productapi/adminProductApi";
import React, { useState } from "react";
import {
  ArrowLeft,
  Package,
  Tag,
  DollarSign,
  Box,
  Image as ImageIcon,
  Video,
  Info,
  Calendar,
  Check,
  Clock,
  X,
  Shield,
  Truck,
  Scale,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Tag as TagIcon,
  Layers,
  XCircle,
  Store,
  User,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Design tokens — same palette used across AddProductForm / ProductsTable
   so every admin product surface reads as one system.
   ───────────────────────────────────────────────────────────────────────── */

const T = {
  font: "'Plus Jakarta Sans', system-ui, sans-serif",
  page: "#F0F4FA",
  card: "#fff",
  border: "#E5EAF2",
  headerBg: "#FAFBFD",
  title: "#0D1B2E",
  subtitle: "#7A90AB",
  hint: "#9BAABB",
  label: "#3D5068",
  rowBorder: "#F0F4FA",

  gradient: "linear-gradient(135deg,#1D4ED8,#7C3AED)",

  blue: "#1D4ED8",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",

  green: "#059669",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  greenSoftBg: "#D1FAE5",
  greenSoftBorder: "#6EE7B7",

  amber: "#B45309",
  amberBg: "#FEF3C7",
  amberBorder: "#FCD34D",

  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FCA5A5",

  purple: "#7C3AED",
  purpleBg: "#F5F3FF",
  purpleBorder: "#C4B5FD",

  cyan: "#0891B2",
  cyanBg: "#F0FDFA",
  cyanBorder: "#5EEAD4",

  sky: "#0369A1",
  skyBg: "#F0F9FF",
  skyBorder: "#BAE6FD",

  slate: "#64748B",
  slateBg: "#F1F5F9",
  slateBorder: "#E2E8F0",
};

/* ─── Shared primitives (compact variants of the ProductForm primitives) ── */

function SectionCard({
  icon,
  title,
  subtitle,
  accent = T.blue,
  accentBg = T.blueBg,
  accentBorder = T.blueBorder,
  children,
  headerRight,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
  accentBg?: string;
  accentBorder?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${accentBorder}`,
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          borderBottom: `0.5px solid ${accentBorder}`,
          background: accentBg,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: "#fff",
              border: `0.5px solid ${accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: accent, letterSpacing: "-0.2px" }}>
              {title}
            </div>
            {subtitle && <div style={{ fontSize: 10.5, color: T.subtitle, marginTop: 0 }}>{subtitle}</div>}
          </div>
        </div>
        {headerRight}
      </div>
      <div style={{ padding: "14px" }}>{children}</div>
    </div>
  );
}

function SubSection({
  icon,
  title,
  accent,
  accentBg,
  accentBorder,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: accentBg, border: `0.5px solid ${accentBorder}`, borderRadius: 10, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 12px",
          borderBottom: `0.5px solid ${accentBorder}`,
          background: "#fff",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            background: accentBg,
            border: `0.5px solid ${accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "-0.1px" }}>{title}</span>
      </div>
      <div style={{ padding: "10px 12px" }}>{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  accent = T.title,
  emptyText = "—",
  compact = false,
}: {
  label: string;
  value?: string | null | number | boolean;
  mono?: boolean;
  accent?: string;
  emptyText?: string;
  compact?: boolean;
}) {
  const display =
    value === null || value === undefined
      ? emptyText
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: compact ? "column" : "row",
        alignItems: compact ? "flex-start" : "flex-start",
        gap: compact ? 2 : 8,
        padding: "6px 0",
        borderBottom: `0.5px solid ${T.rowBorder}`,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: T.hint,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          minWidth: compact ? undefined : 96,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: display === emptyText ? "#CBD5E1" : accent,
          fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
          wordBreak: "break-all",
          lineHeight: 1.4,
        }}
      >
        {display}
      </span>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  sub,
  accent,
  accentBg,
  accentBorder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: T.card,
        border: `1px solid ${accentBorder}`,
        borderRadius: 10,
        padding: "9px 12px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: accentBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: T.hint,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: accent,
            lineHeight: 1.2,
            fontVariantNumeric: "tabular-nums",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 10, color: T.hint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status, size = "md" }: { status?: string | null; size?: "sm" | "md" }) {
  const config: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    ACTIVE: { label: "Active", color: T.green, bg: T.greenSoftBg, border: T.greenSoftBorder, icon: <Check size={size === "sm" ? 10 : 11} /> },
    PENDING: { label: "Pending Review", color: T.amber, bg: T.amberBg, border: T.amberBorder, icon: <Clock size={size === "sm" ? 10 : 11} /> },
    REJECTED: { label: "Rejected", color: T.red, bg: T.redBg, border: T.redBorder, icon: <X size={size === "sm" ? 10 : 11} /> },
    DRAFT: { label: "Draft", color: T.slate, bg: T.slateBg, border: T.slateBorder, icon: <Package size={size === "sm" ? 10 : 11} /> },
    INACTIVE: { label: "Inactive", color: "#475569", bg: "#F8FAFC", border: T.slateBorder, icon: <XCircle size={size === "sm" ? 10 : 11} /> },
    VERIFIED: { label: "Verified", color: T.green, bg: T.greenSoftBg, border: T.greenSoftBorder, icon: <Check size={size === "sm" ? 10 : 11} /> },
    UNVERIFIED: { label: "Unverified", color: T.slate, bg: T.slateBg, border: T.slateBorder, icon: <Clock size={size === "sm" ? 10 : 11} /> },
  };
  const s = status || "DRAFT";
  const cfg = config[s] || config.DRAFT;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        border: `0.5px solid ${cfg.border}`,
        padding: size === "sm" ? "3px 9px" : "4px 12px",
        borderRadius: 20,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function Pill({ text, color = T.slate, bg = T.slateBg, border = T.slateBorder }: { text: string; color?: string; bg?: string; border?: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: 20,
        color,
        background: bg,
        border: `0.5px solid ${border}`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function TabButton({
  active,
  label,
  count,
  accent,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  accent?: string;
  onClick: () => void;
}) {
  const c = accent || T.blue;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "8px 10px",
        borderRadius: 8,
        border: "none",
        background: active ? `linear-gradient(135deg, ${c}, ${c}88)` : "#F8FAFC",
        color: active ? "#fff" : T.slate,
        fontSize: 11.5,
        fontWeight: active ? 700 : 600,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.2s",
      }}
    >
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.slice(0, 8)}</span>
      {count !== undefined && (
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 20,
            background: active ? "rgba(255,255,255,0.2)" : "#F1F5F9",
            color: active ? "#fff" : T.hint,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 0", color: T.hint }}>
      {icon}
      <p style={{ fontSize: 13, fontWeight: 600, margin: "10px 0 3px", color: T.subtitle }}>{title}</p>
      <p style={{ fontSize: 11.5, margin: 0 }}>{subtitle}</p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [activeTab, setActiveTab] = useState("variants");
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { data: product, isLoading, error } = useGetProductByIdQuery(productId);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: T.page, padding: "24px" }}>
        <div style={{ height: 32, width: 220, borderRadius: 8, background: "#E2E8F0", animation: "shimmer 1.5s infinite" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: 14,
            marginTop: 14,
          }}
        >
          <div style={{ height: 360, borderRadius: 12, background: "#E2E8F0", animation: "shimmer 1.5s infinite 0.15s" }} />
          <div style={{ height: 360, borderRadius: 12, background: "#E2E8F0", animation: "shimmer 1.5s infinite 0.3s" }} />
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !product) {
    return (
      <div style={{ minHeight: "100vh", background: T.page, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", background: T.card, border: `1px solid ${T.redBorder}`, borderRadius: 14, padding: "28px 36px", maxWidth: 360 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: T.redBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <XCircle size={22} color={T.red} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: T.title, margin: "0 0 5px" }}>Product Not Found</h2>
          <p style={{ fontSize: 12.5, color: T.slate, margin: "0 0 16px" }}>
            The product you&apos;re looking for doesn&apos;t exist or has been permanently deleted.
          </p>
          <button
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 20px",
              borderRadius: 9,
              border: `1.5px solid ${T.border}`,
              background: "#fff",
              fontSize: 12.5,
              fontWeight: 600,
              color: T.slate,
              cursor: "pointer",
              fontFamily: T.font,
            }}
          >
            <ArrowLeft size={13} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived data ── */
  const images = product.images || [];
  const variants = product.variants || [];

  const priceValues = variants.map((v) => v.price).filter((p): p is number => !isNaN(p));
  const avgPrice = priceValues.length > 0 ? priceValues.reduce((a, b) => a + b, 0) / priceValues.length : 0;
  const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
  const maxPrice = priceValues.length > 0 ? Math.max(...priceValues) : 0;

  const specifications = product.attributes?.filter((a) => !a.isForVariant) || [];
  const variantAttrs = product.attributes?.filter((a) => a.isForVariant) || [];

  const getAttrValue = (attr: any) => {
    if (attr.valueString) return attr.valueString;
    if (attr.valueNumber != null) return attr.valueNumber;
    if (attr.valueBoolean != null) return attr.valueBoolean ? "Yes" : "No";
    if (attr.attributeValueId) {
      const found = attr.attribute?.values?.find((v: any) => v.id === attr.attributeValueId);
      if (found) return found.value;
    }
    return null;
  };
  const getAttrUnit = (attr: any) => attr.attribute?.unit || "";

  // ── Resolves a VARIANT attribute's display name/value/unit.
  // Actual API shape for variant attributes is:
  //   { attributeValueId, attributeValue: { value, attribute: { name, unit } } }
  // There is no top-level `attr.value`, so the previous implementation
  // (`attr.value || attr.attributeValueId`) always fell through to showing
  // the raw, meaningless attributeValueId (e.g. "cmtjnzyaw000lo014mc89o1c3").
  // Returns null when there's no resolvable value so callers can skip
  // rendering an empty pill instead of showing "—".
  const getVariantAttrDisplay = (attr: any): { name?: string; value: string | number; unit?: string } | null => {
    const name = attr.attributeValue?.attribute?.name || attr.attribute?.name;
    const unit = attr.attributeValue?.attribute?.unit || attr.attribute?.unit;
    const value = attr.attributeValue?.value ?? attr.valueString ?? attr.valueNumber ?? null;
    if (value === null || value === undefined || value === "") return null;
    return { name, value, unit };
  };

  const formatCurrency = (n?: number) => (n == null || isNaN(n) ? "—" : `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`);

  const formatWarranty = (w: any) => {
    if (!w) return null;
    const unitMap: Record<string, string> = { DAYS: "day", MONTHS: "month", YEARS: "year" };
    const unit = unitMap[w.unit] || w.unit?.toLowerCase() || "";
    return `${w.duration} ${unit}${w.duration > 1 ? "s" : ""} ${w.type ? w.type.toLowerCase() : ""} warranty`;
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) +
        ", " +
        new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "—";

  /* ──────────────────────────────────────────────────────────────────────
     RENDER
     ────────────────────────────────────────────────────────────────────── */

  return (
    <div style={{ fontFamily: T.font, minHeight: "100vh", background: T.page }}>
      {/* ── Sticky Header (full width) ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <button
              onClick={() => router.back()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: `1px solid ${T.slateBorder}`,
                background: "#F8FAFC",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={15} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: T.title, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {product.name}
              </h1>
              <p
                style={{
                  fontSize: 10.5,
                  color: T.hint,
                  margin: "1px 0 0",
                  fontFamily: "'JetBrains Mono', monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {product.id}
              </p>
            </div>
          </div>
          <StatusPill status={product.approvalStatus} />
        </div>
      </div>

      {/* ── Main Content — full width two-column layout ── */}
      <div style={{ padding: "14px 20px 32px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: 14,
            alignItems: "start",
          }}
          className="detail-grid"
        >
          {/* ═══ LEFT — primary content ═══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            {/* ── Compact stat strip ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="stats-grid">
              <StatChip
                icon={<Package size={15} color={T.blue} />}
                label="Variants"
                value={variants.length}
                accent={T.blue}
                accentBg={T.blueBg}
                accentBorder={T.blueBorder}
              />
              <StatChip
                icon={<DollarSign size={15} color={T.green} />}
                label="Avg Price"
                value={formatCurrency(avgPrice)}
                sub={minPrice !== maxPrice ? `${formatCurrency(minPrice)}–${formatCurrency(maxPrice)}` : undefined}
                accent={T.green}
                accentBg={T.greenBg}
                accentBorder={T.greenBorder}
              />
              <StatChip
                icon={<ImageIcon size={15} color={T.purple} />}
                label="Images"
                value={images.length}
                accent={T.purple}
                accentBg={T.purpleBg}
                accentBorder={T.purpleBorder}
              />
              <StatChip
                icon={<Layers size={15} color="#D97706" />}
                label="Specs"
                value={specifications.length}
                sub={`+${variantAttrs.length} variant`}
                accent="#D97706"
                accentBg="#FFFBEB"
                accentBorder="#FDE68A"
              />
            </div>

            {/* ── Basic Information ── */}
            <SectionCard
              icon={<Info size={13} color={T.blue} />}
              title="Basic Information"
              subtitle="Identity and metadata"
              accent={T.blue}
              accentBg={T.blueBg}
              accentBorder={T.blueBorder}
              headerRight={
                product.slug && (
                  <a
                    href={`/product/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: T.blue,
                      background: "#fff",
                      border: `0.5px solid ${T.blueBorder}`,
                      padding: "3px 9px",
                      borderRadius: 20,
                      textDecoration: "none",
                      fontFamily: "inherit",
                    }}
                  >
                    <ExternalLink size={10} />
                    Public Page
                  </a>
                )
              }
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }} className="info-grid">
                <InfoRow label="Product ID" value={product.id} mono compact />
                <InfoRow label="Slug" value={product.slug} mono accent={T.sky} compact />
                <InfoRow label="Vendor" value={product.vendor?.storeName || product.vendor?.name} compact />
                <InfoRow label="Category" value={product.category?.name} compact />
                <InfoRow label="Brand" value={product.brand?.name} compact />
                {product.nameBn && <InfoRow label="Name (বাংলা)" value={product.nameBn} accent={T.purple} compact />}
              </div>

              {product.videoUrl && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.rowBorder}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                    <Video size={11} color={T.cyan} />
                    Video
                  </div>
                  <a
                    href={product.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11.5,
                      color: T.cyan,
                      background: T.cyanBg,
                      border: `0.5px solid ${T.cyanBorder}`,
                      padding: "6px 10px",
                      borderRadius: 8,
                      textDecoration: "none",
                      wordBreak: "break-all",
                      fontFamily: "inherit",
                    }}
                  >
                    {product.videoUrl}
                  </a>
                </div>
              )}

              {product.description && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.rowBorder}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>
                    Description
                  </div>
                  <div style={{ position: "relative", background: "#FAFAFE", border: `0.5px solid ${T.purpleBorder}`, borderRadius: 9, overflow: "hidden" }}>
                    <div
                      dangerouslySetInnerHTML={{ __html: product.description }}
                      style={{
                        fontSize: 12.5,
                        color: "#334155",
                        lineHeight: 1.65,
                        padding: "10px 12px",
                        maxHeight: showFullDesc ? "none" : 140,
                        overflowY: showFullDesc ? "auto" : "hidden",
                        transition: "max-height 0.3s",
                      }}
                    />
                    {product.description.length > 400 && (
                      <button
                        onClick={() => setShowFullDesc(!showFullDesc)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          padding: "6px 0",
                          border: "none",
                          borderTop: `0.5px solid ${T.purpleBorder}`,
                          background: "#fff",
                          color: T.purple,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {showFullDesc ? (
                          <>
                            <ChevronUp size={12} /> Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> View Full Description
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ── Warranty & Shipping ── */}
            {product.warranty && (
              <SectionCard
                icon={<Truck size={13} color={T.sky} />}
                title="Shipping & Warranty"
                subtitle="Package and warranty terms"
                accent={T.sky}
                accentBg={T.skyBg}
                accentBorder={T.skyBorder}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="warranty-grid">
                  <SubSection icon={<Shield size={12} color={T.green} />} title="Warranty" accent={T.green} accentBg={T.greenBg} accentBorder={T.greenBorder}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.title, lineHeight: 1.4 }}>
                      {formatWarranty(product.warranty) || "No warranty"}
                    </div>
                    {product.warranty?.policy && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 11.5,
                          color: T.slate,
                          lineHeight: 1.55,
                          padding: "8px 10px",
                          background: "#F8FAFC",
                          border: `0.5px solid ${T.slateBorder}`,
                          borderRadius: 7,
                          maxHeight: 100,
                          overflowY: "auto",
                        }}
                      >
                        {product.warranty.policy}
                      </div>
                    )}
                  </SubSection>

                  <SubSection icon={<Scale size={12} color={T.purple} />} title="Weight" accent={T.purple} accentBg={T.purpleBg} accentBorder={T.purpleBorder}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: T.purple, lineHeight: 1.2 }}>
                      {product.warranty.packageWeightValue ?? "—"}
                    </div>
                    <div style={{ fontSize: 10.5, color: T.hint, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {product.warranty.packageWeightUnit?.toLowerCase() || "kg"}
                    </div>
                  </SubSection>

                  <SubSection icon={<Box size={12} color="#D97706" />} title="Dimensions" accent="#D97706" accentBg="#FFFBEB" accentBorder="#FDE68A">
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.title }}>
                      {product.warranty.packageLength ?? "—"} × {product.warranty.packageWidth ?? "—"} × {product.warranty.packageHeight ?? "—"} cm
                    </div>
                    <div style={{ fontSize: 10.5, color: T.hint, textTransform: "uppercase", letterSpacing: "0.05em" }}>L × W × H</div>
                  </SubSection>
                </div>

                <div style={{ marginTop: 10 }}>
                  <Pill
                    text={product.warranty.dangerousGoods === "CONTAINS" ? "⚠ Contains hazardous materials" : "✓ No hazardous materials"}
                    color={product.warranty.dangerousGoods === "CONTAINS" ? T.amber : T.green}
                    bg={product.warranty.dangerousGoods === "CONTAINS" ? T.amberBg : T.greenSoftBg}
                    border={product.warranty.dangerousGoods === "CONTAINS" ? T.amberBorder : T.greenSoftBorder}
                  />
                </div>
              </SectionCard>
            )}

            {/* ── Tabs ── */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: 4, gap: 4, background: T.headerBg }}>
                {[
                  { id: "variants", label: "Variants", count: variants.length, accent: "#15803D" },
                  { id: "images", label: "Images", count: images.length, accent: T.purple },
                  { id: "specs", label: "Specifications", count: specifications.length, accent: "#D97706" },
                  { id: "attributes", label: "Variant Settings", count: variantAttrs.length, accent: T.sky },
                ].map((tab) => (
                  <TabButton key={tab.id} active={activeTab === tab.id} label={tab.label} count={tab.count} accent={tab.accent} onClick={() => setActiveTab(tab.id)} />
                ))}
              </div>

              <div style={{ padding: "14px" }}>
                {/* ── Variants Tab ── */}
                {activeTab === "variants" && (
                  <div>
                    {variants.length === 0 ? (
                      <EmptyState
                        icon={<Package size={28} color="#E2E8F0" style={{ display: "block", margin: "0 auto" }} />}
                        title="No variants available"
                        subtitle="This product has no variant configurations"
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {variants.map((v, idx) => {
                          const discount = v.price && v.specialPrice && v.specialPrice < v.price ? Math.round(((v.price - v.specialPrice) / v.price) * 100) : 0;

                          // Resolve display-ready variant attributes (name/value/unit),
                          // skipping any that don't resolve to an actual value.
                          const displayAttrs = ((v as any).attributes || [])
                            .map((attr: any) => ({ id: attr.id, disp: getVariantAttrDisplay(attr) }))
                            .filter((a: any) => a.disp);

                          const warehouseStock = (v as any).warehouseStock || [];

                          return (
                            <div key={v.id} style={{ background: T.headerBg, border: `1px solid ${T.slateBorder}`, borderRadius: 10, padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#475569", padding: "2px 7px", borderRadius: 6, flexShrink: 0 }}>
                                    #{idx + 1}
                                  </span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.title, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                                      {v.name || `Variant ${idx + 1}`}
                                    </div>
                                    <div style={{ fontSize: 10.5, color: T.hint, fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                                      SKU: {v.sku || "—"}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                                  <Pill
                                    text={v.availability !== false ? "Active" : "Inactive"}
                                    color={v.availability !== false ? T.green : T.red}
                                    bg={v.availability !== false ? T.greenSoftBg : T.redBg}
                                    border={v.availability !== false ? T.greenSoftBorder : T.redBorder}
                                  />
                                  {v.taxRate != null && <Pill text={`VAT ${v.taxRate}%`} color={T.sky} bg={T.skyBg} border={T.skyBorder} />}
                                </div>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: v.specialPrice && v.specialPrice < (v.price || 0) ? "1fr 1fr" : "1fr", gap: 8 }}>
                                <div style={{ padding: "8px 10px", background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 9 }}>
                                  <div style={{ fontSize: 9.5, fontWeight: 600, color: T.green, textTransform: "uppercase", letterSpacing: "0.04em" }}>Price</div>
                                  <div style={{ fontSize: 17, fontWeight: 800, color: T.green, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(v.price)}</div>
                                </div>
                                {v.specialPrice && v.specialPrice < (v.price || 0) && (
                                  <div style={{ padding: "8px 10px", background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 9 }}>
                                    <div style={{ fontSize: 9.5, fontWeight: 600, color: T.red, textTransform: "uppercase", letterSpacing: "0.04em" }}>Special</div>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                                      <span style={{ fontSize: 17, fontWeight: 800, color: T.red, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(v.specialPrice)}</span>
                                      <span style={{ fontSize: 11, color: "#F87171", textDecoration: "line-through" }}>{formatCurrency(v.price)}</span>
                                    </div>
                                    {discount > 0 && (
                                      <span style={{ fontSize: 10, fontWeight: 700, color: T.red, background: "#FEE2E2", padding: "1px 5px", borderRadius: 4, marginTop: 3, display: "inline-block" }}>
                                        -{discount}% OFF
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* ── Variant Attributes — now resolved from
                                  attr.attributeValue.value / attr.attributeValue.attribute.name,
                                  instead of the nonexistent attr.value / raw attributeValueId. ── */}
                              {displayAttrs.length > 0 && (
                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.slateBorder}` }}>
                                  <div style={{ fontSize: 9.5, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                                    Variant Attributes
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {displayAttrs.map(({ id, disp }: any) => (
                                      <span key={id} style={{ fontSize: 11, fontWeight: 600, color: T.blue, background: T.blueBg, border: `0.5px solid ${T.blueBorder}`, padding: "2px 8px", borderRadius: 20 }}>
                                        {disp.name ? `${disp.name}: ` : ""}
                                        {disp.value}
                                        {disp.unit ? ` ${disp.unit}` : ""}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {v.images && v.images.length > 0 && (
                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.slateBorder}` }}>
                                  <div style={{ fontSize: 9.5, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                                    Images ({v.images.length})
                                  </div>
                                  <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 3 }}>
                                    {v.images.map((img: any, imgIdx: number) => (
                                      <div key={img.id || imgIdx} style={{ width: 54, height: 54, borderRadius: 7, overflow: "hidden", border: `1px solid ${T.slateBorder}`, flexShrink: 0 }}>
                                        <img src={typeof img === "string" ? img : img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ── Warehouse Stock — previously fetched (v.warehouseStock)
                                  but never rendered anywhere in the UI. ── */}
                              {warehouseStock.length > 0 ? (
                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.slateBorder}` }}>
                                  <div style={{ fontSize: 9.5, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                                    Warehouse Stock ({warehouseStock.length})
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                    {warehouseStock.map((ws: any, wsIdx: number) => (
                                      <div
                                        key={ws.id || wsIdx}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 8,
                                          padding: "6px 10px",
                                          background: T.skyBg,
                                          border: `0.5px solid ${T.skyBorder}`,
                                          borderRadius: 7,
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                          <Box size={11} color={T.sky} style={{ flexShrink: 0 }} />
                                          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.title, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {ws.warehouse?.name || ws.warehouseName || ws.warehouseId || `Warehouse ${wsIdx + 1}`}
                                          </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, flexWrap: "wrap" }}>
                                          {ws.quantity != null && <Pill text={`Qty: ${ws.quantity}`} color={T.sky} bg="#E0F2FE" border="#7DD3FC" />}
                                          {ws.stock != null && <Pill text={`Stock: ${ws.stock}`} color={T.sky} bg="#E0F2FE" border="#7DD3FC" />}
                                          {ws.reservedQty != null && ws.reservedQty > 0 && (
                                            <Pill text={`Reserved: ${ws.reservedQty}`} color={T.amber} bg={T.amberBg} border={T.amberBorder} />
                                          )}
                                          {ws.damagedQty != null && ws.damagedQty > 0 && (
                                            <Pill text={`Damaged: ${ws.damagedQty}`} color={T.red} bg={T.redBg} border={T.redBorder} />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.slateBorder}` }}>
                                  <span style={{ fontSize: 10.5, color: T.hint, fontStyle: "italic" }}>
                                    Not assigned to any warehouse yet
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Images Tab ── */}
                {activeTab === "images" && (
                  <div>
                    {images.length === 0 ? (
                      <EmptyState
                        icon={<ImageIcon size={28} color="#E2E8F0" style={{ display: "block", margin: "0 auto" }} />}
                        title="No images uploaded"
                        subtitle="This product has no images"
                      />
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                        {images.map((img: any, idx) => (
                          <div key={img.id}>
                            <div style={{ position: "relative", aspectRatio: "1", borderRadius: 9, overflow: "hidden", border: `1px solid ${T.slateBorder}` }}>
                              <img src={img.url || (typeof img === "string" ? img : img.url)} alt={img.altText || `${product.name} image ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <div style={{ position: "absolute", top: 5, right: 5, fontSize: 8.5, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "2px 5px", borderRadius: 5 }}>
                                {img.sortOrder !== undefined ? img.sortOrder + 1 : idx + 1}
                              </div>
                            </div>
                            {img.altText && (
                              <p style={{ fontSize: 10, color: T.slate, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.altText}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Specs Tab ── */}
                {activeTab === "specs" && (
                  <div>
                    {specifications.length === 0 ? (
                      <EmptyState
                        icon={<Info size={28} color="#E2E8F0" style={{ display: "block", margin: "0 auto" }} />}
                        title="No specifications"
                        subtitle="No specification attributes defined for this product"
                      />
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: `0.5px solid ${T.border}`, borderRadius: 9, overflow: "hidden" }} className="specs-grid">
                        {specifications.map((spec: any, idx) => {
                          const val = getAttrValue(spec);
                          const unit = getAttrUnit(spec);
                          const hasValue = val !== null && val !== "";
                          const attrName = spec.attribute?.name || spec.attributeId;
                          return (
                            <div
                              key={spec.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                padding: "9px 12px",
                                background: idx % 2 === 0 ? "#fff" : T.headerBg,
                                borderBottom: idx < specifications.length - 1 ? `0.5px solid ${T.rowBorder}` : "none",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: 12, fontWeight: hasValue ? 700 : 500, color: hasValue ? T.title : T.hint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {attrName}
                                </span>
                                {unit && <span style={{ fontSize: 10, color: T.hint, flexShrink: 0 }}>({unit})</span>}
                              </div>
                              <div style={{ textAlign: "right", fontSize: 12.5, fontWeight: hasValue ? 700 : 400, color: hasValue ? T.title : "#CBD5E1", wordBreak: "break-all", maxWidth: "55%" }}>
                                {val || "—"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Variant Settings Tab ── */}
                {activeTab === "attributes" && (
                  <div>
                    {variantAttrs.length === 0 ? (
                      <EmptyState
                        icon={<TagIcon size={28} color="#E2E8F0" style={{ display: "block", margin: "0 auto" }} />}
                        title="No variant attributes"
                        subtitle="No attributes are marked for variant generation"
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {variantAttrs.map((attr: any, idx) => {
                          const attrValues = attr.attribute?.values || [];
                          const attrName = attr.attribute?.name || attr.attributeId;
                          return (
                            <div key={attr.id} style={{ background: T.skyBg, border: `1px solid ${T.skyBorder}`, borderRadius: 10, overflow: "hidden" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: `0.5px solid ${T.skyBorder}`, background: "#fff", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#0369A1,#0891B2)", padding: "2px 7px", borderRadius: 6, flexShrink: 0 }}>
                                    {idx + 1}
                                  </span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.sky, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attrName}</div>
                                    <div style={{ fontSize: 10, color: T.slate, fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {attr.attribute?.type} · {attr.attributeId}
                                    </div>
                                  </div>
                                </div>
                                <Pill text="For Variants" color={T.sky} bg="#E0F2FE" border="#7DD3FC" />
                              </div>
                              {attrValues.length > 0 && (
                                <div style={{ padding: "8px 12px" }}>
                                  <div style={{ fontSize: 9.5, fontWeight: 600, color: T.slate, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                                    Available Values ({attrValues.length})
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {attrValues.map((val: any) => (
                                      <span key={val.id} style={{ fontSize: 11, fontWeight: 600, color: T.sky, background: T.skyBg, border: `0.5px solid ${T.skyBorder}`, padding: "3px 9px", borderRadius: 7 }}>
                                        {val.value}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT — sticky summary sidebar ═══ */}
          <div style={{ position: "sticky", top: 62, display: "flex", flexDirection: "column", gap: 12 }} className="detail-sidebar">
            <SectionCard icon={<Shield size={13} color={T.slate} />} title="Approval Status" accent={T.slate} accentBg={T.slateBg} accentBorder={T.slateBorder}>
              <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 10px" }}>
                <StatusPill status={product.approvalStatus} />
              </div>

              {product.approvedBy && (
                <div style={{ background: T.greenBg, border: `0.5px solid ${T.greenBorder}`, borderRadius: 8, padding: "9px 11px", marginBottom: 8 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={10} /> Approved By
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: T.green }}>{product.approvedBy.name}</div>
                  {product.approvedBy.email && (
                    <div style={{ fontSize: 10.5, color: T.slate, fontFamily: "'JetBrains Mono', monospace", wordBreak: "break-all" }}>{product.approvedBy.email}</div>
                  )}
                </div>
              )}

              <InfoRow label="Created" value={formatDate(product.createdAt)} compact />
              <InfoRow label="Updated" value={formatDate(product.updatedAt)} compact />
            </SectionCard>

            {/* ── Vendor & Category — vendor ID replaced with avatar +
                status/verificationStatus, which are actually useful and
                already returned by the API (product.vendor.status,
                product.vendor.verificationStatus, product.vendor.avatar). ── */}
            <SectionCard icon={<Store size={13} color={T.blue} />} title="Vendor & Category" accent={T.blue} accentBg={T.blueBg} accentBorder={T.blueBorder}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, marginBottom: 4, borderBottom: `0.5px dashed ${T.rowBorder}` }}>
                {product.vendor?.avatar && (
                  <img
                    src={product.vendor.avatar}
                    alt={product.vendor.storeName || "Vendor"}
                    style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.slateBorder}`, flexShrink: 0 }}
                  />
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: T.title, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {product.vendor?.storeName || product.vendor?.name || "—"}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                    {product.vendor?.status && (
                      <Pill
                        text={product.vendor.status}
                        color={product.vendor.status === "ACTIVE" ? T.green : T.slate}
                        bg={product.vendor.status === "ACTIVE" ? T.greenSoftBg : T.slateBg}
                        border={product.vendor.status === "ACTIVE" ? T.greenSoftBorder : T.slateBorder}
                      />
                    )}
                    {product.vendor?.verificationStatus && (
                      <Pill
                        text={product.vendor.verificationStatus}
                        color={
                          product.vendor.verificationStatus === "VERIFIED"
                            ? T.green
                            : product.vendor.verificationStatus === "REJECTED"
                              ? T.red
                              : T.amber
                        }
                        bg={
                          product.vendor.verificationStatus === "VERIFIED"
                            ? T.greenSoftBg
                            : product.vendor.verificationStatus === "REJECTED"
                              ? T.redBg
                              : T.amberBg
                        }
                        border={
                          product.vendor.verificationStatus === "VERIFIED"
                            ? T.greenSoftBorder
                            : product.vendor.verificationStatus === "REJECTED"
                              ? T.redBorder
                              : T.amberBorder
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
              <InfoRow label="Category" value={product.category?.name} compact />
              <InfoRow label="Brand" value={product.brand?.name} compact />
            </SectionCard>

            <SectionCard icon={<Tag size={13} color={T.green} />} title="Pricing Snapshot" accent={T.green} accentBg={T.greenBg} accentBorder={T.greenBorder}>
              <InfoRow label="Average" value={formatCurrency(avgPrice)} accent={T.green} compact />
              {minPrice !== maxPrice && (
                <InfoRow label="Range" value={`${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`} compact />
              )}
              <InfoRow label="Variants" value={variants.length} compact />
            </SectionCard>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }

        }
        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr !important; }
          .detail-sidebar { position: static !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .warranty-grid { grid-template-columns: 1fr !important; }
          .info-grid { grid-template-columns: 1fr !important; }
          .specs-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}