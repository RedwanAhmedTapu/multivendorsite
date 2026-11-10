"use client";

// Campaigns page for admin-side staff with marketingManagement (not ADMIN):
// the same list + panel layout as the ADMIN page, but only the Vendor Rules
// and Registrations tabs — the page builder (Details, create, delete,
// publish) stays ADMIN only. The list comes from the marketing API because
// /api/campaigns is ADMIN only. New UI → text via next-intl.

import * as React from "react";
import { useTranslations } from "next-intl";
import { Layers, Megaphone, Search } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MarketingIntlProvider } from "@/i18n/MarketingIntlProvider";
import { useListMarketingCampaignPagesQuery, type CampaignPageSummary } from "@/features/marketingAdminApi";
import { CampaignProgrammeTabs, ProgrammeChip } from "./CampaignProgrammeTabs";
import { EmptyState, ErrorState, LoadingRows } from "./MarketingShared";

function View() {
  const t = useTranslations("marketing.staff");
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { data, isLoading, isError, error, refetch } = useListMarketingCampaignPagesQuery({ limit: 100 });
  const pages = data?.data ?? [];
  const visible = pages.filter((p) => (p.title + " " + p.slug).toLowerCase().includes(search.trim().toLowerCase()));
  const selected = pages.find((p) => p.id === selectedId) ?? null;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "#F0F4FA", minHeight: "100vh" }} className="px-3 py-5 sm:px-4 sm:py-6">
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#1D4ED8,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Megaphone size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0D1B2E", margin: 0 }}>{t("title")}</h1>
            <p style={{ fontSize: 11.5, color: "#7A90AB", margin: 0 }}>{t("subtitle")}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
          <div className={selected ? "hidden lg:block" : "block"}>
            <SectionCard icon={<Layers size={15} color="#1D4ED8" />} title={t("listTitle")}>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <Input placeholder={t("search")} aria-label={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 32, fontSize: 13 }} />
              </div>
              {isLoading ? (
                <LoadingRows />
              ) : isError ? (
                <ErrorState message={(error as any)?.data?.message} onRetry={refetch} />
              ) : visible.length === 0 ? (
                <EmptyState title={pages.length ? t("noMatch") : t("empty")} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflowY: "auto" }}>
                  {visible.map((p: CampaignPageSummary) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      aria-current={p.id === selectedId ? "true" : undefined}
                      className="w-full text-left"
                      style={{ padding: 10, borderRadius: 12, border: `1.5px solid ${p.id === selectedId ? "#1D4ED8" : "#E5EAF2"}`, background: p.id === selectedId ? "#EEF3FB" : "#fff", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2E" }}>{p.title}</div>
                      <div style={{ fontSize: 10.5, color: "#7A90AB" }}>/campaign/{p.slug}</div>
                      {p.programme ? <ProgrammeChip status={p.programme.status} pending={p.programme.counts?.pending ?? 0} /> : <span style={{ fontSize: 10, color: "#9BAABB" }}>{t("noProgramme")}</span>}
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
          <div className={selected ? "block" : "hidden lg:block"}>
            {selected ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0D1B2E", margin: 0 }}>{selected.title}</h2>
                  <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSelectedId(null)}>
                    {t("back")}
                  </Button>
                </div>
                <CampaignProgrammeTabs pageId={selected.id} />
              </div>
            ) : (
              <div style={{ background: "#fff", border: "1.5px dashed #E5EAF2", borderRadius: 14, padding: "56px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "#3D5068", margin: 0 }}>{t("selectPrompt")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StaffCampaignsView() {
  return (
    <MarketingIntlProvider>
      <View />
    </MarketingIntlProvider>
  );
}
