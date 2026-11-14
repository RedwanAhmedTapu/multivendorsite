// components/vendor-performance/ExpiryQueue.tsx
//
// "Expiry queue" tab: approved, expiry-bearing documents with no date on file.
// The admin records the date here; the API is idempotent (same date = no write)
// and revives EXPIRY_UNKNOWN / EXPIRED documents when the date is in the future.

"use client";

import * as React from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useGetVendorPerformanceExpiryMissingQuery } from "@/features/vendorPerformanceApi";
import type { ExpiryMissingItem } from "./types";
import { apiErrorText, formatNumber } from "./format";
import {
  Chip,
  EmptyState,
  ErrorState,
  LoadingBlock,
  SetExpiryDialog,
  type ExpiryTarget,
} from "./shared";
import { dateText } from "@/lib/billing/format";

export function ExpiryQueue() {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [target, setTarget] = React.useState<ExpiryTarget | null>(null);
  const { data, isLoading, isError, error, refetch } = useGetVendorPerformanceExpiryMissingQuery({
    page,
    limit,
  });

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4 shadow-sm dark:border-amber-900/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/30">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10"
        />
        <div className="relative flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">
              Documents missing an expiry date
              {data ? (
                <span className="ml-2 rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                  {formatNumber(data.total, 0)}
                </span>
              ) : null}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Approved or expiry-unknown documents of a time-boxed type. Record the date once;
              sending the same date again writes nothing. A future date revives an expired document
              to approved.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingBlock label="Loading expiry queue" rows={5} />
      ) : isError ? (
        <ErrorState
          title="Could not load the expiry queue"
          message={apiErrorText(error, "The expiry queue read failed.").message}
          onRetry={() => refetch()}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No documents missing an expiry date"
          description="Every approved document of a time-boxed type has a date on file."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b bg-gradient-to-r from-amber-50/80 via-white to-orange-50/60 text-left text-[11px] uppercase tracking-wide text-slate-600 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/30 dark:text-slate-300">
                <th className="px-3 py-2 font-medium">Vendor</th>
                <th className="px-3 py-2 font-medium">Document</th>
                <th className="px-3 py-2 font-medium">Verification</th>
                <th className="px-3 py-2 font-medium">Uploaded</th>
                <th className="px-3 py-2 font-medium">Last updated</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: ExpiryMissingItem) => (
                <tr key={item.document.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <p className="font-medium">{item.vendor.storeName}</p>
                    <Chip tone={item.vendor.status === "ACTIVE" ? "emerald" : "slate"}>
                      {item.vendor.status}
                    </Chip>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{item.document.typeLabel}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.document.type.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <Chip tone={item.document.status === "APPROVED" ? "emerald" : "sky"}>
                      {item.document.status.replace(/_/g, " ")}
                    </Chip>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {dateText(item.document.createdAt)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {dateText(item.document.verifiedAt)}
                    <span className="ml-1 text-[10px] text-muted-foreground">(updated)</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTarget({
                          documentId: item.document.id,
                          label: item.document.typeLabel,
                          storeName: item.vendor.storeName,
                          expiresAt: null,
                        })
                      }
                    >
                      Set expiry
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {formatNumber(data.total, 0)} document(s) · page {page} of {data.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={limit === 50}
              onClick={() => {
                setLimit(50);
                setPage(1);
              }}
            >
              Show 50
            </Button>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-xs text-muted-foreground">
                    {page} / {data.totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                    className={
                      page === data.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      ) : null}

      <SetExpiryDialog target={target} onClose={() => setTarget(null)} />
    </div>
  );
}
