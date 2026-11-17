// components/vendor-management/VendorDrawer.tsx
"use client";

// Slide-over audit dossier for one vendor. Every value comes from the existing
// vendor APIs: the complete-profile endpoint (identity, address, documents,
// plan, onboarding, performance) plus the commission-history / payout endpoints
// loaded lazily per tab. Sections the API does not expose (SLA health, risk
// score, POS hardware) are deliberately absent instead of mocked.

import { useState } from "react";
import type { ComponentType } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Percent,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetCommissionHistoryQuery,
  useGetCompleteVendorProfileQuery,
  useGetPayoutSummaryQuery,
  useGetVendorPayoutsQuery,
  useRejectVendorVerificationMutation,
  useVerifyVendorVerificationMutation,
  type CompleteVendorProfile,
} from "@/features/vendorManageApi";
import {
  commissionRows,
  documentHref,
  documentTypeLabel,
  formatDate,
  formatMoney,
  fulfillmentLabel,
  KYC_STATUS_LABEL,
  payoutRows,
  planLabel,
  ratingLabel,
  vendorCode,
  vendorInitials,
  type KycStatus,
} from "@/lib/vendor-directory";

export type DrawerTab = "overview" | "kyc" | "commission" | "payout";

const TABS: { key: DrawerTab; label: string }[] = [
  { key: "overview", label: "Overview & Dossier" },
  { key: "kyc", label: "KYC Documents" },
  { key: "commission", label: "Commission Matrix" },
  { key: "payout", label: "Payout Ledger" },
];

const DOC_STATUS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  EXPIRED: "bg-slate-100 text-slate-600 border-slate-200",
};

const KYC_CHIP: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  SUSPENDED: "bg-slate-100 text-slate-600 border-slate-200",
};

function Chip({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {children}
    </span>
  );
}

function Info({ label, value, mono = false }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] text-slate-400">{label}</dt>
      <dd className={`mt-0.5 font-medium text-slate-800 ${mono ? "font-mono text-xs" : "text-xs"}`}>{value || "—"}</dd>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: ComponentType<{ size?: number; className?: string }>; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon size={12} /> {label}
      </div>
      <div className="mt-1 text-base font-extrabold text-slate-900">{value}</div>
      {hint && <div className="text-[10px] text-slate-400">{hint}</div>}
    </div>
  );
}

