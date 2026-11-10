"use client";

// Tabs for the existing Campaigns page editor panel:
//   Details (the existing CampaignEditor, ADMIN only) | Vendor Rules | Registrations
// The Details panel stays MOUNTED while another tab is shown, so unsaved
// edits and the page's dirty-tracking survive tab switches. The vendor tabs
// mount the first time they are opened. Tab bar styled like the page's own
// filter pills. New text via next-intl (scoped provider).

import * as React from "react";
import { useTranslations } from "next-intl";
import { MarketingIntlProvider } from "@/i18n/MarketingIntlProvider";
import { useListMarketingCampaignPagesQuery, type CampaignPageSummary, type ProgrammeStatus } from "@/features/marketingAdminApi";
import { LanguageSwitcher } from "./MarketingShared";
import { VendorRulesPanel } from "./VendorRulesPanel";
import { RegistrationsTab } from "./RegistrationsPanel";

type TabKey = "details" | "rules" | "registrations";

const PILL = (active: boolean): React.CSSProperties => ({
  fontSize: 12,
  fontWeight: 700,
  padding: "6px 13px",
  borderRadius: 20,
  border: `1.5px solid ${active ? "#1D4ED8" : "#E5EAF2"}`,
  background: active ? "#EEF3FB" : "#fff",
  color: active ? "#1D4ED8" : "#3D5068",
  cursor: "pointer",
  fontFamily: "inherit",
});

function Tabs({ pageId, details }: { pageId: string; details?: React.ReactNode }) {
  const t = useTranslations("marketing.tabs");
  const keys: TabKey[] = details ? ["details", "rules", "registrations"] : ["rules", "registrations"];
  const [active, setActive] = React.useState<TabKey>(keys[0]);
  const [opened, setOpened] = React.useState<Set<TabKey>>(() => new Set([keys[0]]));
  const open = (k: TabKey) => {
    setActive(k);
    setOpened((s) => (s.has(k) ? s : new Set(s).add(k)));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div role="tablist" aria-label={t("label")} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {keys.map((k) => (
            <button key={k} type="button" role="tab" id={`campaign-tab-${k}`} aria-selected={active === k} aria-controls={`campaign-panel-${k}`} onClick={() => open(k)} style={PILL(active === k)}>
              {t(k)}
            </button>
          ))}
        </div>
        {active !== "details" && <LanguageSwitcher />}
      </div>
      {keys.map((k) => (
        <div key={k} role="tabpanel" id={`campaign-panel-${k}`} aria-labelledby={`campaign-tab-${k}`} hidden={active !== k}>
          {k === "details" ? details : opened.has(k) ? (k === "rules" ? <VendorRulesPanel pageId={pageId} /> : <RegistrationsTab pageId={pageId} />) : null}
        </div>
      ))}
    </div>
  );
}

/** `details` = the existing editor (ADMIN). Omit it for staff (vendor tabs only). */
export function CampaignProgrammeTabs({ pageId, details }: { pageId: string; details?: React.ReactNode }) {
  return (
    <MarketingIntlProvider>
      <Tabs key={pageId} pageId={pageId} details={details} />
    </MarketingIntlProvider>
  );
}

const CHIP: Record<ProgrammeStatus, { bg: string; fg: string }> = {
  DRAFT: { bg: "#FAFBFD", fg: "#7A90AB" },
  PUBLISHED: { bg: "#F0F9F0", fg: "#16A34A" },
  ENDED: { bg: "#F1F5F9", fg: "#64748B" },
  CANCELLED: { bg: "#FEF2F2", fg: "#DC2626" },
};

function Chip({ status, pending }: { status: ProgrammeStatus; pending: number }) {
  const t = useTranslations("marketing.chip");
  const c = CHIP[status] ?? CHIP.DRAFT;
  return (
    <span style={{ display: "inline-block", marginTop: 3, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: c.bg, color: c.fg, border: "1px solid #E5EAF2" }}>
      {t(status, { pending })}
    </span>
  );
}

/** Small "vendor programme" chip for a campaign list item. */
export function ProgrammeChip({ status, pending = 0 }: { status: ProgrammeStatus; pending?: number }) {
  return (
    <MarketingIntlProvider>
      <Chip status={status} pending={pending} />
    </MarketingIntlProvider>
  );
}

/** pageId → its vendor programme summary (for list chips). Skipped when not allowed. */
export function useProgrammeSummaries(enabled: boolean) {
  const { data } = useListMarketingCampaignPagesQuery({ limit: 100 }, { skip: !enabled });
  return React.useMemo(() => new Map<string, CampaignPageSummary["programme"]>((data?.data ?? []).map((p) => [p.id, p.programme])), [data]);
}
