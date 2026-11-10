// src/app/admin-dashboard/@main/settings/banks/page.tsx
"use client";
import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCreateBankMutation,
  useUpdateBankMutation,
  useDeleteBankMutation,
  useCreateBankBranchMutation,
  useUpdateBankBranchMutation,
  useDeleteBankBranchMutation,
  useGetBanksQuery,
  useGetBankBranchesQuery,
  useDownloadBankTemplateMutation,
  useBulkImportBanksMutation,
  type BankImportSummary,
  type BankBranch,
  type Bank,
} from "@/features/bankApi";
import {
  Loader2,
  Download,
  Upload,
  Landmark,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  X,
  Sparkles,
  AlertCircle,
  Check,
  Plus,
  ChevronRight as Arrow,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";

/* ─── Small reusable bits, compact sizing ────────────────────────────────── */

function IconButton({
  icon,
  onClick,
  variant = "outline",
  loading,
  disabled,
  label,
  danger,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "outline";
  loading?: boolean;
  disabled?: boolean;
  label: string;
  danger?: boolean;
}) {
  const isDisabled = disabled || loading;
  const primary = variant === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: primary ? "none" : `1.5px solid ${danger ? "#FECACA" : "#E2E8F0"}`,
        background: isDisabled
          ? "#E2E8F0"
          : primary
            ? "linear-gradient(135deg,#1D4ED8,#7C3AED)"
            : danger
              ? "#FEF2F2"
              : "#fff",
        color: isDisabled ? "#94A3B8" : primary ? "#fff" : danger ? "#DC2626" : "#334155",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {loading ? (
        <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        icon
      )}
      {label}
    </button>
  );
}

function RowIconButton({
  icon,
  onClick,
  loading,
  danger,
  title,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  danger?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={loading}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: `1.5px solid ${danger ? "#FECACA" : "#DBEAFE"}`,
        background: danger ? "#FEF2F2" : "#EFF6FF",
        color: danger ? "#DC2626" : "#1D4ED8",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : icon}
    </button>
  );
}

