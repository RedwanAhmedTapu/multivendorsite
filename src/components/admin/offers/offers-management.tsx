// components/admin/offers/offers-management.tsx
"use client";

import { useMemo, useState } from "react";
import { Clock, ShieldCheck } from "lucide-react";
import {
  useGetAllOffersQuery,
  useGetAllOfferAnalyticsQuery,
  useGetVendorPermissionStatsQuery,
  type CreatorType,
  type OfferType,
} from "@/features/offerApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  OFFER_STATUS_TABS,
  OFFER_TYPES,
  OFFER_TYPE_LABEL,
  buildOfferFilters,
  hasNextPage,
  matchesOfferSearch,
  rowsForTab,
  type OfferStatusTab,
} from "@/lib/offers/offer-view";
import {
  OfferBanner,
  OfferPagination,
  OfferSearchInput,
  OfferSelect,
  OfferStatusTabs,
  offerCard,
  offerErrorMessage,
  useDebouncedValue,
} from "@/components/offers/shared/offer-ui";
import { OffersHeader } from "./offers-header";
import { OffersAnalytics } from "./offers-analytics";
import { OffersTable } from "./offers-table";
import { VendorPermissionsManagement } from "./vendor-permissions-management";

const PAGE_SIZE = 10;
/** Offers loaded for the stat cards (the list API returns no true total). */
const STATS_WINDOW = 100;

type Section = "offers" | "permissions";
type Source = CreatorType | "ALL";

const TYPE_OPTIONS: { value: OfferType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All types" },
  ...OFFER_TYPES.map((t) => ({ value: t, label: OFFER_TYPE_LABEL[t] })),
];
const SOURCE_OPTIONS: { value: Source; label: string }[] = [
  { value: "ALL", label: "All creators" },
  { value: "ADMIN", label: "Admin" },
  { value: "VENDOR", label: "Vendors" },
  { value: "SYSTEM", label: "System" },
];

export function OffersManagement() {
  const [section, setSection] = useState<Section>("offers");
  const [tab, setTab] = useState<OfferStatusTab>("all");
  const [type, setType] = useState<OfferType | "ALL">("ALL");
  const [source, setSource] = useState<Source>("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search, 250);

  // Status, type and creator are list-endpoint filters → filtered on the server.
  const filters = useMemo(
    () => buildOfferFilters({ tab, type, page, limit: PAGE_SIZE, createdByType: source }),
    [tab, type, page, source],
  );
  const list = useGetAllOffersQuery(filters);
  const stats = useGetAllOffersQuery({ page: 1, limit: STATS_WINDOW });
  const pending = useGetAllOffersQuery({ status: "PENDING", createdByType: "VENDOR", page: 1, limit: STATS_WINDOW });
  const { data: analyticsData, isLoading: analyticsLoading } = useGetAllOfferAnalyticsQuery({});
  const { data: permissionStatsData } = useGetVendorPermissionStatsQuery();

  const pageRows = list.data?.data ?? [];
  // No search parameter on the API: search narrows the loaded page only.
  const rows = rowsForTab(pageRows, tab).filter((o) => matchesOfferSearch(o, query));
  const pendingCount = pending.data?.data?.length ?? 0;
  const filtersActive = tab !== "all" || type !== "ALL" || source !== "ALL" || !!query;

  const reset = () => setPage(1);
  const reviewPending = () => {
    setSection("offers");
    setTab("pending");
    setSource("VENDOR");
    setType("ALL");
    setSearch("");
    reset();
  };

  return (
    <div className="space-y-4">
      <OffersHeader />

      <OfferStatusTabs<Section>
        label="Offer management sections"
        value={section}
        onChange={setSection}
        tabs={[
          { value: "offers", label: "Offers", count: pendingCount },
          { value: "permissions", label: "Vendor permissions" },
        ]}
      />

      {section === "permissions" ? (
        <VendorPermissionsManagement />
      ) : (
        <>
          {pendingCount > 0 && !(tab === "pending" && source === "VENDOR") && (
            <OfferBanner
              tone="amber"
              icon={Clock}
              title={`${pendingCount}${pendingCount >= STATS_WINDOW ? "+" : ""} vendor offer${pendingCount === 1 ? "" : "s"} waiting for approval`}
              action={
                <Button type="button" size="sm" variant="outline" className="h-8 border-amber-300 bg-white text-amber-800 hover:bg-amber-50" onClick={reviewPending}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" /> Review now
                </Button>
              }
            >
              Pending offers stay hidden from customers until you approve them.
            </OfferBanner>
          )}

          <OffersAnalytics
            offers={stats.data?.data ?? []}
            windowSize={STATS_WINDOW}
            isLoading={stats.isLoading}
            analytics={analyticsData?.data ?? []}
            analyticsLoading={analyticsLoading}
            pendingVendorOffers={pendingCount}
            pendingCapped={pendingCount >= STATS_WINDOW}
            permissionStats={permissionStatsData?.data}
          />

          <section className={cn(offerCard, "overflow-hidden")} aria-label="All offers">
            <div className="flex flex-col gap-3 border-b border-[#EEF2F7] p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between">
              <OfferStatusTabs label="Filter offers by status" value={tab} onChange={(t) => { setTab(t); reset(); }} tabs={OFFER_STATUS_TABS} />
              <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto xl:min-w-[34rem]">
                <OfferSearchInput label="Search offers on this page" value={search} onChange={setSearch} placeholder="Search title, code or store" />
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <OfferSelect label="Filter by offer type" value={type} onChange={(v) => { setType(v); reset(); }} options={TYPE_OPTIONS} />
                  <OfferSelect label="Filter by creator" value={source} onChange={(v) => { setSource(v); reset(); }} options={SOURCE_OPTIONS} />
                </div>
              </div>
            </div>
            {query && (
              <p className="border-b border-[#EEF2F7] bg-[#FAFBFD] px-4 py-1.5 text-xs text-[#7A90AB]" aria-live="polite">
                {rows.length} match{rows.length === 1 ? "" : "es"} on this page for “{query}”
              </p>
            )}
            <OffersTable
              offers={rows}
              isLoading={list.isLoading}
              isFetching={list.isFetching}
              error={list.isError ? offerErrorMessage(list.error) : null}
              onRetry={() => list.refetch()}
              showVendorInfo
              empty={
                filtersActive
                  ? { title: "No offers match these filters", description: "Try another status, type, creator or search term." }
                  : { title: "No offers yet", description: "Create a platform offer, or wait for vendors to submit theirs." }
              }
            />
            {!list.isError && (
              <OfferPagination page={page} hasNext={hasNextPage(pageRows.length, PAGE_SIZE)} onPage={setPage} shown={rows.length} busy={list.isFetching} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
