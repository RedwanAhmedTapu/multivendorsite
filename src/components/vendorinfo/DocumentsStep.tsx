// ============================================
// components/vendor/steps/DocumentsStep.tsx
// ============================================
import React, { useState, useEffect } from "react";
import {
  VendorDocument,
  useUploadDocumentsMutation,
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
  useCreateOrUpdatePersonalInfoMutation,
  useUpdateVendorProfileMutation,
} from "@/features/vendorManageApi";
import FileUploadField from "./FileUploadField";
import {
  ShieldCheck,
  User,
  Building2,
  Store,
  Users,
  CreditCard,
  FileText,
  FileStack,
  ListChecks,
  Check,
  Circle,
  ChevronDown,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface DocumentUploadData {
  nidFront?: File;
  nidBack?: File;
  passportFront?: File;
  passportBack?: File;
  tradeLicense?: File;
  rjscRegistration?: File;
  tinCertificate?: File;
  vatCertificate?: File;
  otherDocument?: File;
}

interface DocumentsStepProps {
  accountType: "INDIVIDUAL" | "BUSINESS";
  businessType?:
    | "PROPRIETORSHIP"
    | "LIMITED_COMPANY"
    | "PARTNERSHIP_FIRM"
    | null;
  vendorId: string;
  onDocumentsChange?: (docs: DocumentUploadData) => void;
  onBusinessTypeChange?: (
    businessType: "PROPRIETORSHIP" | "LIMITED_COMPANY" | "PARTNERSHIP_FIRM",
  ) => void;
  onSubmit: (payload: {
    documents: DocumentUploadData;
    businessType?: "PROPRIETORSHIP" | "LIMITED_COMPANY" | "PARTNERSHIP_FIRM";
    personalInfo: {
      idNumber?: string;
      idName?: string;
      companyName?: string;
      businessRegNo?: string;
      taxIdNumber?: string;
    };
  }) => void;
  isSubmitting: boolean;
  onBack: () => void;
  showBackButton?: boolean;
  onClearError: (field: string) => void;
  existingPersonalInfo?: any;
  existingBankInfo?: any;
  completeProfile?: any;
}

const DOCUMENT_FIELD_MAP: Record<string, string> = {
  NATIONAL_ID_FRONT: "nationalIdFront",
  NATIONAL_ID_BACK: "nationalIdBack",
  PASSPORT_FRONT: "passportFront",
  PASSPORT_BACK: "passportBack",
  TRADE_LICENSE: "tradeLicense",
  RJSC_REGISTRATION: "rjscRegistration",
  TIN_CERTIFICATE: "tinCertificate",
  VAT_CERTIFICATE: "vatCertificate",
  OTHER: "otherDocument",
};

/* ── One-time keyframe injection: progressive-reveal + shared shimmer ── */
if (
  typeof document !== "undefined" &&
  !document.getElementById("docs-step-style")
) {
  const s = document.createElement("style");
  s.id = "docs-step-style";
  s.textContent = `
    @keyframes docs-spin { to { transform: rotate(360deg); } }
    @keyframes docs-reveal {
      0%   { opacity: 0; transform: translateY(14px); max-height: 0; }
      100% { opacity: 1; transform: translateY(0); max-height: 2000px; }
    }
    @keyframes docs-pop {
      0%   { transform: scale(0.6); opacity: 0; }
      60%  { transform: scale(1.12); }
      100% { transform: scale(1); opacity: 1; }
    }
    .docs-reveal { animation: docs-reveal 0.45s cubic-bezier(0.22,1,0.36,1) both; overflow: hidden; }
    .docs-pop { animation: docs-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
  `;
  document.head.appendChild(s);
}

/* ── Compact section card ── */
function SectionCard({
  icon,
  iconBg,
  title,
  subtitle,
  done,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${done ? "#BBF7D0" : "#E5EAF2"}`,
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{
          background: done ? "#F0FDF4" : "#FAFBFD",
          borderBottom: `1px solid ${done ? "#DCFCE7" : "#F0F4FA"}`,
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: done
              ? "linear-gradient(135deg,#16A34A,#059669)"
              : iconBg,
          }}
        >
          {done ? <Check size={15} color="#fff" strokeWidth={3} /> : icon}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-black text-slate-900 leading-tight">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3.5">{children}</div>
    </div>
  );
}

const FieldLabel = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">
    {children} {required && <span className="text-red-500 normal-case">*</span>}
  </label>
);

const compactInputCls =
  "w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 transition-all";

/* ── Mini internal stepper (Info → [Business Type] → Documents) ── */
function MiniStepper({
  items,
}: {
  items: { label: string; done: boolean; active: boolean }[];
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          <div className="flex items-center gap-1.5">
            <div
              className="docs-pop flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
              style={{
                background: it.done
                  ? "linear-gradient(135deg,#16A34A,#059669)"
                  : it.active
                    ? "linear-gradient(135deg,#2563EB,#7C3AED)"
                    : "#E2E8F0",
              }}
            >
              {it.done ? (
                <Check size={11} color="#fff" strokeWidth={3} />
              ) : (
                <span
                  className="text-[9px] font-bold"
                  style={{ color: it.active ? "#fff" : "#94A3B8" }}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              className="text-[11px] font-bold"
              style={{
                color: it.done ? "#16A34A" : it.active ? "#1D4ED8" : "#94A3B8",
              }}
            >
              {it.label}
            </span>
          </div>
          {i < items.length - 1 && (
            <div
              className="flex-1 h-0.5 rounded-full"
              style={{ background: it.done ? "#86EFAC" : "#E2E8F0" }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Animated gradient submit button ── */
function ContinueButton({
  isSubmitting,
  disabled,
  onClick,
}: {
  isSubmitting: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const inactive = disabled || isSubmitting;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inactive}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "11px 26px",
        borderRadius: 11,
        border: "none",
        background: inactive
          ? "linear-gradient(135deg,#94A3B8,#CBD5E1)"
          : hover
            ? "linear-gradient(135deg,#2563EB,#8B5CF6)"
            : "linear-gradient(135deg,#1D4ED8,#7C3AED)",
        color: "#fff",
        fontSize: 13.5,
        fontWeight: 700,
        cursor: inactive ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        boxShadow: inactive
          ? "none"
          : hover
            ? "0 10px 22px rgba(124,58,237,0.32)"
            : "0 4px 12px rgba(124,58,237,0.22)",
        transform: !inactive && hover ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.18s ease",
      }}
    >
      {isSubmitting ? (
        <>
          <Loader2
            size={15}
            style={{ animation: "docs-spin 1s linear infinite" }}
          />
          Saving…
        </>
      ) : (
        <>
          <Sparkles size={13} style={{ opacity: 0.9 }} />
          Continue to Bank Info
          <ArrowRight
            size={14}
            style={{
              transition: "transform 0.18s",
              transform:
                !inactive && hover ? "translateX(3px)" : "translateX(0)",
            }}
          />
        </>
      )}
    </button>
  );
}

const DocumentsStep: React.FC<DocumentsStepProps> = ({
  accountType,
  businessType: propBusinessType,
  vendorId,
  onDocumentsChange,
  onBusinessTypeChange,
  onSubmit,
  isSubmitting,
  onBack,
  showBackButton = true,
  onClearError,
  existingPersonalInfo,
  existingBankInfo,
  completeProfile,
}) => {
  const {
    data: documentsResponse,
    refetch: refetchDocuments,
    isLoading: documentsLoading,
  } = useGetDocumentsQuery(vendorId);
  const [uploadDocuments] = useUploadDocumentsMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [updatePersonalInfo] = useCreateOrUpdatePersonalInfoMutation();
  const [updateVendorProfile] = useUpdateVendorProfileMutation();

  const [selectedDocumentType, setSelectedDocumentType] = useState<
    "NID" | "PASSPORT"
  >("NID");
  const [uploadedFiles, setUploadedFiles] = useState<DocumentUploadData>({});
  const [fileErrors, setFileErrors] = useState<{ [key: string]: boolean }>({});
  const [selectedBusinessType, setSelectedBusinessType] = useState<
    "PROPRIETORSHIP" | "LIMITED_COMPANY" | "PARTNERSHIP_FIRM" | null
  >(propBusinessType || null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isSavingBusinessType, setIsSavingBusinessType] = useState(false);
  const [isSavingDocuments, setIsSavingDocuments] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    idNumber: existingPersonalInfo?.idNumber || "",
    idName: existingPersonalInfo?.idName || "",
    companyName: existingPersonalInfo?.companyName || "",
    businessRegNo: existingPersonalInfo?.businessRegNo || "",
    taxIdNumber: existingPersonalInfo?.taxIdNumber || "",
  });

  // Handles both a raw array response and a wrapped { data: [...] } response
  const existingDocuments = React.useMemo(() => {
    const res: any = documentsResponse;
    if (!res) return [];

    // Case 1: raw array — [ {...}, {...} ]
    if (Array.isArray(res)) return res;

    // Case 2: { success, data: [...] }
    if (Array.isArray(res.data)) return res.data;

    // Case 3: { success, data: { documents: [...] } }  or  { documents: [...] }
    if (Array.isArray(res.documents)) return res.documents;
    if (Array.isArray(res.data?.documents)) return res.data.documents;

    console.warn("⚠️ Unrecognized documentsResponse shape:", res);
    return [];
  }, [documentsResponse]);

  useEffect(() => {
    if (propBusinessType && accountType === "BUSINESS")
      setSelectedBusinessType(propBusinessType);
  }, [propBusinessType, accountType]);

  useEffect(() => {
    if (existingPersonalInfo) {
      setPersonalInfo({
        idNumber: existingPersonalInfo.idNumber || "",
        idName: existingPersonalInfo.idName || "",
        companyName: existingPersonalInfo.companyName || "",
        businessRegNo: existingPersonalInfo.businessRegNo || "",
        taxIdNumber: existingPersonalInfo.taxIdNumber || "",
      });
    }
  }, [existingPersonalInfo]);

  useEffect(() => {
    if (existingDocuments.length > 0 && accountType === "INDIVIDUAL") {
      const hasPassport = existingDocuments.some(
        (doc) => doc.type === "PASSPORT_FRONT" || doc.type === "PASSPORT_BACK",
      );
      const hasNID = existingDocuments.some(
        (doc) =>
          doc.type === "NATIONAL_ID_FRONT" || doc.type === "NATIONAL_ID_BACK",
      );
      if (hasPassport) setSelectedDocumentType("PASSPORT");
      else if (hasNID) setSelectedDocumentType("NID");
    }
  }, [existingDocuments, accountType]);

  const getDocumentTypeFromKey = (key: keyof DocumentUploadData): string => {
    const typeMap = {
      nidFront: "NATIONAL_ID_FRONT",
      nidBack: "NATIONAL_ID_BACK",
      passportFront: "PASSPORT_FRONT",
      passportBack: "PASSPORT_BACK",
      tradeLicense: "TRADE_LICENSE",
      rjscRegistration: "RJSC_REGISTRATION",
      tinCertificate: "TIN_CERTIFICATE",
      vatCertificate: "VAT_CERTIFICATE",
      otherDocument: "OTHER",
    } as const;
    return typeMap[key];
  };

  const isDocumentAllowedForAccountType = (documentType: string): boolean => {
    if (accountType === "INDIVIDUAL") {
      const allowedTypes = [
        "NATIONAL_ID_FRONT",
        "NATIONAL_ID_BACK",
        "PASSPORT_FRONT",
        "PASSPORT_BACK",
      ];
      return allowedTypes.includes(documentType);
    }
    return true;
  };

  const handleFileChange = (
    key: keyof DocumentUploadData,
    file: File | null,
  ) => {
    const newFiles = { ...uploadedFiles };
    const newErrors = { ...fileErrors };
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please select a smaller file.");
        newErrors[key] = true;
        setFileErrors(newErrors);
        return;
      }
      const documentType = getDocumentTypeFromKey(key);
      if (!isDocumentAllowedForAccountType(documentType)) {
        alert(
          `This document type is not allowed for ${accountType.toLowerCase()} accounts.`,
        );
        return;
      }
      newFiles[key] = file;
      delete newErrors[key];
    } else {
      delete newFiles[key];
      delete newErrors[key];
    }
    setUploadedFiles(newFiles);
    setFileErrors(newErrors);
    onDocumentsChange?.(newFiles);
    onClearError("submit");
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      setDeletingDocId(documentId);
      await deleteDocument(documentId).unwrap();
      await refetchDocuments();
    } catch (error: any) {
      const errorMessage =
        error.data?.message || error.message || "Unknown delete error";
      alert(`Delete failed: ${errorMessage}`);
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleBusinessTypeChange = async (
    type: "PROPRIETORSHIP" | "LIMITED_COMPANY" | "PARTNERSHIP_FIRM",
  ) => {
    setSelectedBusinessType(type);
    onBusinessTypeChange?.(type);
    onClearError("businessType");
    if (accountType === "BUSINESS") {
      try {
        setIsSavingBusinessType(true);
        const formData = new FormData();
        formData.append("businessType", type);
        await updateVendorProfile({ id: vendorId, formData }).unwrap();
      } catch (error: any) {
        alert("Failed to save business type. Please try again.");
      } finally {
        setIsSavingBusinessType(false);
      }
    }
  };

  const handlePersonalInfoChange = (
    field: keyof typeof personalInfo,
    value: string,
  ) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
    onClearError(field);
  };

  const getExistingDocument = (type: string): VendorDocument | undefined =>
    existingDocuments.find((doc) => doc?.type === type);

  // A document counts as "present" if it's already saved OR just selected locally (pending save)
  const isDocumentPresent = (
    documentType: string,
    fileKey: keyof DocumentUploadData,
  ): boolean => {
    return !!getExistingDocument(documentType) || !!uploadedFiles[fileKey];
  };

  const getDocumentRequirements = () => {
    if (accountType === "INDIVIDUAL") {
      return {
        nidFront: {
          required: selectedDocumentType === "NID",
          label: "NID Front Side",
        },
        nidBack: {
          required: selectedDocumentType === "NID",
          label: "NID Back Side",
        },
        passportFront: {
          required: selectedDocumentType === "PASSPORT",
          label: "Passport Front",
        },
        passportBack: { required: false, label: "Passport Back" },
      };
    }
    switch (selectedBusinessType) {
      case "PROPRIETORSHIP":
        return {
          nidFront: { required: true, label: "Owner NID Front" },
          nidBack: { required: true, label: "Owner NID Back" },
          tradeLicense: { required: true, label: "Trade License" },
          rjscRegistration: { required: true, label: "RJSC Registration" },
          tinCertificate: { required: false, label: "TIN Certificate" },
          vatCertificate: { required: false, label: "VAT Certificate" },
          otherDocument: { required: false, label: "Other Document" },
        };
      case "LIMITED_COMPANY":
      case "PARTNERSHIP_FIRM":
        return {
          nidFront: { required: true, label: "Owner NID Front" },
          nidBack: { required: true, label: "Owner NID Back" },
          tradeLicense: { required: true, label: "Trade License" },
          rjscRegistration: { required: true, label: "RJSC Registration" },
          tinCertificate: { required: true, label: "TIN Certificate" },
          vatCertificate: { required: true, label: "VAT Certificate" },
          otherDocument: { required: false, label: "Other Document" },
        };
      default:
        return {};
    }
  };

  const hasRequiredDocuments = (): boolean => {
    const requirements = getDocumentRequirements();
    if (accountType === "INDIVIDUAL") {
      if (selectedDocumentType === "NID") {
        return (
          isDocumentPresent("NATIONAL_ID_FRONT", "nidFront") &&
          isDocumentPresent("NATIONAL_ID_BACK", "nidBack")
        );
      }
      return isDocumentPresent("PASSPORT_FRONT", "passportFront");
    }
    return Object.entries(requirements).every(([key, requirement]) => {
      if (requirement.required) {
        const documentType = getDocumentTypeFromKey(
          key as keyof DocumentUploadData,
        );
        return isDocumentPresent(documentType, key as keyof DocumentUploadData);
      }
      return true;
    });
  };

  const hasRequiredPersonalInfo = (): boolean => {
    if (accountType === "INDIVIDUAL")
      return !!(personalInfo.idNumber && personalInfo.idName);
    return !!(personalInfo.companyName && personalInfo.businessRegNo);
  };

  const handleDocumentTypeChange = (type: "NID" | "PASSPORT") => {
    setSelectedDocumentType(type);
    const newFiles = { ...uploadedFiles };
    if (type === "NID") {
      delete newFiles.passportFront;
      delete newFiles.passportBack;
    } else {
      delete newFiles.nidFront;
      delete newFiles.nidBack;
    }
    setUploadedFiles(newFiles);
    onDocumentsChange?.(newFiles);
  };

  const getUploadStatus = () => {
    const requirements = getDocumentRequirements();
    let requiredCount = 0;
    let completedCount = 0;
    if (accountType === "INDIVIDUAL") {
      if (selectedDocumentType === "NID") {
        requiredCount = 2;
        completedCount =
          (isDocumentPresent("NATIONAL_ID_FRONT", "nidFront") ? 1 : 0) +
          (isDocumentPresent("NATIONAL_ID_BACK", "nidBack") ? 1 : 0);
      } else {
        requiredCount = 1;
        completedCount = isDocumentPresent("PASSPORT_FRONT", "passportFront")
          ? 1
          : 0;
      }
    } else {
      Object.entries(requirements).forEach(([key, requirement]) => {
        if (requirement.required) {
          requiredCount++;
          const documentType = getDocumentTypeFromKey(
            key as keyof DocumentUploadData,
          );
          if (isDocumentPresent(documentType, key as keyof DocumentUploadData))
            completedCount++;
        }
      });
    }
    return {
      complete: completedCount === requiredCount && requiredCount > 0,
      message: `${completedCount} of ${requiredCount} required documents ready`,
      progress: `${completedCount}/${requiredCount}`,
      completedCount,
      requiredCount,
    };
  };

  const handleSubmit = async () => {
    if (!hasRequiredDocuments()) {
      alert("Please select all required documents before continuing.");
      return;
    }
    if (!hasRequiredPersonalInfo()) {
      alert(
        "Please complete all required personal/business information fields.",
      );
      return;
    }
    if (accountType === "BUSINESS" && !selectedBusinessType) {
      alert("Please select your business type.");
      return;
    }

    try {
      setIsSavingDocuments(true);

      // 1️⃣ Upload every locally-selected file in ONE batched request
      const pendingKeys = (
        Object.keys(uploadedFiles) as (keyof DocumentUploadData)[]
      ).filter((key) => !!uploadedFiles[key]);

      if (pendingKeys.length > 0) {
        const formData = new FormData();
        pendingKeys.forEach((key) => {
          const f = uploadedFiles[key];
          if (!f) return;
          const documentType = getDocumentTypeFromKey(key);
          const uploadFieldName = DOCUMENT_FIELD_MAP[documentType];
          formData.append(uploadFieldName, f);
        });

        await uploadDocuments({ vendorId, files: formData }).unwrap();

        setUploadedFiles({});
        onDocumentsChange?.({});
        await refetchDocuments();
      }

      // 2️⃣ Save personal / business info
      await updatePersonalInfo({
        vendorId,
        data: {
          ...(accountType === "INDIVIDUAL" && {
            idNumber: personalInfo.idNumber,
            idName: personalInfo.idName,
          }),
          ...(accountType === "BUSINESS" && {
            companyName: personalInfo.companyName,
            businessRegNo: personalInfo.businessRegNo,
            taxIdNumber: personalInfo.taxIdNumber,
          }),
        },
      }).unwrap();

      // 3️⃣ Signal the wizard to move on
      onSubmit({
        documents: {},
        businessType: selectedBusinessType || undefined,
        personalInfo: {
          ...(accountType === "INDIVIDUAL" && {
            idNumber: personalInfo.idNumber,
            idName: personalInfo.idName,
          }),
          ...(accountType === "BUSINESS" && {
            companyName: personalInfo.companyName,
            businessRegNo: personalInfo.businessRegNo,
            taxIdNumber: personalInfo.taxIdNumber,
          }),
        },
      });
    } catch (error: any) {
      const errorMessage =
        error.data?.message || error.message || "Unknown error";
      alert(`Failed to save information: ${errorMessage}`);
    } finally {
      setIsSavingDocuments(false);
    }
  };

  const uploadStatus = getUploadStatus();
  const infoDone = hasRequiredPersonalInfo();
  const businessTypeDone =
    accountType === "INDIVIDUAL" ? true : !!selectedBusinessType;
  const showDocuments =
    accountType === "INDIVIDUAL" ? infoDone : businessTypeDone;
  const allComplete =
    uploadStatus.complete &&
    infoDone &&
    (accountType === "INDIVIDUAL" || !!selectedBusinessType);
  const savingBusy = isSubmitting || isSavingDocuments;

  const stepperItems =
    accountType === "BUSINESS"
      ? [
          { label: "Business Info", done: infoDone, active: !infoDone },
          {
            label: "Business Type",
            done: businessTypeDone,
            active: infoDone && !businessTypeDone,
          },
          {
            label: "Documents",
            done: uploadStatus.complete,
            active: businessTypeDone && !uploadStatus.complete,
          },
        ]
      : [
          { label: "Personal Info", done: infoDone, active: !infoDone },
          {
            label: "Documents",
            done: uploadStatus.complete,
            active: infoDone && !uploadStatus.complete,
          },
        ];

  if (documentsLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2
          size={28}
          className="text-blue-500"
          style={{ animation: "docs-spin 1s linear infinite" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="max-w-5xl mx-auto"
    >
      {/* Compact header */}
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,#2563EB,#7C3AED)",
            boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
          }}
        >
          <ShieldCheck size={18} color="#fff" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            {accountType === "INDIVIDUAL"
              ? "Identity Verification"
              : "Business Verification"}
          </h2>
          <p className="text-[12px] text-slate-500 leading-tight">
            {accountType === "INDIVIDUAL"
              ? "Upload your ID documents to verify your account"
              : "Upload business registration and owner ID documents"}
          </p>
        </div>
      </div>

      {/* Mini stepper */}
      <div className="mt-4">
        <MiniStepper items={stepperItems} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5 items-start">
        {/* ═══ Main flow ═══ */}
        <div className="space-y-4">
          {/* Step 1 — Personal / Business Info */}
          <SectionCard
            icon={
              accountType === "INDIVIDUAL" ? (
                <User size={15} color="#fff" />
              ) : (
                <Building2 size={15} color="#fff" />
              )
            }
            iconBg="linear-gradient(135deg,#2563EB,#4F46E5)"
            title={
              accountType === "INDIVIDUAL"
                ? "Personal Information"
                : "Business Information"
            }
            subtitle={
              accountType === "INDIVIDUAL"
                ? "Matches your ID document"
                : "Matches your registration papers"
            }
            done={infoDone}
          >
            {accountType === "INDIVIDUAL" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <FieldLabel required>ID Number</FieldLabel>
                  <input
                    type="text"
                    value={personalInfo.idNumber}
                    onChange={(e) =>
                      handlePersonalInfoChange("idNumber", e.target.value)
                    }
                    placeholder="NID or Passport number"
                    className={compactInputCls}
                    style={{ backgroundColor: "#F8FAFF" }}
                  />
                  {existingPersonalInfo?.idNumber && (
                    <p className="text-[10.5px] text-emerald-600 font-semibold mt-1">
                      ✓ Current: {existingPersonalInfo.idNumber}
                    </p>
                  )}
                </div>
                <div>
                  <FieldLabel required>Full Name (as on ID)</FieldLabel>
                  <input
                    type="text"
                    value={personalInfo.idName}
                    onChange={(e) =>
                      handlePersonalInfoChange("idName", e.target.value)
                    }
                    placeholder="Name as shown on ID"
                    className={compactInputCls}
                    style={{ backgroundColor: "#F8FAFF" }}
                  />
                  {existingPersonalInfo?.idName && (
                    <p className="text-[10.5px] text-emerald-600 font-semibold mt-1">
                      ✓ Current: {existingPersonalInfo.idName}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <FieldLabel required>Company Name</FieldLabel>
                  <input
                    type="text"
                    value={personalInfo.companyName}
                    onChange={(e) =>
                      handlePersonalInfoChange("companyName", e.target.value)
                    }
                    placeholder="Registered company name"
                    className={compactInputCls}
                    style={{ backgroundColor: "#F8FAFF" }}
                  />
                  {existingPersonalInfo?.companyName && (
                    <p className="text-[10.5px] text-emerald-600 font-semibold mt-1">
                      ✓ Current: {existingPersonalInfo.companyName}
                    </p>
                  )}
                </div>
                <div>
                  <FieldLabel required>Business Registration No.</FieldLabel>
                  <input
                    type="text"
                    value={personalInfo.businessRegNo}
                    onChange={(e) =>
                      handlePersonalInfoChange("businessRegNo", e.target.value)
                    }
                    placeholder="Registration number"
                    className={compactInputCls}
                    style={{ backgroundColor: "#F8FAFF" }}
                  />
                  {existingPersonalInfo?.businessRegNo && (
                    <p className="text-[10.5px] text-emerald-600 font-semibold mt-1">
                      ✓ Current: {existingPersonalInfo.businessRegNo}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>
                    Tax ID Number (TIN){" "}
                    <span className="text-slate-400 normal-case font-medium">
                      — optional
                    </span>
                  </FieldLabel>
                  <input
                    type="text"
                    value={personalInfo.taxIdNumber}
                    onChange={(e) =>
                      handlePersonalInfoChange("taxIdNumber", e.target.value)
                    }
                    placeholder="Tax Identification Number"
                    className={compactInputCls}
                    style={{ backgroundColor: "#F8FAFF" }}
                  />
                  {existingPersonalInfo?.taxIdNumber && (
                    <p className="text-[10.5px] text-emerald-600 font-semibold mt-1">
                      ✓ Current: {existingPersonalInfo.taxIdNumber}
                    </p>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Step 2 (BUSINESS only) — Business Type — reveals once info is filled */}
          {accountType === "BUSINESS" && infoDone && (
            <div key="business-type-reveal" className="docs-reveal">
              <SectionCard
                icon={<ListChecks size={15} color="#fff" />}
                iconBg="linear-gradient(135deg,#D97706,#F59E0B)"
                title="Business Type"
                subtitle={
                  isSavingBusinessType
                    ? "Saving…"
                    : "Choose the structure that matches your registration"
                }
                done={businessTypeDone}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        type: "PROPRIETORSHIP" as const,
                        icon: <Store size={16} />,
                        label: "Proprietorship",
                      },
                      {
                        type: "LIMITED_COMPANY" as const,
                        icon: <Building2 size={16} />,
                        label: "Limited Company",
                      },
                      {
                        type: "PARTNERSHIP_FIRM" as const,
                        icon: <Users size={16} />,
                        label: "Partnership Firm",
                      },
                    ] as const
                  ).map(({ type, icon, label }) => {
                    const selected = selectedBusinessType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleBusinessTypeChange(type)}
                        disabled={isSavingBusinessType}
                        className="flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border-2 transition-all disabled:opacity-50"
                        style={{
                          borderColor: selected ? "#F59E0B" : "#E2E8F0",
                          background: selected ? "#FFFBEB" : "#fff",
                          transform: selected ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background: selected
                              ? "linear-gradient(135deg,#D97706,#F59E0B)"
                              : "#F1F5F9",
                            color: selected ? "#fff" : "#64748B",
                          }}
                        >
                          {icon}
                        </div>
                        <span
                          className="text-[11.5px] font-bold"
                          style={{ color: selected ? "#92400E" : "#475569" }}
                        >
                          {label}
                        </span>
                        {completeProfile?.businessType === type && (
                          <span className="text-[9px] text-amber-500 font-semibold">
                            Current
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!selectedBusinessType && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                    <AlertCircle size={12} /> Please select your business type
                  </p>
                )}
              </SectionCard>
            </div>
          )}

          {/* Step 3 — Documents — reveals once prerequisites are met */}
          {showDocuments && (
            <div key="documents-reveal" className="docs-reveal space-y-4">
              {accountType === "INDIVIDUAL" ? (
                <SectionCard
                  icon={<FileStack size={15} color="#fff" />}
                  iconBg="linear-gradient(135deg,#0891B2,#06B6D4)"
                  title="Identity Document"
                  subtitle="Choose which document you're uploading"
                >
                  {/* Compact segmented toggle */}
                  <div
                    className="grid grid-cols-2 gap-2 p-1 rounded-xl"
                    style={{ background: "#F1F5F9" }}
                  >
                    {(
                      [
                        {
                          type: "NID" as const,
                          icon: <CreditCard size={14} />,
                          label: "National ID",
                        },
                        {
                          type: "PASSPORT" as const,
                          icon: <FileText size={14} />,
                          label: "Passport",
                        },
                      ] as const
                    ).map(({ type, icon, label }) => {
                      const selected = selectedDocumentType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleDocumentTypeChange(type)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-bold transition-all"
                          style={{
                            background: selected ? "#fff" : "transparent",
                            color: selected ? "#0E7490" : "#64748B",
                            boxShadow: selected
                              ? "0 1px 4px rgba(0,0,0,0.08)"
                              : "none",
                          }}
                        >
                          {icon}
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3 pt-1">
                    {selectedDocumentType === "NID" ? (
                      <>
                        <FileUploadField
                          label="NID Front Side"
                          accept="image/*,.pdf"
                          file={uploadedFiles.nidFront}
                          onChange={(file) =>
                            handleFileChange("nidFront", file)
                          }
                          onDelete={() => {
                            const doc =
                              getExistingDocument("NATIONAL_ID_FRONT");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          required
                          description="Clear photo of the front side"
                          existingDocument={getExistingDocument(
                            "NATIONAL_ID_FRONT",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("NATIONAL_ID_FRONT")?.id
                          }
                          error={fileErrors.nidFront}
                        />
                        <FileUploadField
                          label="NID Back Side"
                          accept="image/*,.pdf"
                          file={uploadedFiles.nidBack}
                          onChange={(file) => handleFileChange("nidBack", file)}
                          onDelete={() => {
                            const doc = getExistingDocument("NATIONAL_ID_BACK");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          required
                          description="Clear photo of the back side"
                          existingDocument={getExistingDocument(
                            "NATIONAL_ID_BACK",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("NATIONAL_ID_BACK")?.id
                          }
                          error={fileErrors.nidBack}
                        />
                      </>
                    ) : (
                      <>
                        <FileUploadField
                          label="Passport Photo Page"
                          accept="image/*,.pdf"
                          file={uploadedFiles.passportFront}
                          onChange={(file) =>
                            handleFileChange("passportFront", file)
                          }
                          onDelete={() => {
                            const doc = getExistingDocument("PASSPORT_FRONT");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          required
                          description="Clear photo of the photo page"
                          existingDocument={getExistingDocument(
                            "PASSPORT_FRONT",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("PASSPORT_FRONT")?.id
                          }
                          error={fileErrors.passportFront}
                        />
                        <FileUploadField
                          label="Passport Back Page"
                          accept="image/*,.pdf"
                          file={uploadedFiles.passportBack}
                          onChange={(file) =>
                            handleFileChange("passportBack", file)
                          }
                          onDelete={() => {
                            const doc = getExistingDocument("PASSPORT_BACK");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          description="If it contains extra information"
                          existingDocument={getExistingDocument(
                            "PASSPORT_BACK",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("PASSPORT_BACK")?.id
                          }
                          error={fileErrors.passportBack}
                        />
                      </>
                    )}
                  </div>
                </SectionCard>
              ) : (
                selectedBusinessType && (
                  <>
                    <SectionCard
                      icon={<User size={15} color="#fff" />}
                      iconBg="linear-gradient(135deg,#2563EB,#4F46E5)"
                      title="Owner Identification"
                    >
                      <div className="space-y-3">
                        <FileUploadField
                          label="Owner NID Front Side"
                          accept="image/*,.pdf"
                          file={uploadedFiles.nidFront}
                          onChange={(file) =>
                            handleFileChange("nidFront", file)
                          }
                          onDelete={() => {
                            const doc =
                              getExistingDocument("NATIONAL_ID_FRONT");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          required
                          description="Front side of owner's National ID"
                          existingDocument={getExistingDocument(
                            "NATIONAL_ID_FRONT",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("NATIONAL_ID_FRONT")?.id
                          }
                          error={fileErrors.nidFront}
                        />
                        <FileUploadField
                          label="Owner NID Back Side"
                          accept="image/*,.pdf"
                          file={uploadedFiles.nidBack}
                          onChange={(file) => handleFileChange("nidBack", file)}
                          onDelete={() => {
                            const doc = getExistingDocument("NATIONAL_ID_BACK");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          required
                          description="Back side of owner's National ID"
                          existingDocument={getExistingDocument(
                            "NATIONAL_ID_BACK",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("NATIONAL_ID_BACK")?.id
                          }
                          error={fileErrors.nidBack}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={<FileStack size={15} color="#fff" />}
                      iconBg="linear-gradient(135deg,#16A34A,#059669)"
                      title="Business Documents"
                    >
                      <div className="space-y-3">
                        <FileUploadField
                          label="Trade License"
                          accept="image/*,.pdf"
                          file={uploadedFiles.tradeLicense}
                          onChange={(file) =>
                            handleFileChange("tradeLicense", file)
                          }
                          onDelete={() => {
                            const doc = getExistingDocument("TRADE_LICENSE");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          required
                          description="Official trade license"
                          existingDocument={getExistingDocument(
                            "TRADE_LICENSE",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("TRADE_LICENSE")?.id
                          }
                          error={fileErrors.tradeLicense}
                        />
                        <FileUploadField
                          label="RJSC Registration"
                          accept="image/*,.pdf"
                          file={uploadedFiles.rjscRegistration}
                          onChange={(file) =>
                            handleFileChange("rjscRegistration", file)
                          }
                          onDelete={() => {
                            const doc =
                              getExistingDocument("RJSC_REGISTRATION");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          required
                          description="RJSC registration certificate"
                          existingDocument={getExistingDocument(
                            "RJSC_REGISTRATION",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("RJSC_REGISTRATION")?.id
                          }
                          error={fileErrors.rjscRegistration}
                        />
                        <FileUploadField
                          label="TIN Certificate"
                          accept="image/*,.pdf"
                          file={uploadedFiles.tinCertificate}
                          onChange={(file) =>
                            handleFileChange("tinCertificate", file)
                          }
                          onDelete={() => {
                            const doc = getExistingDocument("TIN_CERTIFICATE");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          required={selectedBusinessType !== "PROPRIETORSHIP"}
                          description="Tax ID certificate"
                          existingDocument={getExistingDocument(
                            "TIN_CERTIFICATE",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("TIN_CERTIFICATE")?.id
                          }
                          error={fileErrors.tinCertificate}
                        />
                        <FileUploadField
                          label="VAT Certificate"
                          accept="image/*,.pdf"
                          file={uploadedFiles.vatCertificate}
                          onChange={(file) =>
                            handleFileChange("vatCertificate", file)
                          }
                          onDelete={() => {
                            const doc = getExistingDocument("VAT_CERTIFICATE");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          required={selectedBusinessType !== "PROPRIETORSHIP"}
                          description="VAT registration certificate"
                          existingDocument={getExistingDocument(
                            "VAT_CERTIFICATE",
                          )}
                          isDeleting={
                            deletingDocId ===
                            getExistingDocument("VAT_CERTIFICATE")?.id
                          }
                          error={fileErrors.vatCertificate}
                        />
                        <FileUploadField
                          label="Other Business Document"
                          accept="image/*,.pdf"
                          file={uploadedFiles.otherDocument}
                          onChange={(file) =>
                            handleFileChange("otherDocument", file)
                          }
                          onDelete={() => {
                            const doc = getExistingDocument("OTHER");
                            if (doc) handleDeleteDocument(doc.id);
                          }}
                          description="Any other relevant document"
                          existingDocument={getExistingDocument("OTHER")}
                          isDeleting={
                            deletingDocId === getExistingDocument("OTHER")?.id
                          }
                          error={fileErrors.otherDocument}
                        />
                      </div>
                    </SectionCard>
                  </>
                )
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-1">
            {showBackButton ? (
              <button
                type="button"
                onClick={onBack}
                disabled={savingBusy}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                <ArrowLeft size={13} />
                Back
              </button>
            ) : (
              <div />
            )}
            {/* Navigation */}
            <div className="flex justify-between items-center pt-1">
             
              <ContinueButton
                isSubmitting={savingBusy}
                disabled={!allComplete}
                onClick={handleSubmit}
              />
            </div>
          </div>
        </div>

        {/* ═══ Sidebar — compact sticky checklist ═══ */}
        <div className="lg:sticky lg:top-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between gap-2 px-4 py-3"
              style={{ background: "linear-gradient(135deg,#EFF6FF,#F5F3FF)" }}
            >
              <div className="flex items-center gap-2">
                <ListChecks size={14} className="text-blue-500" />
                <span className="text-[12px] font-black text-slate-800">
                  Checklist
                </span>
              </div>
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{
                  background: allComplete ? "#DCFCE7" : "#FEF3C7",
                  color: allComplete ? "#15803D" : "#92400E",
                }}
              >
                {uploadStatus.progress}
              </span>
            </div>
            <div className="p-3.5 space-y-2">
              <ChecklistRow
                done={infoDone}
                label={
                  accountType === "INDIVIDUAL"
                    ? "Personal info"
                    : "Business info"
                }
              />
              {accountType === "BUSINESS" && (
                <ChecklistRow
                  done={businessTypeDone}
                  label="Business type selected"
                />
              )}
              <ChecklistRow
                done={uploadStatus.complete}
                label={`Documents (${uploadStatus.progress})`}
              />
            </div>
          </div>

          {/* Collapsible tips (kept out of the way by default) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowChecklist((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-[12px] font-black text-slate-700">
                Upload tips
              </span>
              <ChevronDown
                size={14}
                className="text-slate-400"
                style={{
                  transition: "transform 0.2s",
                  transform: showChecklist ? "rotate(180deg)" : "none",
                }}
              />
            </button>
            {showChecklist && (
              <div className="docs-reveal px-4 pb-4">
                <ul className="text-[11.5px] text-slate-500 space-y-1.5 leading-snug">
                  <li>• Clear, readable photos only</li>
                  <li>• Max file size: 5MB</li>
                  <li>• Formats: JPG, PNG, PDF</li>
                  <li>• All files upload together when you click Continue</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChecklistRow = ({ done, label }: { done: boolean; label: string }) => (
  <div className="flex items-center gap-2">
    {done ? (
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#16A34A,#059669)" }}
      >
        <Check size={9} color="#fff" strokeWidth={3.5} />
      </div>
    ) : (
      <Circle size={16} className="text-slate-300 flex-shrink-0" />
    )}
    <span
      className="text-[12px]"
      style={{
        color: done ? "#15803D" : "#64748B",
        fontWeight: done ? 700 : 500,
      }}
    >
      {label}
    </span>
  </div>
);

export default DocumentsStep;
