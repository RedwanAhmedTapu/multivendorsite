// components/offers/shared/offer-list-table.tsx
//
// The offer listing used by both dashboards: a table from md up and stacked
// cards on phones. Row actions are supplied by the caller (admin and vendor
// are allowed different things), so this file never decides permissions.

"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Gift, Store, Ticket, Timer, Zap, Percent } from "lucide-react";
import type { Offer } from "@/features/offerApi";
import { cn } from "@/lib/utils";
import {
  describeValidity,
  formatOfferDiscount,
  formatTaka,
  formatUsage,
  getOfferDisplayStatus,
  usagePercent,
} from "@/lib/offers/offer-view";
import {
  OfferEmptyState,
  OfferErrorState,
  OfferStatusBadge,
  OfferTableSkeleton,
  OfferTypeBadge,
  UsageMeter,
  VoucherCode,
} from "./offer-ui";

const TYPE_ICON: Record<string, LucideIcon> = {
  VOUCHER: Ticket,
  FLASH_SALE: Zap,
  COUNTDOWN_DEAL: Timer,
  REGULAR_DISCOUNT: Percent,
};

function OfferThumb({ offer }: { offer: Offer }) {
  const Icon = TYPE_ICON[offer.type] ?? Gift;
  if (offer.bannerImage && /^https?:\/\//i.test(offer.bannerImage)) {
    return (
      <img src={offer.bannerImage} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-[#E5EAF2]" loading="lazy" />
    );
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 ring-1 ring-indigo-100">
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

function CreatorCell({ offer }: { offer: Offer }) {
  if (offer.createdByType === "VENDOR") {
    const name = (offer.createdByVendor as { storeName?: string } | undefined)?.storeName;
    return (
      <span className="inline-flex max-w-[11rem] items-center gap-1 truncate text-xs text-[#3D5068]">
        <Store className="h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden />
        <span className="truncate">{name || "Vendor"}</span>
      </span>
    );
  }
  return <span className="text-xs text-[#3D5068]">{offer.createdByType === "SYSTEM" ? "System" : "Admin"}</span>;
}

export interface OfferListTableProps {
  offers: Offer[];
  isLoading: boolean;
  isFetching?: boolean;
  error?: string | null;
  onRetry?: () => void;
  renderActions: (offer: Offer) => React.ReactNode;
  showCreator?: boolean;
  empty: { title: string; description?: string; action?: React.ReactNode };
  footer?: React.ReactNode;
  now?: Date;
}

export function OfferListTable({
  offers,
  isLoading,
  isFetching,
  error,
  onRetry,
  renderActions,
  showCreator = false,
  empty,
  footer,
  now = new Date(),
}: OfferListTableProps) {
  if (isLoading) return <OfferTableSkeleton cols={showCreator ? 7 : 6} />;
  if (error) return <OfferErrorState message={error} onRetry={onRetry} />;
  if (offers.length === 0) return <OfferEmptyState icon={Gift} {...empty} />;

  return (
    <div className={cn("transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching || undefined}>
      {/* md+ : table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#EEF2F7] bg-[#FAFBFD] text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A90AB]">
              <th scope="col" className="px-4 py-2.5">Offer</th>
              <th scope="col" className="px-3 py-2.5">Discount</th>
              <th scope="col" className="px-3 py-2.5">Status</th>
              <th scope="col" className="px-3 py-2.5">Usage</th>
              <th scope="col" className="px-3 py-2.5">Validity</th>
              {showCreator && <th scope="col" className="px-3 py-2.5">Created by</th>}
              <th scope="col" className="px-4 py-2.5 text-right"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F7]">
            {offers.map((offer) => {
              const status = getOfferDisplayStatus(offer, now);
              const validity = describeValidity(offer, now);
              const pct = usagePercent(offer);
              return (
                <tr key={offer.id} className="group align-top transition-colors hover:bg-[#F8FAFE]">
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <OfferThumb offer={offer} />
                      <div className="min-w-0">
                        <p className="max-w-[18rem] truncate font-semibold text-[#0D1B2E]" title={offer.title}>{offer.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <OfferTypeBadge type={offer.type} />
                          {offer.voucherConfig?.code && <VoucherCode code={offer.voucherConfig.code} />}
                          {!offer.isPublic && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">Private</span>}
                        </div>
                        {offer.description && <p className="mt-1 line-clamp-1 max-w-[18rem] text-xs text-[#7A90AB]">{offer.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="whitespace-nowrap font-medium text-[#0D1B2E]">{formatOfferDiscount(offer)}</p>
                    {(offer.minOrderAmount ?? 0) > 0 && <p className="mt-0.5 whitespace-nowrap text-xs text-[#7A90AB]">Min. order {formatTaka(offer.minOrderAmount)}</p>}
                  </td>
                  <td className="px-3 py-3"><OfferStatusBadge status={status} /></td>
                  <td className="px-3 py-3">
                    <p className="whitespace-nowrap tabular-nums text-[#0D1B2E]">{formatUsage(offer)}</p>
                    {pct !== null && <UsageMeter percent={pct} />}
                    {(offer.userUsageLimit ?? 0) > 0 && <p className="mt-0.5 whitespace-nowrap text-[11px] text-[#7A90AB]">{offer.userUsageLimit} per customer</p>}
                  </td>
                  <td className="px-3 py-3">
                    <p className={cn("whitespace-nowrap", status === "expired" ? "text-rose-500" : "text-[#0D1B2E]")}>{validity.primary}</p>
                    {validity.hint && <p className={cn("mt-0.5 whitespace-nowrap text-xs", /left$/.test(validity.hint) ? "font-medium text-orange-600" : "text-[#7A90AB]")}>{validity.hint}</p>}
                  </td>
                  {showCreator && <td className="px-3 py-3"><CreatorCell offer={offer} /></td>}
                  <td className="px-4 py-2.5 text-right">{renderActions(offer)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* phones : cards */}
      <ul className="divide-y divide-[#EEF2F7] md:hidden">
        {offers.map((offer) => {
          const status = getOfferDisplayStatus(offer, now);
          const validity = describeValidity(offer, now);
          const pct = usagePercent(offer);
          return (
            <li key={offer.id} className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <OfferThumb offer={offer} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-semibold text-[#0D1B2E]">{offer.title}</p>
                    <div className="-mr-2 -mt-1 shrink-0">{renderActions(offer)}</div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <OfferStatusBadge status={status} />
                    <OfferTypeBadge type={offer.type} />
                    {offer.voucherConfig?.code && <VoucherCode code={offer.voucherConfig.code} />}
                  </div>
                  <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div><dt className="text-[#7A90AB]">Discount</dt><dd className="font-medium text-[#0D1B2E]">{formatOfferDiscount(offer)}</dd></div>
                    <div>
                      <dt className="text-[#7A90AB]">Usage</dt>
                      <dd className="tabular-nums text-[#0D1B2E]">{formatUsage(offer)}</dd>
                      {pct !== null && <UsageMeter percent={pct} />}
                    </div>
                    <div className="col-span-2"><dt className="sr-only">Validity</dt><dd className={status === "expired" ? "text-rose-500" : "text-[#3D5068]"}>{validity.primary}{validity.hint ? ` · ${validity.hint}` : ""}</dd></div>
                    {showCreator && <div className="col-span-2"><dt className="sr-only">Created by</dt><dd><CreatorCell offer={offer} /></dd></div>}
                  </dl>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {footer}
    </div>
  );
}
