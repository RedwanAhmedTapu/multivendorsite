"use client";

// Admin "Advertisement Review" screens. FRONTEND-ONLY: the queue is sample
// data from lib/ads/ads-demo.ts; Approve / Reject change local state only and
// are lost on reload. No API is called and no campaign is updated.
//
// Access display (UI only — NOT security enforcement): ADMIN sees these
// screens. Admin-side employees will need a dedicated permission (proposed:
// `adApproval`), which is not part of the permission system yet — so they see
// an explanation instead. Real enforcement belongs to the future API.

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Eye, FileText, MessageSquare, Package, Store, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/ui/section-card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePermissions } from "@/hooks/usePermissions";
import {
  adSummary,
  applyDemoReview,
  demoAdminCampaigns,
  formatAdDate,
  MAX_REJECTION_REASON,
  type AdCampaign,
} from "@/lib/ads/ads-demo";
import { AccessNotice, AdCreativePreview, AdStatusBadge, CampaignFacts, DemoNotice, ProductThumb, StoreLogo, SummaryCards } from "./AdsShared";
import { AdsCampaignList } from "./AdsCampaignList";

function AdminAdsGate({ children }: { children: React.ReactNode }) {
  const { isLoading, role } = usePermissions();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (role !== "ADMIN") {
    return (
      <AccessNotice title="Advertisement review is limited to administrators for now">
        Staff access will use a dedicated advertisement-approval permission once it is added to employee permissions. Until then, an administrator reviews campaigns.
      </AccessNotice>
    );
  }
  return <>{children}</>;
}

function useDemoAdminAds() {
  const [campaigns, setCampaigns] = React.useState<AdCampaign[] | null>(null);
  React.useEffect(() => setCampaigns(demoAdminCampaigns()), []);
  return { campaigns: campaigns ?? [], isLoading: campaigns === null, setCampaigns };
}

export function AdminAdsListScreen() {
  return (
    <AdminAdsGate>
      <AdminAdsList />
    </AdminAdsGate>
  );
}

function AdminAdsList() {
  const { campaigns, isLoading } = useDemoAdminAds();
  const s = adSummary(campaigns);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0D1B2E]">Advertisement Review</h1>
        <p className="text-[13px] text-[#7A90AB]">Review vendor Store Ads and Product Ads before they can be paid for and go live.</p>
      </div>
      <DemoNotice>
        Advertising is not live yet. The queue below is sample data, and approving or rejecting only changes this page until you reload. No vendor is notified and no campaign is updated.
      </DemoNotice>
      <SummaryCards
        items={[
          { label: "Pending", value: s.pendingReview, tone: "amber", hint: "Sample data" },
          { label: "Approved", value: s.approved, tone: "green", hint: "Awaiting vendor payment" },
          { label: "Rejected", value: s.rejected, tone: "red", hint: "Sample data" },
          { label: "Total", value: s.total, hint: "Sample data" },
        ]}
      />
      <AdsCampaignList
        campaigns={campaigns}
        isLoading={isLoading}
        showVendor
        detailHref={(id) => `/admin-dashboard/advertisements/${id}`}
        statusTabs={["PENDING_REVIEW", "PAYMENT_PENDING", "REJECTED"]}
        emptyTitle="No campaigns are waiting for review"
      />
    </div>
  );
}

export function AdminAdReviewScreen({ id }: { id: string }) {
  return (
    <AdminAdsGate>
      <AdminAdReview id={id} />
    </AdminAdsGate>
  );
}