function Section({ title, icon: Icon, action, children }: { title: string; icon: ComponentType<{ size?: number; className?: string }>; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
          <Icon size={14} className="text-indigo-600" /> {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function VendorDrawer({
  vendorId,
  initialTab = "overview",
  onClose,
  onChanged,
  onEdit,
  onConfigureCommission,
  onChangePlan,
}: {
  vendorId: string;
  initialTab?: DrawerTab;
  onClose: () => void;
  onChanged: () => void;
  onEdit: (vendor: CompleteVendorProfile) => void;
  onConfigureCommission: (vendor: CompleteVendorProfile) => void;
  onChangePlan: (vendor: CompleteVendorProfile) => void;
}) {
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const { data: profile, isLoading, isError, refetch } = useGetCompleteVendorProfileQuery(vendorId);
  const { data: commissionRaw, isLoading: commissionLoading } = useGetCommissionHistoryQuery(vendorId, { skip: tab !== "commission" });
  const { data: payoutsRaw, isLoading: payoutsLoading } = useGetVendorPayoutsQuery(vendorId, { skip: tab !== "payout" });
  const { data: summaryRaw } = useGetPayoutSummaryQuery(vendorId, { skip: tab !== "payout" });

  const [verifyVendor, { isLoading: verifying }] = useVerifyVendorVerificationMutation();
  const [rejectVendor, { isLoading: rejecting }] = useRejectVendorVerificationMutation();

  const kyc = (profile?.verificationStatus ?? "PENDING") as KycStatus;
  const isVerified = kyc === "VERIFIED";

  const commissions = commissionRows(commissionRaw);
  const payouts = payoutRows(payoutsRaw);
  const summary = ((summaryRaw as { data?: unknown } | undefined)?.data ?? summaryRaw) as
    | { totalPaid?: number; totalPending?: number; currentBalance?: number; lastPayoutDate?: string }
    | undefined;

  const afterAction = async (message: string) => {
    toast.success(message);
    await refetch();
    onChanged();
  };

  const approveKyc = async () => {
    try {
      await verifyVendor({ vendorId }).unwrap();
      await afterAction("KYC approved");
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Could not approve KYC");
    }
  };

  const rejectKyc = async () => {
    if (!reason.trim()) {
      toast.error("A rejection reason is required");
      return;
    }
    try {
      await rejectVendor({ vendorId, rejectionReason: reason.trim() }).unwrap();
      setRejectOpen(false);
      setReason("");
      await afterAction("KYC rejected");
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Could not reject KYC");
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={profile ? `${profile.storeName} details` : "Vendor details"}
        className="absolute inset-y-0 right-0 flex h-full w-full flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] sm:max-w-xl"
      >
        {/* header */}
        <div className="shrink-0 border-b border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                Audit Dossier · KYC &amp; Compliance
              </span>
              <Chip tone={KYC_CHIP[kyc] ?? KYC_CHIP.PENDING}>{KYC_STATUS_LABEL[kyc] ?? kyc}</Chip>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close vendor drawer"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>

          {profile ? (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-lg font-bold text-white">
                  {vendorInitials(profile.storeName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-bold leading-tight tracking-tight text-slate-900">{profile.storeName}</h3>
                    <span className="font-mono text-xs text-slate-400">{vendorCode(profile.id)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {profile.accountType === "BUSINESS" ? "Business account" : "Individual seller"} · Joined {formatDate(profile.createdAt)} · {profile.user?.phone || profile.user?.email || "No contact"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(profile)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <Pencil size={12} /> Edit
                </button>
                {!isVerified && (
                  <button
                    type="button"
                    onClick={approveKyc}
                    disabled={verifying}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {verifying ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />} Approve KYC
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-10 w-56 animate-pulse rounded-lg bg-slate-100" />
          )}

          <div role="tablist" aria-label="Vendor dossier sections" className="mt-4 flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pt-1 text-xs font-semibold">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap border-b-2 px-2.5 pb-2 transition-colors ${
                  tab === t.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
                {t.key === "kyc" && profile?.documents?.length ? (
                  <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">{profile.documents.length}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin" /> Loading dossier…
            </div>
          )}

          {isError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
              Could not load this vendor.{" "}
              <button type="button" onClick={() => refetch()} className="font-bold underline">
                Retry
              </button>
            </div>
          )}

          {profile && tab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <StatCard icon={BadgeCheck} label="Merchant Plan" value={planLabel(profile.subscription?.planType)} hint={profile.subscription?.isActive === false ? "Inactive" : "Subscription"} />
                <StatCard icon={CheckCircle2} label="Fulfillment" value={fulfillmentLabel(profile.performance?.fulfillmentRatePct)} hint="Lifetime rate" />
                <StatCard icon={Users} label="Orders" value={String(profile.performance?.totalOrders ?? 0)} hint="All time" />
                <StatCard icon={Package} label="Products" value={String(profile._count?.products ?? 0)} hint="In catalog" />
              </div>

              <Section title="Store owner & physical address" icon={Building2}>
                <dl className="grid grid-cols-2 gap-3">
                  <Info label="Legal proprietor" value={profile.personalInfo?.idName || profile.personalInfo?.companyName} />
                  <Info label="National ID" value={profile.personalInfo?.idNumber} mono />
                  <Info label="TIN" value={profile.personalInfo?.taxIdNumber} mono />
                  <Info label="Business reg. no" value={profile.personalInfo?.businessRegNo} mono />
                  <Info label="Official phone" value={profile.user?.phone} mono />
                  <Info label="Merchant email" value={profile.user?.email} />
                  <div className="col-span-2 border-t border-slate-100 pt-2">
                    <dt className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin size={11} /> Physical shop / outlet
                    </dt>
                    <dd className="mt-0.5 text-xs font-medium text-slate-700">
                      {[
                        profile.pickupAddress?.detailsAddress,
                        profile.pickupAddress?.area,
                        profile.pickupAddress?.zone,
                        profile.pickupAddress?.city,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </dd>
                  </div>
                </dl>
              </Section>

              <Section
                title="Commercial snapshot"
                icon={Star}
                action={<Chip tone="bg-indigo-50 text-indigo-700 border-indigo-200">{planLabel(profile.subscription?.planType)} plan</Chip>}
              >
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Info label="Lifetime GMV" value={<span className="font-bold">{formatMoney(profile.performance?.totalSales)}</span>} />
                  <Info label="Average rating" value={ratingLabel(profile.performance?.avgRating)} />
                  <Info label="Commission" value={`${Number(profile.currentCommissionRate) || 0}%`} />
                  <Info label="Joined" value={formatDate(profile.createdAt)} />
                  <Info label="Open flags" value={String(profile._count?.flags ?? 0)} />
                  <Info label="Store status" value={profile.status} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onChangePlan(profile)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Change subscription plan
                  </button>
                  <button
                    type="button"
                    onClick={() => onConfigureCommission(profile)}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    Configure commission
                  </button>
                </div>
              </Section>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-[11px] text-slate-500">
                SLA health, dispatch latency, risk score and POS terminal telemetry are not exposed by the vendor API, so they are not shown here.
              </div>
            </>
          )}

          {profile && tab === "kyc" && (
            <>
              <Section
                title={`KYC & legal verification (${profile.documents?.length ?? 0})`}
                icon={FileText}
                action={<Chip tone={KYC_CHIP[kyc] ?? KYC_CHIP.PENDING}>{KYC_STATUS_LABEL[kyc] ?? kyc}</Chip>}
              >
                {profile.rejectionReason && kyc !== "VERIFIED" && (
                  <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-700">
                    Last rejection: {profile.rejectionReason}
                  </p>
                )}
                {profile.documents?.length ? (
                  <ul className="space-y-2">
                    {profile.documents.map((doc) => {
                      const href = documentHref(doc.filePath);
                      return (
                        <li key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-xs font-semibold text-slate-800">{doc.title || documentTypeLabel(doc.type)}</span>
                                <Chip tone={DOC_STATUS[doc.verificationStatus] ?? DOC_STATUS.PENDING}>{doc.verificationStatus.replace(/_/g, " ")}</Chip>
                              </div>
                              <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                                {documentTypeLabel(doc.type)} · Uploaded {formatDate(doc.createdAt)}
                              </span>
                            </div>
                          </div>
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                            >
                              Open
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">No link</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-400">
                    No KYC documents uploaded for this vendor.
                  </p>
                )}
              </Section>

              <Section title="Onboarding checklist" icon={ShieldCheck}>
                <ul className="space-y-1.5 text-xs">
                  {[
                    ["Personal info", profile.onboarding?.personalInfoComplete],
                    ["Pickup address", profile.onboarding?.addressComplete],
                    ["Bank information", profile.onboarding?.bankInfoComplete],
                    ["Documents", profile.onboarding?.documentsComplete],
                  ].map(([label, done]) => (
                    <li key={String(label)} className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-1.5">
                      <span className="text-slate-600">{label}</span>
                      {done ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <CheckCircle2 size={12} /> Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                          <XCircle size={12} /> Pending
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}

          {profile && tab === "commission" && (
            <Section
              title="Commission matrix"
              icon={Percent}
              action={
                <button
                  type="button"
                  onClick={() => onConfigureCommission(profile)}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Configure
                </button>
              }
            >
              <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2">
                <span className="text-[11px] text-slate-500">Store-wide rate</span>
                <span className="text-sm font-extrabold text-slate-900">{Number(profile.currentCommissionRate) || 0}%</span>
              </div>
              {commissionLoading ? (
                <p className="py-6 text-center text-xs text-slate-400">Loading commission rules…</p>
              ) : commissions.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
                        <th className="py-2 pr-2 font-semibold">Category</th>
                        <th className="py-2 pr-2 font-semibold">Rate</th>
                        <th className="py-2 pr-2 font-semibold">Effective</th>
                        <th className="py-2 font-semibold">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {commissions.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2 pr-2 font-medium text-slate-700">{c.categoryName}</td>
                          <td className="py-2 pr-2 font-bold text-slate-900">{c.rate}%</td>
                          <td className="py-2 pr-2 text-slate-500">
                            {formatDate(c.effectiveFrom)}
                            {c.effectiveTo ? ` → ${formatDate(c.effectiveTo)}` : ""}
                          </td>
                          <td className="py-2 text-slate-500">{c.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-400">
                  No category-specific commission rules. The store-wide rate above applies.
                </p>
              )}
            </Section>
          )}

          {profile && tab === "payout" && (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <StatCard icon={Wallet} label="Total paid" value={formatMoney(summary?.totalPaid)} />
                <StatCard icon={CalendarDays} label="Pending" value={formatMoney(summary?.totalPending)} />
                <StatCard icon={Percent} label="Balance" value={formatMoney(summary?.currentBalance)} />
              </div>
              <Section title="Payout ledger" icon={Wallet}>
                {payoutsLoading ? (
                  <p className="py-6 text-center text-xs text-slate-400">Loading payouts…</p>
                ) : payouts.length ? (
                  <ul className="space-y-1.5">
                    {payouts.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-2 text-[11px]">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${p.status === "PAID" ? "bg-emerald-500" : p.status === "FAILED" ? "bg-rose-500" : "bg-amber-500"}`} />
                            <span className="truncate font-semibold text-slate-800">{p.period || p.note || "Payout"}</span>
                            <span className="rounded bg-white px-1 py-0.5 font-bold uppercase tracking-wide text-slate-500">{p.status}</span>
                          </div>
                          <span className="mt-0.5 block text-slate-400">
                            {p.method || "—"} · Created {formatDate(p.createdAt)}
                            {p.paidAt ? ` · Paid ${formatDate(p.paidAt)}` : ""}
                          </span>
                        </div>
                        <span className="shrink-0 font-bold text-slate-700">{formatMoney(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-400">
                    No payouts recorded for this vendor.
                  </p>
                )}
              </Section>
            </>
          )}
        </div>

        {/* sticky footer */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50/90 p-4">
          {rejectOpen ? (
            <div className="space-y-2">
              <label htmlFor="vendor-kyc-reject-reason" className="text-[11px] font-semibold text-slate-600">
                Rejection reason (sent with the decision)
              </label>
              <textarea
                id="vendor-kyc-reject-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                placeholder="Explain what the vendor must fix…"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-rose-400"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectOpen(false);
                    setReason("");
                  }}
                  className="w-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={rejectKyc}
                  disabled={rejecting}
                  className="w-1/2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {rejecting ? "Rejecting…" : "Confirm reject"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                className="w-1/2 rounded-xl border border-rose-300 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
              >
                Reject KYC
              </button>
              {isVerified ? (
                <span className="inline-flex w-1/2 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={14} /> KYC verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={approveKyc}
                  disabled={verifying}
                  className="w-1/2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {verifying ? "Saving…" : "Save & Update KYC"}
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
