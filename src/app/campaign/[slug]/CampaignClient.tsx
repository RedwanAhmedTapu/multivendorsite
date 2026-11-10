"use client";

// app/campaign/[slug]/CampaignClient.tsx
//
// Renders a published CampaignPage: hero banner, then each visible block
// in order (banner / product grid-carousel-featured / countdown timer /
// voucher / category grid). This is the page a homepage slider slide
// lands shoppers on — e.g. /campaign/mega-tshirt-fest.
//
// Purpose-built renderer rather than plugging into the existing
// store-editor's componentspreview/* pipeline (StorefrontClient.tsx uses
// that for vendor stores) — that pipeline carries a lot of editor-only
// machinery (ComponentHandler drag handles, demo-data fallbacks) that
// isn't a fit for a public admin-owned landing page. Can be unified later
// if you'd rather share one renderer for both.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, AlertTriangle, Star, Timer } from "lucide-react";
import { useGetPublicCampaignBySlugQuery, type CampaignComponent } from "@/features/campaignPageApi";
import { SharedProductCard } from "@/components/product/card/SharedProductCard";

/* ─────────────────────────── Countdown ─────────────────────────── */

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: diff <= 0 };
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div
        style={{
          background: "#0D1B2E",
          color: "#fff",
          fontSize: 20,
          fontWeight: 800,
          borderRadius: 8,
          padding: "8px 10px",
          minWidth: 46,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <span style={{ fontSize: 10, color: "#7A90AB", fontWeight: 700, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────── Blocks ─────────────────────────── */

function BannerBlock({ component }: { component: CampaignComponent }) {
  const cfg = component.config;
  if (!cfg?.bannerImage) return null;

  const img = (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/6",
        borderRadius: 14,
        overflow: "hidden",
        background: cfg.bannerBackgroundColor || "#F0F4FA",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cfg.bannerImage} alt={cfg.title || "Banner"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {cfg.title && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            padding: 24,
            background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 60%)",
          }}
        >
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>{cfg.title}</h2>
        </div>
      )}
    </div>
  );

  return cfg.bannerLink ? (
    <Link href={cfg.bannerLink} style={{ display: "block" }}>
      {img}
    </Link>
  ) : (
    img
  );
}

// Campaign products use the shared global product card (same design and
// config as every other listing). It links to the existing product route
// /products/[id] (the old inline card linked to /product/… — no such route).
// Campaign payloads have no vendor/rating/discount fields; the card simply
// omits those parts, and derives the discount % from the two prices.
function ProductCard({ item }: { item: CampaignComponent["products"][number] }) {
  return (
    <SharedProductCard
      product={item.product}
      imageSizes="(max-width: 767px) 50vw, 220px"
      unoptimizedImage
    />
  );
}

function ProductGridBlock({ component }: { component: CampaignComponent }) {
  if (!component.products.length) return null;
  const perRow = component.config?.productsPerRow ?? 4;
  const isCarousel = component.type === "PRODUCT_CAROUSEL";

  return (
    <section>
      {component.config?.title && (
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0D1B2E", marginBottom: 12 }}>{component.config.title}</h2>
      )}
      {isCarousel ? (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
          {component.products.map((item) => (
            <div key={item.id} style={{ minWidth: 170, flexShrink: 0 }}>
              <ProductCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(perRow, 6)}, 1fr)`, gap: 12 }}>
          {component.products.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function CountdownBlock({ component }: { component: CampaignComponent }) {
  const cd = useCountdown(component.config?.countdownEndDate);

  return (
    <section
      style={{
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        background: component.config?.bannerImage
          ? `linear-gradient(rgba(13,27,46,0.55), rgba(13,27,46,0.55)), url(${component.config.bannerImage}) center/cover`
          : "linear-gradient(135deg,#1D4ED8,#7C3AED)",
        padding: "24px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", opacity: 0.9, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
          <Timer size={13} /> Limited Time
        </div>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0 }}>{component.config?.title || "Flash Sale"}</h2>
      </div>

      {cd && !cd.expired && (
        <div style={{ display: "flex", gap: 8 }}>
          <CountdownDigit value={cd.days} label="Days" />
          <CountdownDigit value={cd.hours} label="Hrs" />
          <CountdownDigit value={cd.minutes} label="Min" />
          <CountdownDigit value={cd.seconds} label="Sec" />
        </div>
      )}

      {component.products.length > 0 && (
        <div style={{ display: "flex", gap: 10, width: "100%", overflowX: "auto", marginTop: 8 }}>
          {component.products.slice(0, 6).map((item) => (
            <div key={item.id} style={{ minWidth: 140, flexShrink: 0, background: "#fff", borderRadius: 10, overflow: "hidden" }}>
              <ProductCard item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function VoucherBlock({ component }: { component: CampaignComponent }) {
  const cfg = component.config;
  return (
    <section
      style={{
        borderRadius: 14,
        border: "1.5px dashed #7C3AED",
        background: "#F5F0FE",
        padding: 20,
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#7C3AED", margin: 0 }}>{cfg?.title || "Special Offer"}</h2>
      {cfg?.bannerLink && (
        <Link
          href={cfg.bannerLink}
          style={{ display: "inline-block", marginTop: 10, background: "#7C3AED", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "8px 20px", borderRadius: 9 }}
        >
          Claim Offer
        </Link>
      )}
    </section>
  );
}

function renderBlock(component: CampaignComponent) {
  switch (component.type) {
    case "BANNER":
    case "STORE_BANNER":
      return <BannerBlock component={component} />;
    case "PRODUCT_GRID":
    case "PRODUCT_CAROUSEL":
    case "FEATURED_PRODUCTS":
      return <ProductGridBlock component={component} />;
    case "COUNTDOWN_TIMER":
      return <CountdownBlock component={component} />;
    case "VOUCHER_PROMOTION":
      return <VoucherBlock component={component} />;
    default:
      return null;
  }
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function CampaignClient({ slug }: { slug: string }) {
  const { data: campaign, isLoading, isError } = useGetPublicCampaignBySlugQuery(slug);

  const sortedComponents = useMemo(
    () => [...(campaign?.components ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [campaign]
  );

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Loader2 size={26} className="animate-spin" color="#1D4ED8" />
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 80, gap: 10 }}>
        <AlertTriangle size={30} color="#DC2626" />
        <p style={{ fontSize: 14, fontWeight: 700, color: "#0D1B2E" }}>This campaign isn&apos;t available</p>
        <p style={{ fontSize: 12, color: "#7A90AB" }}>It may have ended or hasn&apos;t started yet.</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Hero */}
      {campaign.heroImage && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/6", maxHeight: 420, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={campaign.heroImage} alt={campaign.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {(campaign.heroTitle || campaign.heroSubtitle) && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: 20,
                background: "linear-gradient(rgba(13,27,46,0.35), rgba(13,27,46,0.55))",
              }}
            >
              {campaign.heroTitle && (
                <h1 style={{ color: "#fff", fontSize: "clamp(24px,5vw,42px)", fontWeight: 800, margin: 0 }}>{campaign.heroTitle}</h1>
              )}
              {campaign.heroSubtitle && (
                <p style={{ color: "#fff", fontSize: "clamp(13px,2vw,17px)", marginTop: 8, opacity: 0.95 }}>{campaign.heroSubtitle}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 28 }}>
        {sortedComponents.map((component) => (
          <div key={component.id}>{renderBlock(component)}</div>
        ))}
      </div>
    </div>
  );
}