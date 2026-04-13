"use client";

import { useState, useMemo } from "react";
import {
  useGetPublicOffersQuery,
  useApplyVoucherMutation,
  Offer,
  OfferType,
} from "@/features/offerApi";
import Image from "next/image";
import {
  Tag,
  Zap,
  Store,
  Copy,
  Check,
  ChevronDown,
  Search,
  Loader2,
  Ticket,
  BadgePercent,
  ShieldCheck,
  CalendarClock,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function discountLabel(offer: Offer) {
  if (offer.discountType === "PERCENTAGE") return `${offer.discountValue}% off`;
  if (offer.discountType === "FIXED_AMOUNT") return `৳${offer.discountValue} off`;
  if (offer.discountType === "FREE_SHIPPING") return "Free shipping";
  return `${offer.discountValue} off`;
}

function isExpiringSoon(validTo?: string | null) {
  if (!validTo) return false;
  const diff = new Date(validTo).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "platform" | "store" | "collected";

const TAB_LABELS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All vouchers" },
  { id: "platform", label: "Platform" },
  { id: "store", label: "Store" },
  { id: "collected", label: "Collected" },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function VoucherSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse flex">
      <div className="w-2 bg-slate-100 flex-shrink-0" />
      <div className="flex-1 p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-40" />
            <div className="h-3 bg-slate-100 rounded w-56" />
          </div>
          <div className="h-8 w-8 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-3 bg-slate-100 rounded w-32" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 bg-slate-100 rounded w-28" />
          <div className="h-8 w-24 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Voucher Card ─────────────────────────────────────────────────────────────

interface VoucherCardProps {
  offer: Offer;
  isCollected: boolean;
  onCollect: (offer: Offer) => void;
}

function VoucherCard({ offer, isCollected, onCollect }: VoucherCardProps) {
  const [copied, setCopied] = useState(false);
  const code = offer.voucherConfig?.code;
  const expiring = isExpiringSoon(offer.validTo);
  const isPlatform = offer.createdByType === "ADMIN" || offer.createdByType === "SYSTEM";

  const accentColor = isPlatform
    ? "bg-[#0052cc]"
    : "bg-violet-500";

  const badgeBg = isPlatform
    ? "bg-[#0052cc]/10 text-[#0052cc]"
    : "bg-violet-50 text-violet-700";

  const usagePercent =
    offer.totalUsageLimit && offer.totalUsageLimit > 0
      ? Math.min(100, Math.round((offer.currentUsageCount / offer.totalUsageLimit) * 100))
      : null;

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl overflow-hidden flex transition-shadow hover:shadow-sm ${
        isCollected ? "opacity-80" : ""
      }`}
    >
      {/* Left accent stripe */}
      <div className={`w-2 flex-shrink-0 ${accentColor}`} />

      {/* Dashed divider notch */}
      <div className="w-px bg-transparent border-l border-dashed border-slate-200 flex-shrink-0 self-stretch" />

      {/* Body */}
      <div className="flex-1 p-5">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isPlatform ? "bg-[#0052cc]/10" : "bg-violet-50"
            }`}
          >
            {isPlatform ? (
              <ShieldCheck
                className="w-5 h-5 text-[#0052cc]"
                strokeWidth={1.8}
              />
            ) : (
              <Store className="w-5 h-5 text-violet-600" strokeWidth={1.8} />
            )}
          </div>

          {/* Title & badge */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-800 leading-snug truncate">
                {offer.title}
              </h3>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeBg}`}
              >
                {isPlatform ? "Platform" : offer.createdByVendor?.storeName ?? "Store"}
              </span>
              {expiring && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex-shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
                  Expiring soon
                </span>
              )}
              {isCollected && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 flex-shrink-0 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Collected
                </span>
              )}
            </div>
            {offer.description && (
              <p className="text-xs text-slate-500 line-clamp-1">{offer.description}</p>
            )}
          </div>

          {/* Discount pill */}
          <div
            className={`flex-shrink-0 text-sm font-bold px-3 py-1 rounded-xl ${
              isPlatform
                ? "bg-[#0052cc] text-white"
                : "bg-violet-500 text-white"
            }`}
          >
            {discountLabel(offer)}
          </div>
        </div>

        {/* Conditions row */}
        <div className="flex flex-wrap gap-3 mt-3">
          {offer.minOrderAmount && offer.minOrderAmount > 0 ? (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              Min. order ৳{offer.minOrderAmount.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              No minimum order
            </span>
          )}
          {offer.maxDiscountAmount && (
            <span className="text-xs text-slate-500">
              · Up to ৳{offer.maxDiscountAmount.toLocaleString()}
            </span>
          )}
        </div>

        {/* Usage bar */}
        {usagePercent !== null && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-400">
                {offer.currentUsageCount} / {offer.totalUsageLimit} used
              </span>
              <span className="text-[11px] text-slate-400">{usagePercent}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent > 80 ? "bg-red-400" : isPlatform ? "bg-[#0052cc]" : "bg-violet-500"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          {/* Validity */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <CalendarClock className="w-3.5 h-3.5" />
            {offer.validTo
              ? `Valid until ${fmtDate(offer.validTo)}`
              : "No expiry"}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Copy code button */}
            {code && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-500" />
                    <span className="font-mono">{code}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-mono">{code}</span>
                  </>
                )}
              </button>
            )}

            {/* Collect / Collected button */}
            <button
              onClick={() => !isCollected && onCollect(offer)}
              disabled={isCollected}
              className={`text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                isCollected
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : isPlatform
                  ? "bg-[#0052cc] hover:bg-[#0044aa] text-white"
                  : "bg-violet-500 hover:bg-violet-600 text-white"
              }`}
            >
              {isCollected ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Collected
                </>
              ) : (
                <>
                  <Ticket className="w-3.5 h-3.5" /> Collect
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: FilterTab }) {
  const msgs: Record<FilterTab, { title: string; sub: string }> = {
    all: { title: "No vouchers available", sub: "Check back later for great deals." },
    platform: { title: "No platform vouchers", sub: "Platform-wide offers will appear here." },
    store: { title: "No store vouchers", sub: "Vendors haven't published vouchers yet." },
    collected: { title: "No collected vouchers", sub: "Collect vouchers to save them for checkout." },
  };
  const { title, sub } = msgs[tab];
  return (
    <div className="bg-white border border-slate-200 rounded-2xl py-20 flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-[#f5f7f8] flex items-center justify-center">
        <Tag className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

// ─── Sort Select ──────────────────────────────────────────────────────────────

type SortKey = "newest" | "expiring" | "highest";

const SORT_LABELS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "expiring", label: "Expiring soon" },
  { id: "highest", label: "Highest discount" },
];

function sortOffers(offers: Offer[], sort: SortKey): Offer[] {
  return [...offers].sort((a, b) => {
    if (sort === "newest")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "expiring") {
      if (!a.validTo) return 1;
      if (!b.validTo) return -1;
      return new Date(a.validTo).getTime() - new Date(b.validTo).getTime();
    }
    if (sort === "highest") return b.discountValue - a.discountValue;
    return 0;
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VouchersPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useGetPublicOffersQuery({
    type: "VOUCHER",
    isActive: true,
    limit: 50,
  });

  const allVouchers = data?.data ?? [];

  // Split by source
  const platformVouchers = allVouchers.filter(
    (o) => o.createdByType === "ADMIN" || o.createdByType === "SYSTEM"
  );
  const storeVouchers = allVouchers.filter(
    (o) => o.createdByType === "VENDOR"
  );
  const collectedVouchers = allVouchers.filter((o) => collectedIds.has(o.id));

  const sourceMap: Record<FilterTab, Offer[]> = {
    all: allVouchers,
    platform: platformVouchers,
    store: storeVouchers,
    collected: collectedVouchers,
  };

  const counts: Record<FilterTab, number> = {
    all: allVouchers.length,
    platform: platformVouchers.length,
    store: storeVouchers.length,
    collected: collectedVouchers.length,
  };

  const filtered = useMemo(() => {
    let list = sourceMap[activeTab];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.voucherConfig?.code?.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q)
      );
    }
    return sortOffers(list, sort);
  }, [activeTab, allVouchers, collectedIds, search, sort]);

  const handleCollect = (offer: Offer) => {
    setCollectedIds((prev) => {
      const next = new Set(prev);
      next.add(offer.id);
      return next;
    });
    toast.success(`Voucher "${offer.title}" collected!`, {
      description: offer.voucherConfig?.code
        ? `Use code: ${offer.voucherConfig.code} at checkout`
        : "Apply at checkout",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Vouchers</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Collect vouchers and use them at checkout to save on your orders
          </p>
        </div>
        {collectedIds.size > 0 && (
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {collectedIds.size} collected
          </span>
        )}
      </div>

      {/* Stats row */}
      {!isLoading && allVouchers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Platform vouchers", count: platformVouchers.length, icon: ShieldCheck, color: "text-[#0052cc] bg-[#0052cc]/10" },
            { label: "Store vouchers", count: storeVouchers.length, icon: Store, color: "text-violet-600 bg-violet-50" },
            { label: "Collected", count: collectedIds.size, icon: Ticket, color: "text-teal-700 bg-teal-50" },
          ].map(({ label, count, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800 leading-none">{count}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex bg-[#f5f7f8] p-1 rounded-xl gap-0.5 flex-1">
          {TAB_LABELS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? "bg-[#0052cc] text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search + sort row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vouchers or codes..."
            className="w-full pl-9 pr-4 h-10 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/10 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 pl-3 pr-8 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#0052cc] appearance-none bg-white cursor-pointer"
          >
            {SORT_LABELS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Voucher list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <VoucherSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-4">
          {filtered.map((offer) => (
            <VoucherCard
              key={offer.id}
              offer={offer}
              isCollected={collectedIds.has(offer.id)}
              onCollect={handleCollect}
            />
          ))}
        </div>
      )}

      {/* Bottom note */}
      {!isLoading && allVouchers.length > 0 && (
        <p className="text-xs text-slate-400 text-center pb-4">
          Vouchers are applied at checkout · One voucher per order unless stated otherwise
        </p>
      )}
    </div>
  );
}