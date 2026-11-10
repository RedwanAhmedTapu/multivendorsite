"use client";

// Shared pieces for the Advertisement screens (vendor + admin).
// FRONTEND-ONLY: no advertisement API exists yet — see lib/ads/ads-demo.ts.

import * as React from "react";
import { FlaskConical, ImageIcon, Info, Package, ShieldAlert, Store } from "lucide-react";
import {
  AD_STATUS_LABEL,
  AD_TYPE_LABEL,
  placementById,
  type AdCampaign,
  type AdPlacementId,
  type AdProduct,
  type AdStatus,
  type AdType,
} from "@/lib/ads/ads-demo";

/** Always-visible banner: these screens show sample data and save nothing. */
export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div
      role="note"
      aria-label="Demo data notice"
      className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">Preview — sample data, nothing is saved</p>
        <p className="mt-0.5 text-amber-800">
          {children ??
            "Advertising is not live yet. The campaigns below are sample records, and actions only change this page until you reload. No campaign is created, submitted, reviewed or charged."}
        </p>
      </div>
    </div>
  );
}

/** Explains a role/permission limitation. UI-only — not security enforcement. */
export function AccessNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-[#E5EAF2] bg-[#FAFBFD] px-4 py-3 text-[13px] text-[#334155]">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#7A90AB]" aria-hidden />
      <div>
        <p className="font-semibold text-[#0D1B2E]">{title}</p>
        <p className="mt-0.5">{children}</p>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<AdStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING_REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  PAYMENT_PENDING: "bg-blue-50 text-blue-800 border-blue-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export function AdStatusBadge({ status }: { status: AdStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${STATUS_STYLE[status]}`}>
      {AD_STATUS_LABEL[status]}
    </span>
  );
}

export function AdTypeBadge({ type }: { type: AdType }) {
  const Icon = type === "STORE" ? Store : Package;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#E5EAF2] bg-white px-2 py-0.5 text-[11.5px] font-medium text-[#334155]">
      <Icon className="h-3 w-3" aria-hidden />
      {AD_TYPE_LABEL[type]}
    </span>
  );
}

export function placementText(id: AdPlacementId, categoryName?: string) {
  const p = placementById(id);
  return p.needsCategory && categoryName ? `${p.label} — ${categoryName}` : p.label;
}

export function SummaryCards({ items }: { items: { label: string; value: number; hint?: string; tone?: "default" | "amber" | "blue" | "red" | "green" }[] }) {
  const tone = { default: "text-[#0D1B2E]", amber: "text-amber-700", blue: "text-blue-700", red: "text-red-700", green: "text-emerald-700" };
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-[14px] border-[1.5px] border-[#E5EAF2] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[12px] font-medium text-[#7A90AB]">{it.label}</p>
          <p className={`mt-1 text-2xl font-bold ${tone[it.tone ?? "default"]}`}>{it.value}</p>
          {it.hint && <p className="mt-0.5 text-[11px] text-[#7A90AB]">{it.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function StoreLogo({ name, url, size = 48 }: { name: string; url?: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "S";
  return url ? (
    <img src={url} alt={`${name} logo`} width={size} height={size} className="shrink-0 rounded-xl border border-[#E5EAF2] object-cover" style={{ width: size, height: size }} />
  ) : (
    <div aria-label={`${name} logo placeholder`} className="flex shrink-0 items-center justify-center rounded-xl border border-[#E5EAF2] bg-[#EEF3FB] font-bold text-[#1e40af]" style={{ width: size, height: size, fontSize: size / 2.6 }}>
      {initials}
    </div>
  );
}

export function ProductThumb({ product, size = 56 }: { product: AdProduct; size?: number }) {
  return product.image ? (
    <img src={product.image} alt="" width={size} height={size} className="shrink-0 rounded-lg border border-[#E5EAF2] object-cover" style={{ width: size, height: size }} />
  ) : (
    <div aria-hidden className="flex shrink-0 items-center justify-center rounded-lg border border-[#E5EAF2] bg-[#F5F7FB] text-[#94A3B8]" style={{ width: size, height: size }}>
      <Package className="h-5 w-5" />
    </div>
  );
}

/** How the creative would look — a mock-up, not the real storefront placement. */
export function AdCreativePreview({
  type,
  storeName,
  logoUrl,
  headline,
  bannerUrl,
  products,
}: {
  type: AdType;
  storeName: string;
  logoUrl?: string;
  headline?: string;
  bannerUrl?: string;
  products: AdProduct[];
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-[#E5EAF2] bg-white">
      <div className="flex items-center gap-1.5 border-b border-[#F0F4FA] bg-[#FAFBFD] px-3 py-1.5 text-[11px] font-medium text-[#7A90AB]">
        <Info className="h-3 w-3" aria-hidden /> Preview mock-up · "Sponsored" label shown to shoppers
      </div>
      {type === "STORE" ? (
        <div>
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner preview" className="h-28 w-full object-cover" />
          ) : (
            <div className="flex h-28 w-full items-center justify-center bg-gradient-to-r from-[#EEF3FB] to-[#F5F7FB] text-[12px] text-[#94A3B8]">
              <ImageIcon className="mr-1.5 h-4 w-4" aria-hidden /> Optional banner
            </div>
          )}
          <div className="flex items-center gap-3 p-4">
            <StoreLogo name={storeName} url={logoUrl} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-[#0D1B2E]">{storeName}</p>
              <p className="truncate text-[13px] text-[#475569]">{headline?.trim() || "Your headline appears here"}</p>
            </div>
            <span className="ml-auto rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Sponsored</span>
          </div>
        </div>
      ) : (
        <div className="p-3">
          {products.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-[#94A3B8]">Selected products appear here</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-label="Selected products">
              {products.map((p) => (
                <li key={p.id} className="rounded-lg border border-[#F0F4FA] p-2">
                  <ProductThumb product={p} size={64} />
                  <p className="mt-1.5 line-clamp-2 text-[11.5px] font-medium text-[#0D1B2E]">{p.name}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Sponsored</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </figure>
  );
}

export function CampaignFacts({ campaign }: { campaign: AdCampaign }) {
  const rows: [string, React.ReactNode][] = [
    ["Type", <AdTypeBadge key="t" type={campaign.type} />],
    ["Status", <AdStatusBadge key="s" status={campaign.status} />],
    ["Requested placement", placementText(campaign.placement, campaign.categoryName)],
    ["Duration", `${campaign.durationDays} days · starts after approval and payment`],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11.5px] font-medium text-[#7A90AB]">{k}</dt>
          <dd className="mt-0.5 text-[13px] text-[#0D1B2E]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