function AdminAdReview({ id }: { id: string }) {
  const { campaigns, isLoading, setCampaigns } = useDemoAdminAds();
  const [note, setNote] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [confirm, setConfirm] = React.useState<null | "approve" | "reject">(null);
  const [error, setError] = React.useState<string | null>(null);
  const [decidedInDemo, setDecidedInDemo] = React.useState(false);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  const c = campaigns.find((x) => x.id === id);
  if (!c) {
    return (
      <div className="space-y-3 rounded-[14px] border-[1.5px] border-[#E5EAF2] bg-white p-8 text-center">
        <p className="text-[14px] font-semibold text-[#0D1B2E]">Campaign not found</p>
        <Button asChild variant="outline">
          <Link href="/admin-dashboard/advertisements">Back to Advertisement Review</Link>
        </Button>
      </div>
    );
  }

  const pending = c.status === "PENDING_REVIEW";
  const reasonMissing = !reason.trim();

  const decide = () => {
    if (!confirm) return;
    const r = applyDemoReview(c, confirm === "approve" ? { decision: "approve", note } : { decision: "reject", reason, note });
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setCampaigns((list) => (list ?? []).map((x) => (x.id === c.id ? r.campaign : x)));
    setDecidedInDemo(true);
    setError(null);
    setConfirm(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin-dashboard/advertisements" className="text-[12.5px] font-medium text-[#1e40af] hover:underline">
          ← Advertisement Review
        </Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold text-[#0D1B2E]">
          {c.title} <AdStatusBadge status={c.status} />
        </h1>
        <p className="text-[12.5px] text-[#7A90AB]">Submitted {formatAdDate(c.submittedAt)}</p>
      </div>
      <DemoNotice>Sample campaign. Approve and Reject only change this page and are lost when you reload; nothing is saved and the vendor is not notified.</DemoNotice>
      {decidedInDemo && (
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-blue-900">
          Demo decision recorded on this page only — not saved.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="space-y-4">
          <SectionCard icon={<Store className="h-4 w-4" />} title="Vendor">
            <div className="flex items-center gap-3">
              <StoreLogo name={c.vendor.storeName} url={c.vendor.logoUrl} size={40} />
              <div>
                <p className="text-[13.5px] font-semibold text-[#0D1B2E]">{c.vendor.storeName}</p>
                <p className="text-[11.5px] text-[#7A90AB]">Sample store</p>
              </div>
            </div>
          </SectionCard>
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
          {c.review && (
            <SectionCard icon={<MessageSquare className="h-4 w-4" />} title="Review" subtitle={`Decided ${formatAdDate(c.review.decidedAt)}`}>
              {c.review.rejectionReason && <p className="text-[13px] text-red-700">Rejection reason: {c.review.rejectionReason}</p>}
              {c.review.note && <p className="mt-1 text-[13px] text-[#334155]">Reviewer note: {c.review.note}</p>}
              {!c.review.rejectionReason && !c.review.note && <p className="text-[13px] text-[#7A90AB]">No note.</p>}
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard icon={<Eye className="h-4 w-4" />} title="Creative preview">
            <AdCreativePreview type={c.type} storeName={c.vendor.storeName} logoUrl={c.vendor.logoUrl} headline={c.headline} bannerUrl={c.bannerUrl} products={c.products} />
          </SectionCard>
          {pending ? (
            <SectionCard icon={<CheckCircle2 className="h-4 w-4" />} title="Decision" subtitle="Demo only — not saved">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="review-note">Reviewer note (optional)</Label>
                  <Textarea id="review-note" className="mt-1.5" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible to the vendor" />
                </div>
                <div>
                  <Label htmlFor="review-reason">Rejection reason (required to reject)</Label>
                  <Textarea
                    id="review-reason"
                    className="mt-1.5"
                    rows={3}
                    maxLength={MAX_REJECTION_REASON}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    aria-describedby="review-reason-hint"
                    placeholder="Explain what the vendor needs to change"
                  />
                  <p id="review-reason-hint" className="mt-1 text-[11px] text-[#7A90AB]">
                    {reason.trim().length}/{MAX_REJECTION_REASON}
                  </p>
                </div>
                {error && (
                  <p role="alert" className="text-[12px] font-medium text-red-600">
                    {error}
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="flex-1" onClick={() => setConfirm("approve")}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden /> Approve
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    disabled={reasonMissing}
                    aria-describedby={reasonMissing ? "reject-disabled-hint" : undefined}
                    onClick={() => setConfirm("reject")}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" aria-hidden /> Reject
                  </Button>
                </div>
                {reasonMissing && (
                  <p id="reject-disabled-hint" className="text-[11px] text-[#7A90AB]">
                    Enter a rejection reason to enable Reject.
                  </p>
                )}
              </div>
            </SectionCard>
          ) : (
            <AccessNotice title="No decision needed">This campaign is not pending review.</AccessNotice>
          )}
        </div>
      </div>

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm === "approve" ? "Approve this campaign? (demo)" : "Reject this campaign? (demo)"}</DialogTitle>
            <DialogDescription>
              {confirm === "approve"
                ? "In the live feature, approval would ask the vendor to pay before the campaign starts. Here it only changes this page — nothing is saved and the vendor is not notified."
                : `Reason: “${reason.trim()}”. Here the rejection only changes this page — nothing is saved and the vendor is not notified.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant={confirm === "reject" ? "destructive" : "default"} onClick={decide}>
              {confirm === "approve" ? "Approve (demo)" : "Reject (demo)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
