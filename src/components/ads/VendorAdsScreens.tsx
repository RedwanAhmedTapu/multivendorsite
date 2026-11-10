"use client";

// Vendor "My Advertisements" screens. FRONTEND-ONLY: campaigns are sample
// records from lib/ads/ads-demo.ts and nothing is persisted.
//
// Access display (UI only — NOT security enforcement): the vendor owner sees
// these screens. Vendor staff would need the backend's vendor-only
// `adManagement` permission, which the frontend permission types do not
// carry yet, so staff see an explanation instead. Real enforcement belongs to
// the future advertisement API (requireVendorPermission("adManagement")).

import * as React from "react";
import Link from "next/link";
import { CreditCard, Eye, FileText, MessageSquare, Package, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { usePermissions } from "@/hooks/usePermissions";
import {
  adSummary,
  adToForm,
  canVendorEdit,
  demoVendorCampaigns,
  emptyAdForm,
  formatAdDate,
  type AdCampaign,
} from "@/lib/ads/ads-demo";
import { AccessNotice, AdCreativePreview, AdStatusBadge, CampaignFacts, DemoNotice, ProductThumb, SummaryCards } from "./AdsShared";
import { AdsCampaignList } from "./AdsCampaignList";
import { VendorAdForm } from "./VendorAdForm";

/** Owner-only display gate. Returns the store name for the screens. */
function VendorAdsGate({ children }: { children: (storeName: string) => React.ReactNode }) {
  const { me, isLoading, role } = usePermissions();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (role !== "VENDOR") {
    return (
      <AccessNotice title="Advertisements are managed by the store owner">
        Staff access to advertisements will need the store owner to grant an advertising permission. That option is not available yet, so please ask the store owner.
      </AccessNotice>
    );
  }
  return <>{children(me?.name || "Your store")}</>;
}

/** Sample campaigns, "loaded" after mount so the loading state is exercised the
 *  same way a real request would be. */
function useDemoVendorAds(storeName: string) {
  const [campaigns, setCampaigns] = React.useState<AdCampaign[] | null>(null);
  React.useEffect(() => setCampaigns(demoVendorCampaigns(storeName)), [storeName]);
  return { campaigns: campaigns ?? [], isLoading: campaigns === null };
}

export function VendorAdsListScreen() {
  return <VendorAdsGate>{(storeName) => <VendorAdsList storeName={storeName} />}</VendorAdsGate>;
}

function VendorAdsList({ storeName }: { storeName: string }) {
  const { campaigns, isLoading } = useDemoVendorAds(storeName);
  const s = adSummary(campaigns);
  const create = (
    <Button asChild>
      <Link href="/vendor-dashboard/advertisements/create">
        <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Create Advertisement
      </Link>
    </Button>
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0D1B2E]">My Advertisements</h1>
          <p className="text-[13px] text-[#7A90AB]">Promote your store or products on the homepage and category pages.</p>
        </div>
        {create}
      </div>
      <DemoNotice />
      <SummaryCards
        items={[
          { label: "Total Campaigns", value: s.total, hint: "Sample data" },
          { label: "Pending Review", value: s.pendingReview, tone: "amber", hint: "Sample data" },
          { label: "Approved", value: s.approved, tone: "green", hint: "Sample data" },
          { label: "Payment Pending", value: s.paymentPending, tone: "blue", hint: "Sample data" },
        ]}
      />
      <AdsCampaignList
        campaigns={campaigns}
        isLoading={isLoading}
        detailHref={(id) => `/vendor-dashboard/advertisements/${id}`}
        statusTabs={["DRAFT", "PENDING_REVIEW", "PAYMENT_PENDING", "REJECTED"]}
        emptyTitle="You have no advertisement campaigns yet"
        emptyAction={create}
      />
    </div>
  );
}

function NotFound() {
  return (
    <div className="space-y-3 rounded-[14px] border-[1.5px] border-[#E5EAF2] bg-white p-8 text-center">
      <p className="text-[14px] font-semibold text-[#0D1B2E]">Campaign not found</p>
      <Button asChild variant="outline">
        <Link href="/vendor-dashboard/advertisements">Back to My Advertisements</Link>
      </Button>
    </div>
  );
}

export function VendorAdDetailsScreen({ id }: { id: string }) {
  return <VendorAdsGate>{(storeName) => <VendorAdDetails id={id} storeName={storeName} />}</VendorAdsGate>;
}

