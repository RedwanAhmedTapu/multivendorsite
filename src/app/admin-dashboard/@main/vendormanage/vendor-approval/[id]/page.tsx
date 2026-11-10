"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Store,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  PauseCircle,
  AlertCircle,
  RefreshCw,
  User,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  ShieldCheck,
  Star,
  Package,
  ShoppingCart,
  Flag,
  ExternalLink,
  Eye,
  Sparkles,
  Loader2,
  BadgeCheck,
  Clock,
} from "lucide-react";

import {
  useGetCompleteVendorProfileQuery,
  useVerifyVendorVerificationMutation,
  useRejectVendorVerificationMutation,
  useSuspendVendorVerificationMutation,
  useRequestReVerificationStatusMutation,
  useUpdateDocumentStatusMutation,
} from "@/features/vendorManageApi";

/* ─── Design tokens (shared with AddProductForm) ────────────────────────── */

const PAGE_BG = "#F7F9FD";
const CARD_BORDER = "#E5EAF2";
const HEADER_BG = "#FAFBFD";
const TITLE = "#0D1B2E";
const SUBTLE = "#7A90AB";
const MUTED = "#9BAABB";
const BLUE = "#1D4ED8";
const PURPLE = "#7C3AED";

type VendorStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
type DocStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";

const STATUS_STYLE: Record<
  VendorStatus,
  { bg: string; border: string; fg: string; icon: React.ReactNode; label: string }
> = {
  PENDING: { bg: "#FFFBEB", border: "#FDE68A", fg: "#92400E", icon: <AlertCircle size={13} />, label: "Pending" },
  ACTIVE: { bg: "#F0FDF4", border: "#BBF7D0", fg: "#15803D", icon: <CheckCircle size={13} />, label: "Active" },
  SUSPENDED: { bg: "#FEF2F2", border: "#FECACA", fg: "#DC2626", icon: <PauseCircle size={13} />, label: "Suspended" },
  DEACTIVATED: { bg: "#F1F5F9", border: "#E2E8F0", fg: "#475569", icon: <XCircle size={13} />, label: "Deactivated" },
};

const DOC_STATUS_STYLE: Record<DocStatus, { bg: string; border: string; fg: string; label: string }> = {
  PENDING: { bg: "#FFFBEB", border: "#FDE68A", fg: "#92400E", label: "Pending" },
  UNDER_REVIEW: { bg: "#EFF6FF", border: "#BFDBFE", fg: "#1D4ED8", label: "Under review" },
  APPROVED: { bg: "#F0FDF4", border: "#BBF7D0", fg: "#15803D", label: "Approved" },
  REJECTED: { bg: "#FEF2F2", border: "#FECACA", fg: "#DC2626", label: "Rejected" },
  EXPIRED: { bg: "#F1F5F9", border: "#E2E8F0", fg: "#475569", label: "Expired" },
};

const DOC_LABELS: Record<string, string> = {
  NATIONAL_ID_FRONT: "National ID (front)",
  NATIONAL_ID_BACK: "National ID (back)",
  PASSPORT_FRONT: "Passport (front)",
  PASSPORT_BACK: "Passport (back)",
  TRADE_LICENSE: "Trade license",
  RJSC_REGISTRATION: "RJSC registration",
  TIN_CERTIFICATE: "TIN certificate",
  VAT_CERTIFICATE: "VAT certificate",
  OTHER: "Other document",
};

/* ─── Section shell (mirrors AddProductForm's SectionCard) ─────────────── */

