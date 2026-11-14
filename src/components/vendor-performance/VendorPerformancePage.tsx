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
import { BarChart3, RefreshCw } from "lucide-react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetVendorPerformanceConfigQuery, vendorPerformanceApi } from "@/features/vendorPerformanceApi";
import type { PerformanceListItem } from "./types";
import { Chip } from "./shared";
import { Scoreboard } from "./Scoreboard";
import { ExpiryQueue } from "./ExpiryQueue";
import { ScoreConfigPanel } from "./ScoreConfigPanel";
import { VendorPerformanceDrawer } from "./VendorPerformanceDrawer";

const TAB_TRIGGER =
  "rounded-lg px-3 py-1.5 text-[13px] data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-indigo-500/20 dark:data-[state=active]:text-indigo-200";

export default function VendorPerformancePage() {
  const dispatch = useDispatch();
  const [tab, setTab] = React.useState("scoreboard");
  const [selected, setSelected] = React.useState<PerformanceListItem | null>(null);
  const configQuery = useGetVendorPerformanceConfigQuery();
  const scoreConfig = configQuery.data?.config ?? null;

  const refresh = () => {
    dispatch(vendorPerformanceApi.util.invalidateTags(["VendorPerformance", "VendorDocument"]));
  };

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/50 dark:via-slate-900 dark:to-violet-950/40">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/10"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Vendor performance</h1>
              <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
                Grades and metrics come from the nightly snapshot — never a live aggregate. Scores
                are informational and are not wired into commission, payouts or badges.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {configQuery.data ? (
              <Chip
                tone={configQuery.data.shadowMode.visibleToVendors ? "emerald" : "amber"}
                title="Controlled by the server flag VENDOR_PERFORMANCE_VISIBLE_TO_VENDORS"
              >
                {configQuery.data.shadowMode.visibleToVendors
                  ? "Vendor-facing view: visible"
                  : "Shadow mode — admin only"}
              </Chip>
            ) : null}
            <Button size="sm" variant="outline" onClick={refresh} className="bg-white/70">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab} className="gap-3">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl bg-indigo-50/80 p-1 sm:w-fit dark:bg-indigo-500/10">
          <TabsTrigger value="scoreboard" className={TAB_TRIGGER}>
            Scoreboard
          </TabsTrigger>
          <TabsTrigger value="expiry" className={TAB_TRIGGER}>
            Expiry queue
          </TabsTrigger>
          <TabsTrigger value="config" className={TAB_TRIGGER}>
            Score config
          </TabsTrigger>
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