function FilterInput({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
      <div
        style={{
          position: "absolute",
          left: 9,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#94A3B8",
          display: "flex",
        }}
      >
        {icon}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "7px 10px 7px 30px",
          borderRadius: 8,
          border: "1.5px solid #E2E8F0",
          fontSize: 12.5,
          fontFamily: "inherit",
          outline: "none",
          background: "#fff",
        }}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  flex = "1 1 160px",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  flex?: string;
}) {
  return (
    <div style={{ flex }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "7px 10px",
          borderRadius: 8,
          border: "1.5px solid #E2E8F0",
          fontSize: 12.5,
          marginTop: 4,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

/* ─── Modal shell shared by the two edit modals ──────────────────────────── */

function ModalShell({
  title,
  onClose,
  children,
  maxWidth = 460,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth,
          padding: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1B2E" }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#F1F5F9",
              borderRadius: 6,
              width: 24,
              height: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={13} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Edit Bank modal ─────────────────────────────────────────────────────── */

function EditBankModal({ bank, onClose }: { bank: Bank; onClose: () => void }) {
  const [name, setName] = useState(bank.name);
  const [code, setCode] = useState(bank.code ?? "");
  const [swiftCode, setSwiftCode] = useState(bank.swiftCode ?? "");
  const [updateBank, { isLoading }] = useUpdateBankMutation();

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Bank name is required");
      return;
    }
    try {
      await updateBank({
        bankId: bank.id,
        name: name.trim(),
        code: code.trim() || undefined,
        swiftCode: swiftCode.trim() || undefined,
      }).unwrap();
      toast.success("Bank updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update bank");
    }
  }, [bank.id, name, code, swiftCode, updateBank, onClose]);

  return (
    <ModalShell title={`Edit ${bank.name}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <TextField label="Bank Name" required value={name} onChange={setName} />
        <div style={{ display: "flex", gap: 8 }}>
          <TextField label="Code" value={code} onChange={setCode} placeholder="Optional" />
          <TextField label="SWIFT Code" value={swiftCode} onChange={setSwiftCode} placeholder="Optional" />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <IconButton icon={<X size={13} />} label="Cancel" onClick={onClose} />
        <IconButton
          icon={<Sparkles size={13} />}
          label="Save Changes"
          variant="primary"
          loading={isLoading}
          disabled={!name.trim()}
          onClick={handleSubmit}
        />
      </div>
    </ModalShell>
  );
}

/* ─── Edit Branch modal ───────────────────────────────────────────────────── */

function EditBranchModal({ branch, onClose }: { branch: BankBranch; onClose: () => void }) {
  const [branchName, setBranchName] = useState(branch.branchName);
  const [routingNumber, setRoutingNumber] = useState(branch.routingNumber ?? "");
  const [updateBankBranch, { isLoading }] = useUpdateBankBranchMutation();

  const handleSubmit = useCallback(async () => {
    if (!branchName.trim()) {
      toast.error("Branch name is required");
      return;
    }
    try {
      await updateBankBranch({
        branchId: branch.id,
        branchName: branchName.trim(),
        routingNumber: routingNumber.trim() || undefined,
      }).unwrap();
      toast.success("Branch updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update branch");
    }
  }, [branch.id, branchName, routingNumber, updateBankBranch, onClose]);

  return (
    <ModalShell title={`Edit ${branch.branchName}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <TextField label="Branch Name" required value={branchName} onChange={setBranchName} />
        <TextField label="Routing Number" value={routingNumber} onChange={setRoutingNumber} placeholder="Optional" />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <IconButton icon={<X size={13} />} label="Cancel" onClick={onClose} />
        <IconButton
          icon={<Sparkles size={13} />}
          label="Save Changes"
          variant="primary"
          loading={isLoading}
          disabled={!branchName.trim()}
          onClick={handleSubmit}
        />
      </div>
    </ModalShell>
  );
}

/* ─── Upload modal (compact, only shown when opened) ─────────────────────── */

function UploadPanel({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [summary, setSummary] = useState<BankImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutation, not a lazy query — downloadBankTemplate returns a Blob, and
  // caching a Blob in the RTK Query "queries" state trips the
  // serializableCheck middleware. A mutation's result isn't cached the
  // same way, so it never lands in the store.
  const [downloadTemplate, { isLoading: isDownloading }] =
    useDownloadBankTemplateMutation();
  const [bulkImportBanks, { isLoading: isImporting }] =
    useBulkImportBanksMutation();

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await downloadTemplate().unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bank_branch_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to download template");
    }
  }, [downloadTemplate]);

  const validateAndSetFile = useCallback((file: File | undefined) => {
    if (!file) return;
    const isXlsx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.name.toLowerCase().endsWith(".xlsx");
    if (!isXlsx) {
      toast.error("Only .xlsx files are accepted");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must not exceed 2MB");
      return;
    }
    setSelectedFile(file);
    setSummary(null);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const result = await bulkImportBanks(formData).unwrap();
      setSummary(result);
      if (result.failed === 0) {
        toast.success(`${result.imported} branches imported`);
        onImported();
        setTimeout(onClose, 900);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to import branches");
    }
  }, [selectedFile, bulkImportBanks, onImported, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 460,
          padding: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1B2E" }}>
            Bulk Upload Branches
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#F1F5F9",
              borderRadius: 6,
              width: 24,
              height: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={13} />
          </button>
        </div>

        <button
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1.5px solid #DBEAFE",
            background: "#EFF6FF",
            color: "#1D4ED8",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {isDownloading ? (
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Download size={13} />
          )}
          Download Template
        </button>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            validateAndSetFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${
              isDragging ? "#7C3AED" : selectedFile ? "#6EE7B7" : "#CBD5E1"
            }`,
            borderRadius: 10,
            background: isDragging
              ? "#F5F3FF"
              : selectedFile
                ? "#F0FDF4"
                : "#FAFBFD",
            padding: "18px 14px",
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => validateAndSetFile(e.target.files?.[0])}
            style={{ display: "none" }}
          />
          {selectedFile ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <FileSpreadsheet size={18} color="#16A34A" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>
                {selectedFile.name}
              </span>
            </div>
          ) : (
            <>
              <Upload size={20} color="#94A3B8" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>
                Drop .xlsx or click to browse
              </div>
            </>
          )}
        </div>

        {summary && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 10px",
              borderRadius: 8,
              background: summary.failed === 0 ? "#F0FDF4" : "#FFFBEB",
              fontSize: 11.5,
              color: summary.failed === 0 ? "#15803D" : "#92400E",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {summary.failed === 0 ? <Check size={13} /> : <AlertCircle size={13} />}
            {summary.imported} imported, {summary.failed} failed
            {summary.banksCreated > 0 ? ` · ${summary.banksCreated} new bank(s)` : ""}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <IconButton icon={<X size={13} />} label="Cancel" onClick={onClose} />
          <IconButton
            icon={<Sparkles size={13} />}
            label="Import"
            variant="primary"
            loading={isImporting}
            disabled={!selectedFile}
            onClick={handleUpload}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Inline collapsible "Add Bank" form ─────────────────────────────────── */

function AddBankInlinePanel({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [createBank, { isLoading }] = useCreateBankMutation();

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Bank name is required");
      return;
    }
    try {
      await createBank({
        name: name.trim(),
        code: code.trim() || undefined,
        swiftCode: swiftCode.trim() || undefined,
      }).unwrap();
      toast.success("Bank added");
      setName("");
      setCode("");
      setSwiftCode("");
      onAdded?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add bank");
    }
  }, [name, code, swiftCode, createBank, onAdded, onClose]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.32s ease",
        marginBottom: open ? 12 : 0,
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5EAF2",
            borderRadius: 12,
            padding: 14,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <TextField label="Bank Name" required value={name} onChange={setName} placeholder="e.g. Sonali Bank" flex="1 1 220px" />
          <TextField label="Code" value={code} onChange={setCode} placeholder="Optional" />
          <TextField label="SWIFT Code" value={swiftCode} onChange={setSwiftCode} placeholder="Optional" />
          <IconButton
            icon={<Sparkles size={13} />}
            label="Save Bank"
            variant="primary"
            loading={isLoading}
            disabled={!name.trim()}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Inline collapsible "Add Branch" form ───────────────────────────────── */

function AddBranchInlinePanel({
  open,
  onClose,
  onAdded,
  banks,
  banksLoading,
  presetBankId,
}: {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
  banks: { id: string; name: string }[];
  banksLoading: boolean;
  presetBankId?: string | null;
}) {
  const [bankId, setBankId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [createBankBranch, { isLoading }] = useCreateBankBranchMutation();

  // When opened for a specific bank (row-level "+ Branch" action), preselect it.
  useEffect(() => {
    if (open && presetBankId) setBankId(presetBankId);
  }, [open, presetBankId]);

  const resetForm = () => {
    setBankId(presetBankId || "");
    setBranchName("");
    setRoutingNumber("");
  };

  const handleSubmit = useCallback(async () => {
    if (!bankId) {
      toast.error("Please select a bank");
      return;
    }
    if (!branchName.trim()) {
      toast.error("Branch name is required");
      return;
    }
    try {
      await createBankBranch({
        bankId,
        branchName: branchName.trim(),
        routingNumber: routingNumber.trim() || undefined,
      }).unwrap();
      toast.success("Branch added");
      resetForm();
      onAdded?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add branch");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankId, branchName, routingNumber, createBankBranch, onAdded, onClose]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.32s ease",
        marginBottom: open ? 12 : 0,
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5EAF2",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
                Bank <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                disabled={banksLoading}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1.5px solid #E2E8F0",
                  fontSize: 12.5,
                  marginTop: 4,
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              >
                <option value="">{banksLoading ? "Loading banks…" : "Select a bank"}</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <TextField label="Branch Name" required value={branchName} onChange={setBranchName} placeholder="e.g. Gulshan Branch" flex="1 1 220px" />
            <TextField label="Routing Number" value={routingNumber} onChange={setRoutingNumber} placeholder="Optional" />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <IconButton icon={<X size={13} />} label="Cancel" onClick={onClose} />
            <IconButton
              icon={<Sparkles size={13} />}
              label="Save Branch"
              variant="primary"
              loading={isLoading}
              disabled={!bankId || !branchName.trim()}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Branches table (server-side filter + pagination) ──────────────────── */

const BRANCH_PAGE_SIZE = 10;

function BranchesTable({
  banks,
  banksLoading,
}: {
  banks: { id: string; name: string }[];
  banksLoading: boolean;
}) {
  const [bankNameFilter, setBankNameFilter] = useState("");
  const [branchNameFilter, setBranchNameFilter] = useState("");
  const [routingFilter, setRoutingFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BankBranch | null>(null);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [deleteBankBranch] = useDeleteBankBranchMutation();

  const { data, isLoading, isFetching, refetch } = useGetBankBranchesQuery({
    bankName: bankNameFilter || undefined,
    branchName: branchNameFilter || undefined,
    routingNumber: routingFilter || undefined,
    page,
    limit: BRANCH_PAGE_SIZE,
  });

  const branches = data?.data ?? [];
  const pagination = data?.pagination;

  const clearFilters = () => {
    setBankNameFilter("");
    setBranchNameFilter("");
    setRoutingFilter("");
    setPage(1);
  };

  const handleDeactivate = useCallback(
    async (branch: BankBranch) => {
      if (!confirm(`Deactivate branch "${branch.branchName}"? It will disappear from selection lists but stay in past records.`)) return;
      setDeletingBranchId(branch.id);
      try {
        await deleteBankBranch(branch.id).unwrap();
        toast.success(`${branch.branchName} deactivated`);
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to deactivate branch");
      } finally {
        setDeletingBranchId(null);
      }
    },
    [deleteBankBranch]
  );

  const hasFilters = bankNameFilter || branchNameFilter || routingFilter;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1B2E" }}>
          Branches
        </div>
        <IconButton
          icon={showAddBranch ? <X size={13} /> : <Plus size={13} />}
          label={showAddBranch ? "Close" : "Add Branch"}
          onClick={() => setShowAddBranch((v) => !v)}
        />
      </div>

      <AddBranchInlinePanel
        open={showAddBranch}
        onClose={() => setShowAddBranch(false)}
        onAdded={() => {
          setPage(1);
          refetch();
        }}
        banks={banks}
        banksLoading={banksLoading}
      />

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
          background: "#fff",
          border: "1px solid #E5EAF2",
          borderRadius: 10,
          padding: 10,
        }}
      >
        <FilterInput
          icon={<Search size={13} />}
          placeholder="Filter by bank name…"
          value={bankNameFilter}
          onChange={(v) => {
            setBankNameFilter(v);
            setPage(1);
          }}
        />
        <FilterInput
          icon={<Search size={13} />}
          placeholder="Filter by branch name…"
          value={branchNameFilter}
          onChange={(v) => {
            setBranchNameFilter(v);
            setPage(1);
          }}
        />
        <FilterInput
          icon={<Search size={13} />}
          placeholder="Filter by routing number…"
          value={routingFilter}
          onChange={(v) => {
            setRoutingFilter(v);
            setPage(1);
          }}
        />
        {hasFilters && (
          <IconButton icon={<X size={12} />} label="Clear" onClick={clearFilters} />
        )}
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5EAF2",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "#FAFBFD", borderBottom: "1px solid #E5EAF2" }}>
                {["Bank", "Branch", "Routing No.", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Actions" ? "right" : "left",
                      padding: "9px 12px",
                      fontWeight: 700,
                      color: "#64748B",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: "center" }}>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: 28, textAlign: "center", color: "#9BAABB", fontSize: 12.5 }}
                  >
                    {hasFilters ? "No branches match your filters" : "No branches added yet"}
                  </td>
                </tr>
              ) : (
                branches.map((branch: BankBranch) => (
                  <tr key={branch.id} style={{ borderBottom: "1px solid #F0F4FA" }}>
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            background: "#EEF3FB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MapPin size={13} color="#1D4ED8" />
                        </div>
                        <span style={{ fontWeight: 700, color: "#0D1B2E" }}>
                          {branch.bankName || "—"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "9px 12px", color: "#334155" }}>{branch.branchName}</td>
                    <td style={{ padding: "9px 12px", color: "#334155" }}>{branch.routingNumber || "—"}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: branch.isActive ? "#F0F9F0" : "#FEF2F2",
                          color: branch.isActive ? "#16A34A" : "#DC2626",
                          border: `1px solid ${branch.isActive ? "#BBF7D0" : "#FECACA"}`,
                        }}
                      >
                        {branch.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <RowIconButton
                          icon={<Pencil size={12} />}
                          title="Edit branch"
                          onClick={() => setEditingBranch(branch)}
                        />
                        <RowIconButton
                          icon={<Trash2 size={12} />}
                          title="Deactivate branch"
                          danger
                          loading={deletingBranchId === branch.id}
                          onClick={() => handleDeactivate(branch)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (server-driven) */}
        {pagination && pagination.total > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderTop: "1px solid #E5EAF2",
              fontSize: 11.5,
              color: "#7A90AB",
            }}
          >
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total}
              {isFetching ? "  ·  updating…" : ""}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  background: "#fff",
                  cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                  opacity: pagination.page <= 1 ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={13} />
              </button>
              <span style={{ padding: "0 6px", fontWeight: 700, color: "#334155" }}>
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  background: "#fff",
                  cursor: pagination.page >= pagination.pages ? "not-allowed" : "pointer",
                  opacity: pagination.page >= pagination.pages ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editingBranch && (
        <EditBranchModal branch={editingBranch} onClose={() => setEditingBranch(null)} />
      )}
    </div>
  );
}

/* ─── Main page — Banks + Branches tabs ──────────────────────────────────── */

const PAGE_SIZE = 10;

export default function BankListPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"banks" | "branches">("banks");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [branchPresetBankId, setBranchPresetBankId] = useState<string | null>(null);
  const [showRowAddBranch, setShowRowAddBranch] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [deletingBankId, setDeletingBankId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetBanksQuery();
  const [deleteBank] = useDeleteBankMutation();
  const allBanks = data?.data ?? [];
  const bankOptions = useMemo(
    () => allBanks.map((b) => ({ id: b.id, name: b.name })),
    [allBanks]
  );

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return allBanks;
    const q = search.trim().toLowerCase();
    return allBanks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.code ?? "").toLowerCase().includes(q) ||
        (b.swiftCode ?? "").toLowerCase().includes(q)
    );
  }, [allBanks, search]);

  const totalPages = Math.max(1, Math.ceil(filteredBanks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedBanks = filteredBanks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openBranchFormForBank = (bankId: string) => {
    setBranchPresetBankId(bankId);
    setShowRowAddBranch(true);
    setTab("branches");
  };

  const handleDeactivateBank = useCallback(
    async (bank: Bank) => {
      if (
        !confirm(
          `Deactivate "${bank.name}"? Its branches will also be deactivated. This won't affect existing accounts or past records.`
        )
      )
        return;
      setDeletingBankId(bank.id);
      try {
        await deleteBank(bank.id).unwrap();
        toast.success(`${bank.name} deactivated`);
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to deactivate bank");
      } finally {
        setDeletingBankId(null);
      }
    },
    [deleteBank]
  );

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
        width: "100%",
        padding: "18px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Landmark size={18} color="#1D4ED8" />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0D1B2E" }}>
              Bank &amp; Branch Master List
            </span>
          </div>
          {tab === "banks" && (
            <div style={{ display: "flex", gap: 8 }}>
              <IconButton
                icon={showAddForm ? <X size={13} /> : <Plus size={13} />}
                label={showAddForm ? "Close" : "Add Bank"}
                onClick={() => setShowAddForm((v) => !v)}
              />
              <IconButton
                icon={<Upload size={13} />}
                label="Bulk Upload"
                variant="primary"
                onClick={() => setShowUpload(true)}
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "inline-flex",
            gap: 4,
            background: "#E9EEF6",
            padding: 4,
            borderRadius: 10,
            marginBottom: 14,
          }}
        >
          {(
            [
              { key: "banks", label: "Banks" },
              { key: "branches", label: "Branches" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                background: tab === t.key ? "#fff" : "transparent",
                color: tab === t.key ? "#1D4ED8" : "#64748B",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "banks" ? (
          <>
            {/* Inline collapsible add-bank form */}
            <AddBankInlinePanel
              open={showAddForm}
              onClose={() => setShowAddForm(false)}
              onAdded={refetch}
            />

            {/* Filter bar */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
                flexWrap: "wrap",
                background: "#fff",
                border: "1px solid #E5EAF2",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <FilterInput
                icon={<Search size={13} />}
                placeholder="Search bank name, code, or SWIFT…"
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
              {search && (
                <IconButton
                  icon={<X size={12} />}
                  label="Clear"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                />
              )}
            </div>

            {/* Table */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #E5EAF2",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: "#FAFBFD", borderBottom: "1px solid #E5EAF2" }}>
                      {["Bank Name", "Code", "SWIFT", "Status", "", "Actions"].map((h, i) => (
                        <th
                          key={`${h}-${i}`}
                          style={{
                            textAlign: h === "Actions" ? "right" : "left",
                            padding: "9px 12px",
                            fontWeight: 700,
                            color: "#64748B",
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 24, textAlign: "center" }}>
                          <Loader2
                            size={16}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        </td>
                      </tr>
                    ) : paginatedBanks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: 28,
                            textAlign: "center",
                            color: "#9BAABB",
                            fontSize: 12.5,
                          }}
                        >
                          {search ? "No banks match your search" : "No banks added yet"}
                        </td>
                      </tr>
                    ) : (
                      paginatedBanks.map((bank) => {
                        const badgeText =
                          (bank.code ?? bank.name)
                            .replace(/[^A-Za-z]/g, "")
                            .slice(0, 3)
                            .toUpperCase() || "—";
                        return (
                          <tr
                            key={bank.id}
                            style={{
                              borderBottom: "1px solid #F0F4FA",
                              transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#FAFBFD")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <td
                              style={{ padding: "9px 12px", cursor: "pointer" }}
                              onClick={() =>
                                router.push(`/admin-dashboard/settings/banks/${bank.id}`)
                              }
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 7,
                                    background: "#EEF3FB",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    color: "#1D4ED8",
                                  }}
                                >
                                  {badgeText}
                                </div>
                                <span style={{ fontWeight: 700, color: "#0D1B2E" }}>
                                  {bank.name}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "9px 12px", color: "#334155" }}>
                              {bank.code || "—"}
                            </td>
                            <td style={{ padding: "9px 12px", color: "#334155" }}>
                              {bank.swiftCode || "—"}
                            </td>
                            <td style={{ padding: "9px 12px" }}>
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 20,
                                  background: bank.isActive ? "#F0F9F0" : "#FEF2F2",
                                  color: bank.isActive ? "#16A34A" : "#DC2626",
                                  border: `1px solid ${
                                    bank.isActive ? "#BBF7D0" : "#FECACA"
                                  }`,
                                }}
                              >
                                {bank.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td style={{ padding: "9px 12px", textAlign: "right" }}>
                              <button
                                onClick={() => openBranchFormForBank(bank.id)}
                                style={{
                                  border: "1.5px solid #DBEAFE",
                                  background: "#EFF6FF",
                                  color: "#1D4ED8",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "4px 8px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Plus size={11} /> Branch
                              </button>
                            </td>
                            <td style={{ padding: "9px 12px", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                                <RowIconButton
                                  icon={<Pencil size={12} />}
                                  title="Edit bank"
                                  onClick={(e?: any) => {
                                    e?.stopPropagation?.();
                                    setEditingBank(bank);
                                  }}
                                />
                                <RowIconButton
                                  icon={<Trash2 size={12} />}
                                  title="Deactivate bank"
                                  danger
                                  loading={deletingBankId === bank.id}
                                  onClick={() => handleDeactivateBank(bank)}
                                />
                                <button
                                  onClick={() =>
                                    router.push(`/admin-dashboard/settings/banks/${bank.id}`)
                                  }
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: 0,
                                  }}
                                  title="View details"
                                >
                                  <Arrow size={14} color="#94A3B8" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredBanks.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderTop: "1px solid #E5EAF2",
                    fontSize: 11.5,
                    color: "#7A90AB",
                  }}
                >
                  <span>
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filteredBanks.length)} of{" "}
                    {filteredBanks.length}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: "1px solid #E2E8F0",
                        background: "#fff",
                        cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                        opacity: currentPage <= 1 ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span style={{ padding: "0 6px", fontWeight: 700, color: "#334155" }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: "1px solid #E2E8F0",
                        background: "#fff",
                        cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                        opacity: currentPage >= totalPages ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <BranchesTable banks={bankOptions} banksLoading={isLoading} />
        )}
      </div>

      {showUpload && (
        <UploadPanel onClose={() => setShowUpload(false)} onImported={refetch} />
      )}

      {editingBank && (
        <EditBankModal bank={editingBank} onClose={() => setEditingBank(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}