function SectionCard({
  icon,
  title,
  subtitle,
  badge,
  grid,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: { text: string; tone: "green" | "amber" | "red" };
  grid?: boolean;
  children: React.ReactNode;
}) {
  const badgeColors = {
    green: { bg: "#F0F9F0", fg: "#16A34A", border: "#BBF7D0" },
    amber: { bg: "#FFFBEB", fg: "#B45309", border: "#FDE68A" },
    red: { bg: "#FEF2F2", fg: "#DC2626", border: "#FECACA" },
  } as const;

  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${CARD_BORDER}`,
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid #F0F4FA",
          background: HEADER_BG,
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "#EEF3FB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: TITLE, letterSpacing: "-0.2px" }}>
              {title}
            </div>
            {subtitle && <div style={{ fontSize: 11, color: SUBTLE, marginTop: 1 }}>{subtitle}</div>}
          </div>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              padding: "2px 9px",
              borderRadius: 20,
              background: badgeColors[badge.tone].bg,
              color: badgeColors[badge.tone].fg,
              border: `1px solid ${badgeColors[badge.tone].border}`,
            }}
          >
            {badge.text}
          </span>
        )}
      </div>
      <div
        style={
          grid
            ? { padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px 18px" }
            : { padding: "16px 18px" }
        }
      >
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: SUBTLE, letterSpacing: "0.02em" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: value ? TITLE : MUTED, marginTop: 2, fontWeight: 500 }}>
        {value || "Not provided"}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${CARD_BORDER}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flex: "1 1 150px",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: `${color}17`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: TITLE }}>{value}</div>
        <div style={{ fontSize: 10.5, color: SUBTLE, fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  tone,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "primary" | "danger" | "warning" | "neutral";
  disabled?: boolean;
}) {
  const styles = {
    primary: { bg: "linear-gradient(135deg,#1D4ED8,#7C3AED)", fg: "#fff", border: "none" },
    danger: { bg: "#FEF2F2", fg: "#DC2626", border: "1.5px solid #FECACA" },
    warning: { bg: "#FFFBEB", fg: "#B45309", border: "1.5px solid #FDE68A" },
    neutral: { bg: "#fff", fg: "#475569", border: `1.5px solid ${CARD_BORDER}` },
  } as const;
  const s = styles[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "9px 16px",
        borderRadius: 10,
        border: s.border,
        background: s.bg,
        color: s.fg,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────── */

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = (params?.id as string) || "";

  const { data: vendor, isLoading, refetch } = useGetCompleteVendorProfileQuery(vendorId, {
    skip: !vendorId,
  });

  const [verifyVendor, { isLoading: verifying }] = useVerifyVendorVerificationMutation();
  const [rejectVendor, { isLoading: rejecting }] = useRejectVendorVerificationMutation();
  const [suspendVendor, { isLoading: suspending }] = useSuspendVendorVerificationMutation();
  const [requestReVerification] = useRequestReVerificationStatusMutation();
  const [updateDocumentStatus] = useUpdateDocumentStatusMutation();

  const [reasonDialog, setReasonDialog] = useState<"reject" | "suspend" | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [docRejectDialog, setDocRejectDialog] = useState<string | null>(null);
  const [docReasonText, setDocReasonText] = useState("");

  const handleVerify = async () => {
    try {
      await verifyVendor({ vendorId }).unwrap();
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const submitReject = async () => {
    try {
      await rejectVendor({ vendorId, rejectionReason: reasonText }).unwrap();
      setReasonDialog(null);
      setReasonText("");
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const submitSuspend = async () => {
    try {
      await suspendVendor({ vendorId, reason: reasonText }).unwrap();
      setReasonDialog(null);
      setReasonText("");
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReVerification = async () => {
    try {
      await requestReVerification(vendorId).unwrap();
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const approveDocument = async (documentId: string) => {
    try {
      await updateDocumentStatus({ documentId, status: "APPROVED" }).unwrap();
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const submitDocReject = async () => {
    if (!docRejectDialog) return;
    try {
      await updateDocumentStatus({
        documentId: docRejectDialog,
        status: "REJECTED",
        rejectionReason: docReasonText,
      }).unwrap();
      setDocRejectDialog(null);
      setDocReasonText("");
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !vendor) {
    return (
      <div
        style={{
          background: PAGE_BG,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: SUBTLE,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        Loading vendor profile…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const s = STATUS_STYLE[vendor.status as VendorStatus] ?? STATUS_STYLE.DEACTIVATED;
  const isIndividual = vendor.accountType === "INDIVIDUAL";
  const onboarding = vendor.onboarding;
  const progressPct = onboarding
    ? [
        onboarding.personalInfoComplete,
        onboarding.addressComplete,
        onboarding.bankInfoComplete,
        onboarding.documentsComplete,
      ].filter(Boolean).length * 25
    : 0;

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: PAGE_BG,
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Back link */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: SUBTLE }}><span>Vendor Management</span><span style={{ color: MUTED }}>/</span><span style={{ color: TITLE }}>Vendor Approval</span></div>
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: SUBTLE,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            width: "fit-content",
            fontFamily: "inherit",
          }}
        >
          <ArrowLeft size={14} />
          Back to vendors
        </button>

        {/* ── Header card ── */}
        <div
          style={{
            background: "#fff",
            border: `1.5px solid ${CARD_BORDER}`,
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "linear-gradient(135deg,#2563EB,#8B5CF6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {(vendor.storeName || "V").trim().split(/\s+/).slice(0, 2).map((w: string) => w.charAt(0)).join("").toUpperCase() || "V"}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: 15.5, fontWeight: 700, color: TITLE, margin: 0, overflowWrap: "anywhere" }}>
                    {vendor.storeName}
                  </h1>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: s.bg,
                      color: s.fg,
                      border: `1px solid ${s.border}`,
                    }}
                  >
                    {s.icon}
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: PURPLE,
                      background: "#F5F3FF",
                      border: "1px solid #DDD6FE",
                      borderRadius: 20,
                      padding: "3px 10px",
                    }}
                  >
                    {isIndividual ? "Individual" : "Business"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: SUBTLE, display: "flex", alignItems: "center", gap: 5, minWidth: 0, overflowWrap: "anywhere" }}>
                    <Mail size={12} /> {vendor.user?.email || "—"}
                  </span>
                  <span style={{ fontSize: 12, color: SUBTLE, display: "flex", alignItems: "center", gap: 5, minWidth: 0, overflowWrap: "anywhere" }}>
                    <Phone size={12} /> {vendor.user?.phone || "—"}
                  </span>
                  <span style={{ fontSize: 12, color: SUBTLE, display: "flex", alignItems: "center", gap: 5, minWidth: 0, overflowWrap: "anywhere" }}>
                    <Calendar size={12} /> Joined {new Date(vendor.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", paddingTop: 12, marginTop: 2, borderTop: "1px solid #EEF3FB" }}>
              {vendor.status !== "ACTIVE" && (
                <ActionButton tone="primary" onClick={handleVerify} disabled={verifying}>
                  {verifying ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <BadgeCheck size={13} />}
                  Verify &amp; Approve
                </ActionButton>
              )}
              {vendor.status !== "SUSPENDED" && (
                <ActionButton tone="warning" onClick={() => setReasonDialog("suspend")}>
                  <PauseCircle size={13} />
                  Suspend
                </ActionButton>
              )}
              <ActionButton tone="danger" onClick={() => setReasonDialog("reject")}>
                <XCircle size={13} />
                Reject
              </ActionButton>
              <ActionButton tone="neutral" onClick={handleReVerification}>
                <RefreshCw size={13} />
                Request re-verification
              </ActionButton>
            </div>
          </div>

          {/* Onboarding progress */}
          {onboarding && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed #E5EAF2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#3D5068" }}>
                  Onboarding completeness
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: BLUE }}>{progressPct}%</span>
              </div>
              <div style={{ height: 8, background: "#F1F5F9", borderRadius: 20, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: "100%",
                    background: "linear-gradient(135deg,#1D4ED8,#7C3AED)",
                    borderRadius: 20,
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                {[
                  ["Personal info", onboarding.personalInfoComplete],
                  ["Address", onboarding.addressComplete],
                  ["Bank info", onboarding.bankInfoComplete],
                  ["Documents", onboarding.documentsComplete],
                ].map(([label, done]) => (
                  <span
                    key={label as string}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: done ? "#15803D" : MUTED,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {done ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard icon={<Package size={16} color={BLUE} />} label="Products" value={vendor._count?.products ?? 0} color={BLUE} />
          <StatCard icon={<ShoppingCart size={16} color="#16A34A" />} label="Orders" value={vendor._count?.orders ?? 0} color="#16A34A" />
          <StatCard icon={<Star size={16} color="#D97706" />} label="Avg rating" value={vendor.performance?.avgRating?.toFixed(1) ?? "—"} color="#D97706" />
          <StatCard icon={<ShieldCheck size={16} color="#0891B2" />} label="Fulfillment" value={`${vendor.performance?.fulfillmentRatePct ?? 0}%`} color="#0891B2" />
          <StatCard icon={<Flag size={16} color="#DC2626" />} label="Flags" value={vendor._count?.flags ?? 0} color="#DC2626" />
        </div>

        {/* ── Two-column body ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <SectionCard grid icon={<User size={15} color="#1D4ED8" />} title="Account & Contact">
            <InfoRow label="Email" value={vendor.user?.email} />
            <InfoRow label="Phone" value={vendor.user?.phone} />
            <InfoRow
              label="Account active"
              value={vendor.user?.isActive ? "Yes" : "No"}
            />
            <InfoRow
              label="Email/phone verified"
              value={vendor.user?.isVerified ? "Yes" : "No"}
            />
          </SectionCard>

          <SectionCard
            icon={isIndividual ? <User size={15} color="#7C3AED" /> : <Building2 size={15} color="#7C3AED" />}
            title={isIndividual ? "Personal Information" : "Business Information"}
            badge={
              vendor.personalInfo
                ? { text: "Provided", tone: "green" }
                : { text: "Missing", tone: "amber" }
            }
          >
            {isIndividual ? (
              <>
                <InfoRow label="ID name" value={vendor.personalInfo?.idName} />
                <InfoRow label="ID number" value={vendor.personalInfo?.idNumber} />
              </>
            ) : (
              <>
                <InfoRow label="Company name" value={vendor.personalInfo?.companyName} />
                <InfoRow label="Business reg. no." value={vendor.personalInfo?.businessRegNo} />
                <InfoRow label="Tax ID number" value={vendor.personalInfo?.taxIdNumber} />
                <InfoRow label="Business type" value={vendor.businessType || undefined} />
              </>
            )}
          </SectionCard>

          <SectionCard
            icon={<MapPin size={15} color="#0891B2" />}
            title="Address"
            badge={
              vendor.pickupAddress
                ? { text: "Provided", tone: "green" }
                : { text: "Missing", tone: "amber" }
            }
          >
            <InfoRow label="Address" value={vendor.pickupAddress?.detailsAddress} />
            <InfoRow label="City" value={vendor.pickupAddress?.city} />
            <InfoRow label="Zone" value={vendor.pickupAddress?.zone} />
            <InfoRow label="Area" value={vendor.pickupAddress?.area} />
          </SectionCard>

         <SectionCard
  icon={<CreditCard size={15} color="#16A34A" />}
  title="Payment Accounts"
  subtitle={vendor.paymentAccounts?.length ? `${vendor.paymentAccounts.length} account(s) on file` : undefined}
  badge={
    vendor.paymentAccounts && vendor.paymentAccounts.length > 0
      ? { text: "Provided", tone: "green" }
      : { text: "Missing", tone: "amber" }
  }
>
  {!vendor.paymentAccounts || vendor.paymentAccounts.length === 0 ? (
    <p style={{ fontSize: 12.5, color: MUTED }}>No payment account added yet.</p>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {vendor.paymentAccounts.map((acc) => (
        <div
          key={acc.id}
          style={{
            border: `1.5px solid ${CARD_BORDER}`,
            borderRadius: 11,
            padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: BLUE }}>
              {acc.type === "BANK" ? "Bank" : acc.type === "MOBILE_BANKING" ? "Mobile Banking" : acc.type}
            </span>
            {acc.isDefault && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "#15803D",
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 20,
                  padding: "2px 8px",
                }}
              >
                Default
              </span>
            )}
          </div>

          {acc.type === "BANK" && (
            <>
              <InfoRow label="Account name" value={acc.accountName} />
              <InfoRow label="Account number" value={acc.accountNumber} />
              <InfoRow label="Bank name" value={acc.bankBranch?.bank?.name} />
              <InfoRow label="Branch" value={acc.bankBranch?.branchName} />
            </>
          )}

          {acc.type === "MOBILE_BANKING" && (
            <>
              <InfoRow label="Provider" value={acc.mobileProvider} />
              <InfoRow label="Wallet number" value={acc.walletNumber} />
              <InfoRow label="Wallet kind" value={acc.walletKind} />
            </>
          )}

          {acc.type === "CARD" && (
            <>
              <InfoRow label="Processor" value={acc.cardProcessor} />
              <InfoRow label="Merchant ID" value={acc.merchantId} />
            </>
          )}
        </div>
      ))}
    </div>
  )}
</SectionCard>
        </div>

        {/* ── Documents ── */}
        <SectionCard
          icon={<FileText size={15} color="#D97706" />}
          title="Verification Documents"
          subtitle="Review each document before approving the vendor"
          badge={
            vendor.documents && vendor.documents.length > 0
              ? { text: `${vendor.documents.length} uploaded`, tone: "green" }
              : { text: "None uploaded", tone: "red" }
          }
        >
          {!vendor.documents || vendor.documents.length === 0 ? (
            <p style={{ fontSize: 12.5, color: MUTED }}>No documents uploaded yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {vendor.documents.map((doc: any) => {
                const ds = DOC_STATUS_STYLE[doc.verificationStatus as DocStatus] ?? DOC_STATUS_STYLE.PENDING;
                return (
                  <div
                    key={doc.id}
                    style={{
                      border: `1.5px solid ${CARD_BORDER}`,
                      borderRadius: 11,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: TITLE }}>
                          {DOC_LABELS[doc.type] || doc.title || doc.type}
                        </div>
                        <div style={{ fontSize: 11, color: SUBTLE, marginTop: 1 }}>{doc.title}</div>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: ds.bg,
                          color: ds.fg,
                          border: `1px solid ${ds.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ds.label}
                      </span>
                    </div>
                    {doc.rejectionReason && (
                      <p style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>
                        Reason: {doc.rejectionReason}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: BLUE,
                          textDecoration: "none",
                        }}
                      >
                        <Eye size={12} /> View file <ExternalLink size={10} />
                      </a>
                      {doc.verificationStatus !== "APPROVED" && (
                        <button
                          onClick={() => approveDocument(doc.id)}
                          style={{
                            marginLeft: "auto",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#15803D",
                            background: "#F0FDF4",
                            border: "1px solid #BBF7D0",
                            borderRadius: 7,
                            padding: "4px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {doc.verificationStatus !== "REJECTED" && (
                        <button
                          onClick={() => setDocRejectDialog(doc.id)}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#DC2626",
                            background: "#FEF2F2",
                            border: "1px solid #FECACA",
                            borderRadius: 7,
                            padding: "4px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Subscription ── */}
        <SectionCard icon={<Sparkles size={15} color="#7C3AED" />} title="Subscription & Settings">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <InfoRow label="Plan" value={vendor.subscription?.planType} />
            <InfoRow label="Plan active" value={vendor.subscription?.isActive ? "Yes" : "No"} />
            <InfoRow
              label="Email notifications"
              value={vendor.settings?.emailNotifications ? "Enabled" : "Disabled"}
            />
            <InfoRow
              label="Last performance sync"
              value={
                vendor.performance?.lastCalculatedAt
                  ? new Date(vendor.performance.lastCalculatedAt).toLocaleString()
                  : undefined
              }
            />
          </div>
        </SectionCard>
      </div>

      {/* ── Reject / suspend vendor dialog ── */}
      <Dialog open={!!reasonDialog} onOpenChange={(open) => !open && setReasonDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reasonDialog === "reject" ? "Reject vendor" : "Suspend vendor"}</DialogTitle>
            <DialogDescription>
              {reasonDialog === "reject"
                ? "Give the vendor a clear reason so they know what to fix."
                : "Give a reason for suspending this vendor's account."}
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Reason..."
            rows={4}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 9,
              border: `1.5px solid ${CARD_BORDER}`,
              fontFamily: "inherit",
              fontSize: 13,
              resize: "vertical",
            }}
          />
          <DialogFooter>
            <button
              onClick={() => setReasonDialog(null)}
              style={{
                padding: "8px 16px",
                borderRadius: 9,
                border: `1.5px solid ${CARD_BORDER}`,
                background: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={reasonDialog === "reject" ? submitReject : submitSuspend}
              disabled={!reasonText.trim() || rejecting || suspending}
              style={{
                padding: "8px 16px",
                borderRadius: 9,
                border: "none",
                background: reasonDialog === "reject" ? "#DC2626" : "#B45309",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                opacity: !reasonText.trim() ? 0.6 : 1,
              }}
            >
              Confirm {reasonDialog === "reject" ? "rejection" : "suspension"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject document dialog ── */}
      <Dialog open={!!docRejectDialog} onOpenChange={(open) => !open && setDocRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
            <DialogDescription>Explain what's wrong so the vendor can re-upload it.</DialogDescription>
          </DialogHeader>
          <textarea
            value={docReasonText}
            onChange={(e) => setDocReasonText(e.target.value)}
            placeholder="Reason..."
            rows={4}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 9,
              border: `1.5px solid ${CARD_BORDER}`,
              fontFamily: "inherit",
              fontSize: 13,
              resize: "vertical",
            }}
          />
          <DialogFooter>
            <button
              onClick={() => setDocRejectDialog(null)}
              style={{
                padding: "8px 16px",
                borderRadius: 9,
                border: `1.5px solid ${CARD_BORDER}`,
                background: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={submitDocReject}
              disabled={!docReasonText.trim()}
              style={{
                padding: "8px 16px",
                borderRadius: 9,
                border: "none",
                background: "#DC2626",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                opacity: !docReasonText.trim() ? 0.6 : 1,
              }}
            >
              Confirm rejection
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}