"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  User,
  Building2,
  FileText,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  XCircle,
  CheckCircle2,
  Upload,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  RefreshCw,
  Pencil,
  Landmark,
  Store,
  Fingerprint,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetCompleteVendorProfileQuery,
  useGetRequiredDocumentTypesQuery,
  useCreateOrUpdatePersonalInfoMutation,
  useUpdateVendorProfileMutation,
  useUploadDocumentsMutation,
  useDeleteDocumentMutation,
  useRequestReVerificationStatusMutation,
  type VendorDocument,
  type CompleteVendorProfile,
  type VendorPersonalInfoRequest,
  type RequiredDocumentTypes,
} from "@/features/vendorManageApi";

/* ── Types ──────────────────────────────────────────────────────────────── */

type AccountType = "INDIVIDUAL" | "BUSINESS";
type BusinessType = "PROPRIETORSHIP" | "LIMITED_COMPANY" | "PARTNERSHIP_FIRM";

/* ── Static config ──────────────────────────────────────────────────────── */

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; desc: string; icon: typeof User; accent: string; bg: string; text: string; border: string }
> = {
  INDIVIDUAL: {
    label: "Individual",
    desc: "Personal seller account",
    icon: User,
    accent: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  BUSINESS: {
    label: "Business",
    desc: "Registered company or firm",
    icon: Building2,
    accent: "from-violet-500 to-purple-400",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
};

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "PROPRIETORSHIP", label: "Proprietorship" },
  { value: "LIMITED_COMPANY", label: "Ltd. Company" },
  { value: "PARTNERSHIP_FIRM", label: "Partnership" },
];

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  PROPRIETORSHIP: "Proprietorship",
  LIMITED_COMPANY: "Limited Company",
  PARTNERSHIP_FIRM: "Partnership Firm",
};

