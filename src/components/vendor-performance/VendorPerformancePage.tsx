// components/vendor-performance/VendorPerformancePage.tsx
//
// Admin vendor-performance surface (Phase 4). Three tabs:
//   Scoreboard   — latest snapshot, grade/coverage distribution, vendor table
//   Expiry queue — approved documents with no expiry date + set-expiry action
//   Score config — active weights/thresholds + publish (server-validated)
// The vendor detail drawer opens over the scoreboard.
//
// Shadow mode: the vendor-facing endpoint stays 403 unless the server flag
// VENDOR_PERFORMANCE_VISIBLE_TO_VENDORS is on; nothing here talks to it.

"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetVendorPerformanceConfigQuery, vendorPerformanceApi } from "@/features/vendorPerformanceApi";
import { MarketingIntlProvider, useAppLocale } from "@/i18n/MarketingIntlProvider";
import type { PerformanceListItem } from "./types";
import { Chip } from "./shared";
import { Scoreboard } from "./Scoreboard";
import { ExpiryQueue } from "./ExpiryQueue";
import { ScoreConfigPanel } from "./ScoreConfigPanel";
import { VendorPerformanceDrawer } from "./VendorPerformanceDrawer";

export default function VendorPerformancePage() {
  return (
    <MarketingIntlProvider>
      <VendorPerformanceScreen />
    </MarketingIntlProvider>
  );
}

function VendorPerformanceScreen() {
  const dispatch = useDispatch();
  const { locale, setLocale } = useAppLocale();
  const [tab, setTab] = React.useState("scoreboard");
  const [selected, setSelected] = React.useState<PerformanceListItem | null>(null);
  const configQuery = useGetVendorPerformanceConfigQuery();
  const scoreConfig = configQuery.data?.config ?? null;

  const refresh = () => {
    dispatch(vendorPerformanceApi.util.invalidateTags(["VendorPerformance", "VendorDocument"]));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Vendor performance</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Grades and metrics come from the nightly snapshot — never a live aggregate. Scores are
            informational and are not wired into commission, payouts or badges.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {configQuery.data ? (
            <Chip
              tone={configQuery.data.shadowMode.visibleToVendors ? "emerald" : "slate"}
              title="Controlled by the server flag VENDOR_PERFORMANCE_VISIBLE_TO_VENDORS"
            >
              {configQuery.data.shadowMode.visibleToVendors
                ? "Vendor-facing view: visible"
                : "Shadow mode — admin only"}
            </Chip>
          ) : null}
          <div
            role="group"
            aria-label="Language for improvement checklist"
            className="inline-flex overflow-hidden rounded-md border"
          >
            {(["en", "bn"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={locale === value}
                onClick={() => setLocale(value)}
                className={
                  locale === value
                    ? "bg-foreground px-2 py-1 text-[11px] font-semibold text-background"
                    : "px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                }
              >
                {value === "en" ? "EN" : "বাংলা"}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={refresh}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-3">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
          <TabsTrigger value="scoreboard">Scoreboard</TabsTrigger>
          <TabsTrigger value="expiry">Expiry queue</TabsTrigger>
          <TabsTrigger value="config">Score config</TabsTrigger>
        </TabsList>

        <TabsContent value="scoreboard" className="mt-0">
          <Scoreboard config={scoreConfig} onOpenVendor={setSelected} />
        </TabsContent>
        <TabsContent value="expiry" className="mt-0">
          <ExpiryQueue />
        </TabsContent>
        <TabsContent value="config" className="mt-0">
          <ScoreConfigPanel />
        </TabsContent>
      </Tabs>

      {selected ? (
        <VendorPerformanceDrawer
          item={selected}
          config={scoreConfig}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
