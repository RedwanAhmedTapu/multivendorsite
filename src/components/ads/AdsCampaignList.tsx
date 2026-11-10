"use client";

// Campaign list shared by "My Advertisements" (vendor) and "Advertisement
// Review" (admin). Data comes from the caller; the isLoading / isError props
// are ready for a real API later. FRONTEND-ONLY for now (sample data).

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, Megaphone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AD_STATUS_LABEL,
  filterAndSortAds,
  formatAdDate,
  paginate,
  type AdCampaign,
  type AdSort,
  type AdStatus,
  type AdStatusFilter,
  type AdTypeFilter,
} from "@/lib/ads/ads-demo";
import { AdStatusBadge, AdTypeBadge, placementText, StoreLogo } from "./AdsShared";

const PAGE_SIZE = 8;

export function AdsCampaignList({
  campaigns,
  isLoading,
  isError,
  onRetry,
  detailHref,
  showVendor = false,
  statusTabs,
  emptyTitle,
  emptyAction,
}: {
  campaigns: AdCampaign[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  detailHref: (id: string) => string;
  showVendor?: boolean;
  statusTabs: AdStatus[];
  emptyTitle: string;
  emptyAction?: React.ReactNode;
}) {
  const [status, setStatus] = React.useState<AdStatusFilter>("ALL");
  const [type, setType] = React.useState<AdTypeFilter>("ALL");
  const [sort, setSort] = React.useState<AdSort>("newest");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => filterAndSortAds(campaigns, { status, type, sort, search }), [campaigns, status, type, sort, search]);
  const view = paginate(filtered, page, PAGE_SIZE);
  React.useEffect(() => setPage(1), [status, type, sort, search]);

  const filtersActive = status !== "ALL" || type !== "ALL" || search.trim() !== "";

  return (
    <div className="rounded-[14px] border-[1.5px] border-[#E5EAF2] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 border-b border-[#F0F4FA] p-4">
        <Tabs value={status} onValueChange={(v) => setStatus(v as AdStatusFilter)}>
          <TabsList className="h-auto flex-wrap justify-start" aria-label="Filter by status">
            <TabsTrigger value="ALL">All</TabsTrigger>
            {statusTabs.map((s) => (
              <TabsTrigger key={s} value={s}>
                {AD_STATUS_LABEL[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={showVendor ? "Search by campaign or store" : "Search campaigns"}
              aria-label={showVendor ? "Search by campaign or store" : "Search campaigns"}
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={(v) => setType(v as AdTypeFilter)}>
            <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by campaign type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="STORE">Store Ads</SelectItem>
              <SelectItem value="PRODUCT">Product Ads</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as AdSort)}>
            <SelectTrigger className="w-full sm:w-[160px]" aria-label="Sort campaigns">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading campaigns">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden />
          <p className="text-[14px] font-semibold text-[#0D1B2E]">Campaigns could not be loaded</p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      ) : view.total === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <Megaphone className="h-8 w-8 text-[#94A3B8]" aria-hidden />
          <p className="text-[14px] font-semibold text-[#0D1B2E]">{filtersActive ? "No campaigns match these filters" : emptyTitle}</p>
          {filtersActive ? (
            <Button
              variant="outline"
              onClick={() => {
                setStatus("ALL");
                setType("ALL");
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          ) : (
            emptyAction
          )}
        </div>
      ) : (
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  {showVendor && <TableHead>Store</TableHead>}
                  <TableHead>Placement</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-semibold text-[#0D1B2E]">{c.title}</div>
                      <div className="mt-1">
                        <AdTypeBadge type={c.type} />
                      </div>
                    </TableCell>
                    {showVendor && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StoreLogo name={c.vendor.storeName} url={c.vendor.logoUrl} size={28} />
                          <span className="text-[13px]">{c.vendor.storeName}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="max-w-[220px] whitespace-normal text-[13px]">{placementText(c.placement, c.categoryName)}</TableCell>
                    <TableCell className="text-[13px]">{c.durationDays} days</TableCell>
                    <TableCell className="text-[13px]">{formatAdDate(c.submittedAt)}</TableCell>
                    <TableCell>
                      <AdStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={detailHref(c.id)} aria-label={`View ${c.title}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile: cards */}
          <ul className="divide-y divide-[#F0F4FA] md:hidden">
            {view.items.map((c) => (
              <li key={c.id}>
                <Link href={detailHref(c.id)} className="block px-4 py-3 focus:bg-[#FAFBFD] focus:outline-none">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-[#0D1B2E]">{c.title}</span>
                    <AdStatusBadge status={c.status} />
                  </div>
                  {showVendor && <p className="mt-1 text-[12.5px] text-[#475569]">{c.vendor.storeName}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-[#7A90AB]">
                    <AdTypeBadge type={c.type} />
                    <span>{placementText(c.placement, c.categoryName)}</span>
                    <span>· {c.durationDays} days</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <nav className="flex items-center justify-between gap-2 border-t border-[#F0F4FA] px-4 py-3 text-[12.5px] text-[#7A90AB]" aria-label="Campaign pages">
            <span>
              {view.total} campaign{view.total === 1 ? "" : "s"} · page {view.page} of {view.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(view.page - 1)} disabled={view.page <= 1} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(view.page + 1)} disabled={view.page >= view.totalPages} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
