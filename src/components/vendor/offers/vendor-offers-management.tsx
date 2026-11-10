"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import {
  useGetVendorOffersQuery,
  useGetVendorPermissionsInfoQuery,
  type Offer,
  type OfferType,
} from "@/features/offerApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  OFFER_STATUS_TABS,
  OFFER_TYPE_LABEL,
  buildOfferFilters,
  countByStatus,
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
  offerPrimaryButton,
  useDebouncedValue,
} from "@/components/offers/shared/offer-ui";
import { VendorOffersHeader } from "./vendor-offers-header";
import { VendorOffersAnalytics } from "./vendor-offers-analytics";
import { VendorOffersTable } from "./vendor-offers-table";
import { EditVendorOfferDialog } from "./edit-vendor-offer-dialog";
import { CreateVendorVoucherDialog } from "./create-vendor-voucher-dialog";

const PAGE_SIZE = 10;
/** Offers loaded for the stat cards (the API has no count endpoint mounted for vendors). */
const STATS_WINDOW = 100;

/** Offer types a vendor may filter by — the ones vendors can actually create. */
const TYPE_OPTIONS: { value: OfferType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All types" },
  ...(["REGULAR_DISCOUNT", "VOUCHER", "COUNTDOWN_DEAL", "FLASH_SALE", "BUY_X_GET_Y", "FREE_SHIPPING", "BUNDLE_DEAL", "SEASONAL_SALE"] as OfferType[]).map((t) => ({ value: t, label: OFFER_TYPE_LABEL[t] })),
];

export function VendorOffersManagement() {
  const router = useRouter();
  const [tab, setTab] = useState<OfferStatusTab>("all");
  const [type, setType] = useState<OfferType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search, 250);
  const [isCreateVoucherDialogOpen, setIsCreateVoucherDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Status tab and type filter go to the server (both are list-endpoint filters).
  const filters = useMemo(() => buildOfferFilters({ tab, type, page, limit: PAGE_SIZE }), [tab, type, page]);
  const list = useGetVendorOffersQuery(filters);
  const stats = useGetVendorOffersQuery({ page: 1, limit: STATS_WINDOW });
  // Vendor-scoped endpoint: the vendor comes from the session, never a
  // client-supplied id (the admin endpoint is ADMIN-only).
  const { data: permissionsData, isLoading: permissionsLoading } = useGetVendorPermissionsInfoQuery();
  const permissions = permissionsData?.data;

  // Same rule as the create page: any offer type the vendor is allowed.
  const canCreateOffer = !!permissions && [
    permissions.canCreateRegular, permissions.canCreateVoucher, permissions.canCreateCountdown,
    permissions.canCreateFlashSale, permissions.canCreateBuyXGetY, permissions.canCreateFreeShipping,
    permissions.canCreateBundleDeal, permissions.canCreateSeasonalSale, permissions.canCreateLoyaltyReward,
    permissions.canCreateReferralBonus,
  ].some(Boolean);
  const canCreateVoucher = permissions?.canCreateVoucher === true;

  const pageRows = list.data?.data ?? [];
  // Search has no API parameter, so it narrows the page already loaded.
  const rows = rowsForTab(pageRows, tab).filter((o) => matchesOfferSearch(o, query));
  const statOffers = stats.data?.data ?? [];
  const pendingCount = countByStatus(statOffers).pending;
  const filtersActive = tab !== "all" || type !== "ALL" || !!query;

  const changeTab = (t: OfferStatusTab) => { setTab(t); setPage(1); };
  const changeType = (t: OfferType | "ALL") => { setType(t); setPage(1); };
  const goCreateOffer = () => router.push("/vendor-dashboard/offer/add-offer");

  return (
    <div className="space-y-4">
      <VendorOffersHeader
        permissions={permissions}
        permissionsLoading={permissionsLoading}
        canCreateOffer={canCreateOffer}
        canCreateVoucher={canCreateVoucher}
        onCreateOffer={goCreateOffer}
        onCreateVoucher={() => setIsCreateVoucherDialogOpen(true)}
      />

      {permissions?.requiresApproval && (
        <OfferBanner
          tone="amber"
          icon={Clock}
          title={pendingCount > 0 ? `${pendingCount} offer${pendingCount === 1 ? "" : "s"} waiting for approval` : "New offers need FinixMart approval"}
          action={
            pendingCount > 0 && tab !== "pending" ? (
              <Button type="button" size="sm" variant="outline" className="h-8 border-amber-300 bg-white text-amber-800 hover:bg-amber-50" onClick={() => changeTab("pending")}>
                View pending
              </Button>
            ) : undefined
          }
        >
          Offers and vouchers you create go live after an admin reviews them. You can keep editing them while they wait.
        </OfferBanner>
      )}

      <VendorOffersAnalytics offers={statOffers} windowSize={STATS_WINDOW} isLoading={stats.isLoading} permissions={permissions} />

      <section className={cn(offerCard, "overflow-hidden")} aria-label="Your offers">
        <div className="flex flex-col gap-3 border-b border-[#EEF2F7] p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <OfferStatusTabs label="Filter offers by status" value={tab} onChange={changeTab} tabs={OFFER_STATUS_TABS} />
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:min-w-[26rem]">
            <OfferSearchInput label="Search offers on this page" value={search} onChange={setSearch} placeholder="Search title, description or code" />
            <OfferSelect label="Filter by offer type" value={type} onChange={changeType} options={TYPE_OPTIONS} />
          </div>
        </div>
        {query && (
          <p className="border-b border-[#EEF2F7] bg-[#FAFBFD] px-4 py-1.5 text-xs text-[#7A90AB]" aria-live="polite">
            {rows.length} match{rows.length === 1 ? "" : "es"} on this page for “{query}”
          </p>
        )}
        <VendorOffersTable
          offers={rows}
          isLoading={list.isLoading}
          isFetching={list.isFetching}
          error={list.isError ? offerErrorMessage(list.error) : null}
          onRetry={() => list.refetch()}
          onEdit={setSelectedOffer}
          empty={
            filtersActive
              ? { title: "No offers match these filters", description: "Try another status, type or search term." }
              : {
                  title: "You haven't created any offers yet",
                  description: "Discounts and voucher codes help customers find and return to your store.",
                  action: canCreateOffer ? <Button type="button" className={offerPrimaryButton} onClick={goCreateOffer}>Create your first offer</Button> : undefined,
                }
          }
        />
        {!list.isError && (
          <OfferPagination page={page} hasNext={hasNextPage(pageRows.length, PAGE_SIZE)} onPage={setPage} shown={rows.length} busy={list.isFetching} />
        )}
      </section>

      <CreateVendorVoucherDialog open={isCreateVoucherDialogOpen} onOpenChange={setIsCreateVoucherDialogOpen} permissions={permissions} />
      <EditVendorOfferDialog offer={selectedOffer} onOpenChange={() => setSelectedOffer(null)} permissions={permissions} />
    </div>
  );
}