function VendorAdDetails({ id, storeName }: { id: string; storeName: string }) {
  const { campaigns, isLoading } = useDemoVendorAds(storeName);
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  const c = campaigns.find((x) => x.id === id);
  if (!c) return <NotFound />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/vendor-dashboard/advertisements" className="text-[12.5px] font-medium text-[#1e40af] hover:underline">
            ← My Advertisements
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold text-[#0D1B2E]">
            {c.title} <AdStatusBadge status={c.status} />
          </h1>
          <p className="text-[12.5px] text-[#7A90AB]">
            Submitted {formatAdDate(c.submittedAt)} · last updated {formatAdDate(c.updatedAt)}
          </p>
        </div>
        {canVendorEdit(c.status) && (
          <Button asChild variant="outline">
            <Link href={`/vendor-dashboard/advertisements/${c.id}/edit`}>Edit campaign</Link>
          </Button>
        )}
      </div>
      <DemoNotice />

      {c.status === "REJECTED" && c.review?.rejectionReason && (
        <div role="note" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          <p className="font-semibold">Rejected on {formatAdDate(c.review.decidedAt)}</p>
          <p className="mt-0.5">Reason: {c.review.rejectionReason}</p>
          <p className="mt-1 text-red-700">You can edit the campaign and submit it again.</p>
        </div>
      )}
      {c.status === "PAYMENT_PENDING" && (
        <SectionCard icon={<CreditCard className="h-4 w-4" />} title="Payment" subtitle="Approved — payment comes next">
          <p className="text-[13px] text-[#334155]">
            This campaign was approved{c.review?.decidedAt ? ` on ${formatAdDate(c.review.decidedAt)}` : ""}. It starts once payment is completed.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button disabled aria-describedby="pay-placeholder-note">
              Pay now
            </Button>
            <p id="pay-placeholder-note" className="text-[12px] text-[#7A90AB]">
              Placeholder — online payment for advertisements is not available yet. No amount is shown or charged.
            </p>
          </div>
        </SectionCard>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="space-y-4">
          <SectionCard icon={<FileText className="h-4 w-4" />} title="Campaign">
            <CampaignFacts campaign={c} />
          </SectionCard>
          {c.type === "PRODUCT" && (
            <SectionCard icon={<Package className="h-4 w-4" />} title="Selected products" subtitle={`${c.products.length} product${c.products.length === 1 ? "" : "s"}`}>
              <ul className="divide-y divide-[#F0F4FA]">
                {c.products.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2">
                    <ProductThumb product={p} size={40} />
                    <span className="text-[13px] text-[#0D1B2E]">{p.name}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
          {c.review?.note && (
            <SectionCard icon={<MessageSquare className="h-4 w-4" />} title="Review note">
              <p className="text-[13px] text-[#334155]">{c.review.note}</p>
            </SectionCard>
          )}
        </div>
        <SectionCard icon={<Eye className="h-4 w-4" />} title="Creative preview">
          <AdCreativePreview type={c.type} storeName={c.vendor.storeName} logoUrl={c.vendor.logoUrl} headline={c.headline} bannerUrl={c.bannerUrl} products={c.products} />
        </SectionCard>
      </div>
    </div>
  );
}

export function VendorAdCreateScreen() {
  return <VendorAdsGate>{(storeName) => <VendorAdForm mode="create" initial={emptyAdForm()} storeName={storeName} />}</VendorAdsGate>;
}

export function VendorAdEditScreen({ id }: { id: string }) {
  return <VendorAdsGate>{(storeName) => <VendorAdEdit id={id} storeName={storeName} />}</VendorAdsGate>;
}

function VendorAdEdit({ id, storeName }: { id: string; storeName: string }) {
  const { campaigns, isLoading } = useDemoVendorAds(storeName);
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  const c = campaigns.find((x) => x.id === id);
  if (!c) return <NotFound />;
  if (!canVendorEdit(c.status)) {
    return (
      <AccessNotice title="This campaign can't be edited">
        Only drafts and rejected campaigns can be edited. <Link className="font-medium text-[#1e40af] underline" href={`/vendor-dashboard/advertisements/${c.id}`}>Back to the campaign</Link>
      </AccessNotice>
    );
  }
  return <VendorAdForm mode="edit" initial={adToForm(c)} storeName={storeName} />;
}