const DOC_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  PENDING: { label: "Pending", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", icon: Eye },
  APPROVED: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", icon: XCircle },
  EXPIRED: { label: "Expired", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", icon: AlertTriangle },
};

const VENDOR_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ACTIVE: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  PENDING: { label: "Pending Review", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  SUSPENDED: { label: "Suspended", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  DEACTIVATED: { label: "Deactivated", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  NATIONAL_ID_FRONT: "National ID — Front",
  NATIONAL_ID_BACK: "National ID — Back",
  PASSPORT_FRONT: "Passport — Info Page",
  PASSPORT_BACK: "Passport — Back Page",
  TRADE_LICENSE: "Trade License",
  RJSC_REGISTRATION: "RJSC Registration",
  TIN_CERTIFICATE: "TIN Certificate",
  VAT_CERTIFICATE: "VAT Certificate",
  OTHER: "Other Document",
};

// Maps a document TYPE (API) to the FormData field name the upload
// endpoint expects — mirrors the DocumentUploadData interface.
const DOC_FIELD_MAP: Record<string, string> = {
  NATIONAL_ID_FRONT: "nidFront",
  NATIONAL_ID_BACK: "nidBack",
  PASSPORT_FRONT: "passportFront",
  PASSPORT_BACK: "passportBack",
  TRADE_LICENSE: "tradeLicense",
  RJSC_REGISTRATION: "rjscRegistration",
  TIN_CERTIFICATE: "tinCertificate",
  VAT_CERTIFICATE: "vatCertificate",
  OTHER: "otherDocument",
};

const DOC_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "UNDER_REVIEW", label: "In Review" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const INPUT_CLS =
  "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";
const LABEL_CLS = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function maskSensitive(value: string) {
  if (value.length <= 5) return `••••${value}`;
  return `${value.slice(0, 2)}••••${value.slice(-3)}`;
}

/* ── Stat card (same as payments page) ──────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="text-xl font-extrabold text-slate-800">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Read-only info field (with reveal toggle for sensitive values) ─────── */

function InfoField({
  icon: Icon,
  label,
  value,
  mono,
  sensitive,
}: {
  icon: typeof User;
  label: string;
  value?: string | null;
  mono?: boolean;
  sensitive?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const missing = !value;

  return (
    <div className="flex items-center gap-2.5 bg-slate-50/70 border border-slate-100 rounded-xl px-3.5 py-3">
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-cyan-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        <div
          className={`text-sm font-semibold truncate ${
            mono ? "font-mono tracking-wide" : ""
          } ${missing ? "text-slate-300" : "text-slate-700"}`}
        >
          {missing ? "Not provided" : sensitive && !revealed ? maskSensitive(value!) : value}
        </div>
      </div>
      {sensitive && !missing && (
        <button
          onClick={() => setRevealed((r) => !r)}
          className="p-1.5 text-slate-300 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
          title={revealed ? "Hide" : "Reveal"}
        >
          {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      )}
    </div>
  );
}

/* ── Badges ─────────────────────────────────────────────────────────────── */

function DocStatusBadge({ status }: { status: string }) {
  const cfg = DOC_STATUS_CONFIG[status] ?? DOC_STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <StatusIcon size={10} />
      {cfg.label}
    </span>
  );
}

function VendorStatusBadge({ status }: { status: string }) {
  const cfg = VENDOR_STATUS_CONFIG[status] ?? VENDOR_STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <ShieldCheck size={11} />
      {cfg.label}
    </span>
  );
}

/* ── Update Account Type / Details Modal ────────────────────────────────── */

function EditAccountModal({
  profile,
  vendorId,
  onClose,
  onSaved,
}: {
  profile: CompleteVendorProfile;
  vendorId: string;
  onClose: () => void;
  onSaved: (typeChanged: boolean) => void;
}) {
  const [updatePersonalInfo] = useCreateOrUpdatePersonalInfoMutation();
  const [updateProfile] = useUpdateVendorProfileMutation();
  const [submitting, setSubmitting] = useState(false);

  const [accountType, setAccountType] = useState<AccountType>(profile.accountType);
  const [businessType, setBusinessType] = useState<BusinessType>(
    (profile.businessType as BusinessType) ?? "PROPRIETORSHIP"
  );

  // INDIVIDUAL
  const [idName, setIdName] = useState(profile.personalInfo?.idName ?? "");
  const [idNumber, setIdNumber] = useState(profile.personalInfo?.idNumber ?? "");

  // BUSINESS
  const [companyName, setCompanyName] = useState(profile.personalInfo?.companyName ?? "");
  const [businessRegNo, setBusinessRegNo] = useState(profile.personalInfo?.businessRegNo ?? "");
  const [taxIdNumber, setTaxIdNumber] = useState(profile.personalInfo?.taxIdNumber ?? "");

  const typeChanged = accountType !== profile.accountType;
  const businessTypeChanged =
    accountType === "BUSINESS" && businessType !== (profile.businessType ?? "");

  const canSubmit =
    accountType === "INDIVIDUAL"
      ? idName.trim().length > 0 && idNumber.trim().length > 0
      : companyName.trim().length > 0;

  const handleSubmit = async () => {
    if (submitting || !canSubmit) {
      if (!canSubmit) toast.error("Please fill in the required fields.");
      return;
    }
    setSubmitting(true);
    try {
      // 1) If switching account type / business type, push it through the
      //    profile endpoint (FormData is flexible on the backend).
      if (typeChanged || businessTypeChanged) {
        const fd = new FormData();
        fd.append("accountType", accountType);
        if (accountType === "BUSINESS") fd.append("businessType", businessType);
        await updateProfile({ id: vendorId, formData: fd }).unwrap();
      }

      // 2) Upsert the type-specific identity details.
      const payload: VendorPersonalInfoRequest =
        accountType === "INDIVIDUAL"
          ? { idName: idName.trim(), idNumber: idNumber.trim() }
          : {
              companyName: companyName.trim(),
              businessRegNo: businessRegNo.trim() || undefined,
              taxIdNumber: taxIdNumber.trim() || undefined,
            };
      await updatePersonalInfo({ vendorId, data: payload }).unwrap();

      toast.success(
        typeChanged
          ? `Account switched to ${ACCOUNT_TYPE_CONFIG[accountType].label} — upload the newly required documents.`
          : "Account details updated successfully"
      );
      onSaved(typeChanged);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update account details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm">
              <Pencil size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Update Account Details</h2>
              <p className="text-[11px] text-slate-400">Change account type or edit identity details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Account type selector */}
          <div>
            <label className={LABEL_CLS}>Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ACCOUNT_TYPE_CONFIG) as AccountType[]).map((t) => {
                const cfg = ACCOUNT_TYPE_CONFIG[t];
                const Icon = cfg.icon;
                const active = accountType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAccountType(t)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                      active ? `${cfg.border} ${cfg.bg}` : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        active ? `bg-gradient-to-br ${cfg.accent} text-white` : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold ${active ? cfg.text : "text-slate-600"}`}>{cfg.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{cfg.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Switch warning */}
          {typeChanged && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3 text-[11px] text-amber-700 leading-relaxed">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                You are switching from <b>{ACCOUNT_TYPE_CONFIG[profile.accountType].label}</b> to{" "}
                <b>{ACCOUNT_TYPE_CONFIG[accountType].label}</b>. The documents required for verification will
                change — you may need to upload new ones after saving.
              </span>
            </div>
          )}

          {/* Business type */}
          {accountType === "BUSINESS" && (
            <div>
              <label className={LABEL_CLS}>Business Type</label>
              <div className="grid grid-cols-3 gap-2">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setBusinessType(bt.value)}
                    className={`text-[11px] font-bold px-2 py-2.5 rounded-xl border transition-all ${
                      businessType === bt.value
                        ? "bg-violet-50 text-violet-700 border-violet-200 ring-2 ring-violet-100"
                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INDIVIDUAL fields */}
          {accountType === "INDIVIDUAL" && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLS}>
                  ID Holder Name <span className="text-rose-400">*</span>
                </label>
                <input
                  value={idName}
                  onChange={(e) => setIdName(e.target.value)}
                  placeholder="Name as printed on your NID / Passport"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  NID / ID Number <span className="text-rose-400">*</span>
                </label>
                <input
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 1990123456789"
                  className={`${INPUT_CLS} font-mono`}
                />
              </div>
            </div>
          )}

          {/* BUSINESS fields */}
          {accountType === "BUSINESS" && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLS}>
                  Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Finixmart Trading Co."
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  Business Reg. No <span className="text-slate-300 normal-case">(optional)</span>
                </label>
                <input
                  value={businessRegNo}
                  onChange={(e) => setBusinessRegNo(e.target.value)}
                  placeholder="e.g. TRAD/DNCC/001234/2019"
                  className={`${INPUT_CLS} font-mono`}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  Tax ID (TIN) <span className="text-slate-300 normal-case">(optional)</span>
                </label>
                <input
                  value={taxIdNumber}
                  onChange={(e) => setTaxIdNumber(e.target.value)}
                  placeholder="e.g. 123456789012"
                  className={`${INPUT_CLS} font-mono`}
                />
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 bg-cyan-50/70 border border-cyan-100 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-500 leading-relaxed">
            <Info size={13} className="text-cyan-600 shrink-0 mt-0.5" />
            Updates to your account type or details may require re-verification by our team before
            they take full effect.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── File picker row ────────────────────────────────────────────────────── */

function FilePickRow({
  label,
  required,
  hasExisting,
  file,
  onFile,
}: {
  label: string;
  required: boolean;
  hasExisting: boolean;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  return (
    <label className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-3 hover:border-cyan-300 cursor-pointer transition-all">
      <input
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = ""; // allow re-picking the same file
        }}
      />
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
          file ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-100"
        }`}
      >
        {file ? (
          <CheckCircle2 size={15} className="text-emerald-600" />
        ) : (
          <Upload size={14} className="text-blue-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-700">{label}</span>
          {required ? (
            <span className="text-rose-400 font-bold">*</span>
          ) : (
            <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-wide">optional</span>
          )}
          {hasExisting && (
            <span className="text-[9px] font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-full px-1.5 py-px">
              replaces existing
            </span>
          )}
        </div>
        <div
          className={`text-[11px] truncate mt-0.5 ${
            file ? "text-emerald-600 font-semibold" : "text-slate-400"
          }`}
        >
          {file ? `${file.name} · ${formatFileSize(file.size)}` : "JPG, PNG, WebP or PDF — click to browse"}
        </div>
      </div>
      {file && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFile(null);
          }}
          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove"
        >
          <X size={13} />
        </button>
      )}
    </label>
  );
}

/* ── Upload Documents Modal ─────────────────────────────────────────────── */

function UploadDocumentsModal({
  vendorId,
  accountType,
  requiredDocs,
  existingTypes,
  onClose,
}: {
  vendorId: string;
  accountType: AccountType;
  requiredDocs?: RequiredDocumentTypes;
  existingTypes: Set<string>;
  onClose: () => void;
}) {
  const [uploadDocs, { isLoading }] = useUploadDocumentsMutation();
  const [files, setFiles] = useState<Record<string, File | null>>({});

  // Fields come from the API when available; otherwise fall back to the
  // standard set for the vendor's account type.
  const fields = useMemo(() => {
    if (requiredDocs?.required?.length) {
      return [
        ...requiredDocs.required.map((d) => ({ type: d.type, label: d.label, required: true })),
        ...(requiredDocs.alternatives ?? []).map((d) => ({ type: d.type, label: d.label, required: false })),
      ];
    }
    return accountType === "BUSINESS"
      ? [
          { type: "TRADE_LICENSE", label: "Trade License", required: true },
          { type: "TIN_CERTIFICATE", label: "TIN Certificate", required: true },
          { type: "RJSC_REGISTRATION", label: "RJSC Registration", required: false },
          { type: "VAT_CERTIFICATE", label: "VAT Certificate", required: false },
          { type: "OTHER", label: "Other Document", required: false },
        ]
      : [
          { type: "NATIONAL_ID_FRONT", label: "National ID — Front Side", required: true },
          { type: "NATIONAL_ID_BACK", label: "National ID — Back Side", required: true },
          { type: "PASSPORT_FRONT", label: "Passport — Info Page", required: false },
          { type: "PASSPORT_BACK", label: "Passport — Back Page", required: false },
        ];
  }, [requiredDocs, accountType]);

  const selectedCount = Object.values(files).filter(Boolean).length;
  const canSubmit = selectedCount > 0;

  const setFile = (field: string, file: File | null) =>
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[field] = file;
      else delete next[field];
      return next;
    });

  const handleSubmit = async () => {
    if (!canSubmit || isLoading) return;

    const fd = new FormData();
    Object.entries(files).forEach(([field, file]) => {
      if (file) fd.append(field, file);
    });

    const promise = uploadDocs({ vendorId, files: fd }).unwrap();
    toast.promise(promise, {
      loading: `Uploading ${selectedCount} document${selectedCount > 1 ? "s" : ""}…`,
      success: (res: any) => {
        onClose();
        const ok = res?.data?.length ?? 0;
        const failed = res?.errors?.length ?? 0;
        if (failed > 0) return `${ok} uploaded · ${failed} failed — retry the failed ones`;
        return "Documents submitted for verification";
      },
      error: (err: any) => err?.data?.message || "Document upload failed",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm">
              <Upload size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Upload Documents</h2>
              <p className="text-[11px] text-slate-400">
                For your {ACCOUNT_TYPE_CONFIG[accountType].label.toLowerCase()} account verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-3">
          {fields.map((f) => (
            <FilePickRow
              key={f.type}
              label={f.label}
              required={f.required}
              hasExisting={existingTypes.has(f.type)}
              file={files[DOC_FIELD_MAP[f.type] ?? f.type] ?? null}
              onFile={(file) => setFile(DOC_FIELD_MAP[f.type] ?? f.type, file)}
            />
          ))}

          <div className="flex items-start gap-2 bg-cyan-50/70 border border-cyan-100 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-500 leading-relaxed pt-3">
            <Info size={13} className="text-cyan-600 shrink-0 mt-0.5" />
            Uploading a document type you&apos;ve already submitted will replace the previous version.
            All uploads go through review before approval.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400">
            {selectedCount} file{selectedCount === 1 ? "" : "s"} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !canSubmit}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              Upload &amp; Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirmation modal ─────────────────────────────────────────── */

function ConfirmDeleteModal({
  doc,
  isLoading,
  onClose,
  onConfirm,
}: {
  doc: VendorDocument;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-3">
            <Trash2 size={20} className="text-rose-500" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800">Delete this document?</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            <span className="font-semibold text-slate-600">&quot;{doc.title}&quot;</span> will be permanently
            removed from your account. You can upload it again at any time.
          </p>
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-500 rounded-xl hover:from-rose-600 hover:to-red-600 transition-all shadow-sm shadow-rose-200 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Document card ──────────────────────────────────────────────────────── */

function DocumentCard({
  doc,
  onDelete,
}: {
  doc: VendorDocument;
  onDelete: (doc: VendorDocument) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden transition-all hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
            <FileText size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-slate-700 truncate">
              {doc.title || DOC_TYPE_LABELS[doc.type] || doc.type}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {DOC_TYPE_LABELS[doc.type] ?? doc.type}
            </div>
          </div>
          <DocStatusBadge status={doc.verificationStatus} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">File Size</div>
            <div className="text-[11px] font-semibold text-slate-600">{formatFileSize(doc.fileSize)}</div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Uploaded</div>
            <div className="text-[11px] font-semibold text-slate-600">{formatDate(doc.createdAt)}</div>
          </div>
        </div>

        {doc.verificationStatus === "REJECTED" && doc.rejectionReason && (
          <div className="mt-3 flex items-start gap-1.5 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-2 text-[11px] text-rose-600 leading-relaxed">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>{doc.rejectionReason}</span>
          </div>
        )}
        {doc.verificationStatus === "EXPIRED" && (
          <div className="mt-3 flex items-start gap-1.5 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-2 text-[11px] text-orange-600 leading-relaxed">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>This document has expired — please upload a valid copy.</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <a
          href={doc.filePath}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-xl hover:bg-cyan-100 transition-colors"
        >
          <Eye size={12} /> View
        </a>
        <button
          onClick={() => onDelete(doc)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
        >
          <Trash2 size={12} />
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>
    </div>
  );
}

/* ── Request re-verification button ─────────────────────────────────────── */

function RequestReverifyButton({ vendorId }: { vendorId: string }) {
  const [request, { isLoading }] = useRequestReVerificationStatusMutation();
  return (
    <button
      onClick={() => {
        const promise = request(vendorId).unwrap();
        toast.promise(promise, {
          loading: "Submitting request…",
          success: "Re-verification requested — our team will review your updates",
          error: (err: any) => err?.data?.message || "Failed to request re-verification",
        });
      }}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all shrink-0 disabled:opacity-60"
    >
      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
      Request Re-verification
    </button>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */

export default function VendorAccountDocumentsPage() {
  const vendorId = useSelector((state: RootState) => state.auth.user?.vendorId ?? "");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<VendorDocument | null>(null);
  const [docTab, setDocTab] = useState("ALL");

  const {
    data: profile,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetCompleteVendorProfileQuery(vendorId, { skip: !vendorId });
  const { data: requiredDocs } = useGetRequiredDocumentTypesQuery(vendorId, {
    skip: !vendorId,
  });
  const [deleteDoc, { isLoading: isDeleting }] = useDeleteDocumentMutation();

  const accountType = (profile?.accountType ?? "INDIVIDUAL") as AccountType;
  const typeCfg = ACCOUNT_TYPE_CONFIG[accountType];
  const TypeIcon = typeCfg.icon;
  const personalInfo = profile?.personalInfo ?? null;

  const documents = useMemo(
    () =>
      [...(profile?.documents ?? [])].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
      ),
    [profile]
  );

  const approvedCount = documents.filter((d) => d.verificationStatus === "APPROVED").length;
  const rejectedCount = documents.filter((d) => d.verificationStatus === "REJECTED").length;

  // Latest document per type (for the required-docs checklist)
  const latestByType = useMemo(() => {
    const map = new Map<string, VendorDocument>();
    [...documents]
      .sort((a, b) => +new Date(a.updatedAt) - +new Date(b.updatedAt))
      .forEach((d) => map.set(d.type, d));
    return map;
  }, [documents]);

  const requiredList = useMemo(() => {
    if (requiredDocs?.required?.length) return requiredDocs.required;
    return accountType === "BUSINESS"
      ? [
          { type: "TRADE_LICENSE", label: "Trade License" },
          { type: "TIN_CERTIFICATE", label: "TIN Certificate" },
        ]
      : [
          { type: "NATIONAL_ID_FRONT", label: "National ID — Front Side" },
          { type: "NATIONAL_ID_BACK", label: "National ID — Back Side" },
        ];
  }, [requiredDocs, accountType]);

  const alternativeList = requiredDocs?.alternatives ?? [];
  const requiredDone = requiredList.filter((r) => latestByType.has(r.type)).length;
  const requiredPct = requiredList.length
    ? Math.round((requiredDone / requiredList.length) * 100)
    : 0;

  const existingTypes = useMemo(() => new Set(documents.map((d) => d.type)), [documents]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: documents.length };
    documents.forEach((d) => {
      counts[d.verificationStatus] = (counts[d.verificationStatus] ?? 0) + 1;
    });
    return counts;
  }, [documents]);

  const filteredDocs =
    docTab === "ALL" ? documents : documents.filter((d) => d.verificationStatus === docTab);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const promise = deleteDoc(confirmDelete.id).unwrap();
    toast.promise(promise, {
      loading: "Deleting document…",
      success: () => {
        setConfirmDelete(null);
        return "Document deleted successfully";
      },
      error: (err: any) => err?.data?.message || "Failed to delete document",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans">
      {/* ── Top Bar ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30 shadow-sm shadow-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-600 shrink-0">
              <Building2 size={14} />
              <span>Vendor</span>
            </div>
            <ChevronRight size={12} className="shrink-0" />
            <span className="font-semibold text-slate-700 truncate">Account &amp; Documents</span>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            disabled={!vendorId}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all shrink-0 disabled:opacity-50"
          >
            <Upload size={13} />
            <span className="hidden sm:inline">Upload Documents</span>
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Page title ── */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Account &amp; Documents
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View and update your account type, business details and verification documents
          </p>
        </div>

        {!vendorId ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 text-center">
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <ShieldAlert size={40} className="opacity-40" />
              <div className="text-sm font-medium text-slate-400">
                Vendor session not found — please sign in again.
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-24 animate-pulse">
                  <div className="h-2.5 bg-slate-100 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 h-56 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-48 animate-pulse">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : isError || !profile ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 text-center">
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <ShieldAlert size={40} className="opacity-40" />
              <div className="text-sm font-medium text-slate-400">
                Couldn&apos;t load your account details
              </div>
              <button
                onClick={() => refetch()}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all"
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Verification banner ── */}
            {(rejectedCount > 0 || profile.status === "PENDING") && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <ShieldAlert size={17} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {rejectedCount > 0
                        ? "Some documents were rejected"
                        : "Verification pending"}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {rejectedCount > 0
                        ? "Review the rejection reasons below, replace the affected documents, then request re-verification."
                        : "Upload the required documents to complete verification and activate your store."}
                    </div>
                  </div>
                </div>
                {rejectedCount > 0 && <RequestReverifyButton vendorId={vendorId} />}
              </div>
            )}

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <StatCard
                label="Account Type"
                value={typeCfg.label}
                sub={
                  accountType === "BUSINESS" && profile.businessType
                    ? BUSINESS_TYPE_LABELS[profile.businessType] ?? "—"
                    : "Personal seller"
                }
                icon={<TypeIcon size={16} />}
                accent={typeCfg.accent}
              />
              <StatCard
                label="Verification"
                value={VENDOR_STATUS_CONFIG[profile.status]?.label ?? profile.status}
                sub={profile.createdAt ? `Member since ${formatDate(profile.createdAt)}` : "—"}
                icon={<ShieldCheck size={16} />}
                accent="from-cyan-500 to-emerald-400"
              />
              <StatCard
                label="Documents"
                value={documents.length}
                sub={`${approvedCount} approved · ${rejectedCount} rejected`}
                icon={<FileText size={16} />}
                accent="from-violet-500 to-purple-400"
              />
              <StatCard
                label="Required Docs"
                value={`${requiredDone} / ${requiredList.length}`}
                sub={requiredDone === requiredList.length ? "All submitted" : "Some are missing"}
                icon={<FileCheck size={16} />}
                accent="from-amber-500 to-orange-400"
              />
            </div>

            {/* ── Account Type & Details ── */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-blue-200">
                    <BadgeCheck size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800">Account Type &amp; Details</h2>
                    <p className="text-[11px] text-slate-400">
                      Your seller identity used for verification &amp; payouts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-xl hover:bg-cyan-100 transition-colors shrink-0"
                >
                  <Pencil size={12} />
                  <span className="hidden sm:inline">Update</span>
                </button>
              </div>

              <div className="p-5">
                {/* Type banner */}
                <div className={`flex items-center gap-3.5 rounded-2xl border p-4 ${typeCfg.bg} ${typeCfg.border}`}>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeCfg.accent} flex items-center justify-center text-white shadow-sm shrink-0`}
                  >
                    <TypeIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-800">{typeCfg.label} Account</span>
                      {accountType === "BUSINESS" && profile.businessType && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-violet-700 border border-violet-200">
                          {BUSINESS_TYPE_LABELS[profile.businessType]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{typeCfg.desc}</p>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <VendorStatusBadge status={profile.status} />
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {accountType === "INDIVIDUAL" ? (
                    <>
                      <InfoField icon={User} label="ID Holder Name" value={personalInfo?.idName} />
                      <InfoField
                        icon={Fingerprint}
                        label="NID / ID Number"
                        value={personalInfo?.idNumber}
                        mono
                        sensitive
                      />
                    </>
                  ) : (
                    <>
                      <InfoField icon={Building2} label="Company Name" value={personalInfo?.companyName} />
                      <InfoField
                        icon={Store}
                        label="Business Type"
                        value={profile.businessType ? BUSINESS_TYPE_LABELS[profile.businessType] : null}
                      />
                      <InfoField
                        icon={FileText}
                        label="Business Reg. No"
                        value={personalInfo?.businessRegNo}
                        mono
                        sensitive
                      />
                      <InfoField
                        icon={Landmark}
                        label="Tax ID (TIN)"
                        value={personalInfo?.taxIdNumber}
                        mono
                        sensitive
                      />
                    </>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-2 bg-cyan-50/60 border border-cyan-100 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-500 leading-relaxed">
                  <Info size={13} className="text-cyan-600 shrink-0 mt-0.5" />
                  Changing your account type also changes which documents are required for
                  verification. Updated details go through review before approval.
                </div>
              </div>
            </div>

            {/* ── Required documents checklist ── */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 p-5 mb-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-cyan-200">
                    <FileCheck size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800">Required Documents</h2>
                    <p className="text-[11px] text-slate-400">
                      Needed for your {typeCfg.label.toLowerCase()} account verification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all shrink-0"
                >
                  <Upload size={12} />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${requiredPct}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500 shrink-0">
                  {requiredDone}/{requiredList.length} submitted
                </span>
              </div>

              <div className="space-y-2">
                {requiredList.map((item) => {
                  const doc = latestByType.get(item.type);
                  const st = doc
                    ? DOC_STATUS_CONFIG[doc.verificationStatus] ?? DOC_STATUS_CONFIG.PENDING
                    : null;
                  const RowIcon = st?.icon ?? XCircle;
                  return (
                    <div
                      key={item.type}
                      className="flex items-center justify-between gap-3 bg-slate-50/70 border border-slate-100 rounded-xl px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <RowIcon size={16} className={st ? st.text : "text-slate-300"} />
                        <span className="text-xs font-bold text-slate-700 truncate">{item.label}</span>
                      </div>
                      {doc ? (
                        <DocStatusBadge status={doc.verificationStatus} />
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500 shrink-0">Not uploaded</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {alternativeList.length > 0 && (
                <div className="mt-3 text-[11px] text-slate-400 flex items-start gap-1.5">
                  <Info size={12} className="shrink-0 mt-0.5 text-slate-300" />
                  <span>Also accepted as alternatives: {alternativeList.map((a) => a.label).join(", ")}.</span>
                </div>
              )}
            </div>

            {/* ── Uploaded documents ── */}
            <div className="mb-4">
              <h2 className="text-sm font-extrabold text-slate-800">Uploaded Documents</h2>
              <p className="text-[11px] text-slate-400">
                Track the verification status of each submitted document
              </p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 px-2 py-2 mb-5 flex flex-wrap gap-1.5">
              {DOC_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDocTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    docTab === tab.key
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm shadow-blue-200"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      docTab === tab.key ? "bg-white/20" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {tabCounts[tab.key] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Grid */}
            {filteredDocs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 py-20 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <FileText size={40} className="opacity-40" />
                  <div className="text-sm font-medium text-slate-400">
                    {docTab === "ALL"
                      ? "No documents uploaded yet"
                      : `No ${DOC_STATUS_CONFIG[docTab]?.label?.toLowerCase() ?? ""} documents`}
                  </div>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="mt-2 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all"
                  >
                    <Upload size={13} /> Upload your first document
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocs.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} onDelete={setConfirmDelete} />
                ))}
              </div>
            )}
          </>
        )}

        {isFetching && !isLoading && (
          <div className="flex items-center justify-center gap-2 text-xs text-cyan-600 mt-4">
            <Loader2 size={12} className="animate-spin" /> Syncing…
          </div>
        )}
      </div>

      {editModalOpen && profile && (
        <EditAccountModal
          profile={profile}
          vendorId={vendorId}
          onClose={() => setEditModalOpen(false)}
          onSaved={(changed) => {
            setEditModalOpen(false);
            if (changed) setUploadModalOpen(true); // guide them to the new required docs
          }}
        />
      )}

      {uploadModalOpen && (
        <UploadDocumentsModal
          vendorId={vendorId}
          accountType={accountType}
          requiredDocs={requiredDocs}
          existingTypes={existingTypes}
          onClose={() => setUploadModalOpen(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          doc={confirmDelete}
          isLoading={isDeleting}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}