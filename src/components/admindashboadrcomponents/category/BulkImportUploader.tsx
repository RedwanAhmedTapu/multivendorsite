"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  Download,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileCheck,
  Settings,
  Sparkles,
  ArrowRight,
  Loader2,
  ListChecks,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  useBulkImportCategoriesMutation,
  useDownloadStandardTemplateMutation,
  useDownloadCustomTemplateMutation,
  useGetTemplateInfoQuery,
} from "../../../features/apiSlice";
import type { BulkImportResponse, RowDetail } from "../../../features/apiSlice";

/* ─── Section Card Shell (matches product form) ─────────────────────────── */

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  error,
  id,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  error?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      style={{
        background: "#fff",
        border: `1.5px solid ${error ? "#FCA5A5" : "#E5EAF2"}`,
        borderRadius: 14,
        marginBottom: 0,
        boxShadow: error
          ? "0 0 0 3px rgba(239,68,68,0.08)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid #F0F4FA",
          background: "#FAFBFD",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: error ? "#FEF2F2" : "#EEF3FB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#0D1B2E",
                letterSpacing: "-0.2px",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 1 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: "18px 18px" }}>{children}</div>
    </div>
  );
}

/* ─── Field Label ────────────────────────────────────────────────────────── */

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#3D5068",
          letterSpacing: "0.01em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {children}
      </label>
      {hint && (
        <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 2 }}>{hint}</p>
      )}
    </div>
  );
}

/* ─── Inline error ───────────────────────────────────────────────────────── */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 5,
        fontSize: 11.5,
        color: "#DC2626",
      }}
    >
      <AlertCircle size={12} />
      {message}
    </div>
  );
}

/* ─── Range Slider ──────────────────────────────────────────────────────── */

function RangeSlider({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  displayValue,
  displaySuffix,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  displayValue: string;
  displaySuffix: string;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || min)}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:h-4 
            [&::-webkit-slider-thumb]:w-4 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-[#1D4ED8]
            [&::-webkit-slider-thumb]:shadow-md"
        />
        <span className="text-xs text-gray-500 font-medium">{max}</span>
      </div>
      <div className="text-center">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "#EEF3FB",
            color: "#1D4ED8",
          }}
        >
          {displayValue} {displaySuffix}
        </span>
      </div>
    </div>
  );
}

/* ─── Action Button ─────────────────────────────────────────────────────── */

function ActionButton({
  isLoading,
  onClick,
  variant = "primary",
  children,
  icon,
  disabled,
}: {
  isLoading?: boolean;
  onClick: () => void;
  variant?: "primary" | "outline";
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled || isLoading}
      style={{
        padding: "11px 24px",
        borderRadius: 11,
        border: isPrimary ? "none" : "1.5px solid #C7D2FE",
        background: isPrimary
          ? isHovered
            ? "linear-gradient(135deg,#2563EB,#8B5CF6)"
            : "linear-gradient(135deg,#1D4ED8,#7C3AED)"
          : "#fff",
        color: isPrimary ? "#fff" : "#1D4ED8",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.01em",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        opacity: disabled || isLoading ? 0.6 : 1,
        boxShadow: isPrimary
          ? isHovered
            ? "0 10px 24px rgba(124,58,237,0.35), 0 2px 6px rgba(29,78,216,0.25)"
            : "0 4px 14px rgba(124,58,237,0.25)"
          : "none",
        transform: isPressed
          ? "scale(0.97)"
          : isHovered
            ? "translateY(-1px)"
            : "translateY(0)",
        transition: "all 0.18s ease",
      }}
    >
      {isLoading ? (
        <>
          <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
          <span>Downloading...</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

/* ─── Row Detail Card ───────────────────────────────────────────────────── */

function RowDetailCard({ detail }: { detail: RowDetail }) {
  const isImported = detail.status === "imported";
  return (
    <div
      style={{
        background: isImported ? "#F0FDF4" : "#FEF2F2",
        border: `1px solid ${isImported ? "#BBF7D0" : "#FECACA"}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: isImported ? "#DCFCE7" : "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 700,
            color: isImported ? "#15803D" : "#DC2626",
          }}
        >
          {detail.row}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0D1B2E" }}>
              {detail.path}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 8px",
                borderRadius: 12,
                background: isImported ? "#DCFCE7" : "#FEE2E2",
                color: isImported ? "#15803D" : "#DC2626",
              }}
            >
              {isImported ? "✓ Saved" : "✗ Failed"}
            </span>
          </div>
          {detail.message && (
            <p style={{ fontSize: 11, color: "#B91C1C", marginTop: 3 }}>
              {detail.message}
            </p>
          )}
          {isImported && (
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 4,
                flexWrap: "wrap",
              }}
            >
              {detail.categoriesCreated > 0 && (
                <span style={{ fontSize: 10, color: "#15803D" }}>
                  +{detail.categoriesCreated} new categories
                </span>
              )}
              {detail.categoriesReused > 0 && (
                <span style={{ fontSize: 10, color: "#64748B" }}>
                  {detail.categoriesReused} reused
                </span>
              )}
              {detail.attributesCreated > 0 && (
                <span style={{ fontSize: 10, color: "#0891B2" }}>
                  +{detail.attributesCreated} attributes
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */

export default function BulkImportUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [showRowDetails, setShowRowDetails] = useState(false);
  const [maxLevels, setMaxLevels] = useState(5);
  const [includeAttributes, setIncludeAttributes] = useState(3);
  const [importResult, setImportResult] = useState<BulkImportResponse | null>(
    null,
  );

  // RTK Query hooks
  const { data: templateInfo } = useGetTemplateInfoQuery();
  const [bulkImport, { isLoading: isUploading }] =
    useBulkImportCategoriesMutation();
  const [downloadStandard, { isLoading: downloadingStandard }] =
    useDownloadStandardTemplateMutation();
  const [downloadCustom, { isLoading: downloadingCustom }] =
    useDownloadCustomTemplateMutation();

  /**
   * Trigger browser download from Blob
   */
  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  /**
   * Download standard template — now returns raw Blob
   */
  const handleDownloadStandard = async () => {
    try {
      const blob = await downloadStandard({
        maxLevels,
        includeAttributes,
      }).unwrap();

      triggerDownload(blob, "category_template_standard.xlsx");
      toast.success("Standard template downloaded successfully! 📥");
    } catch (error: any) {
      console.error("Failed to download template:", error);
      toast.error(error?.message || "Failed to download template");
    }
  };

  /**
   * Download custom template — now returns raw Blob
   */
  const handleDownloadCustom = async () => {
    try {
      const blob = await downloadCustom({
        maxLevels,
        includeAttributes,
      }).unwrap();

      triggerDownload(blob, `category_template_${maxLevels}levels.xlsx`);
      toast.success("Custom template downloaded successfully! 📥");
    } catch (error: any) {
      console.error("Failed to download template:", error);
      toast.error(error?.message || "Failed to download template");
    }
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (
        !selectedFile.name.endsWith(".xlsx") &&
        !selectedFile.name.endsWith(".xls")
      ) {
        toast.error("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }
      // Validate file size (5MB backend limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File too large. Maximum allowed size is 5MB.");
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
      toast.info(`File selected: ${selectedFile.name}`);
    }
  };

  /**
   * Handle bulk import — works with new flat response
   */
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file before uploading");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await bulkImport(formData).unwrap();
      setImportResult(result);

      if (result.failed === 0) {
        toast.success(
          `Import completed! ✅ All ${result.imported} rows imported successfully.`,
          { duration: 5000 },
        );
      } else if (result.imported === 0) {
        toast.error(`Import failed. ❌ All ${result.failed} rows failed.`, {
          duration: 6000,
        });
      } else {
        toast.warning(
          `Import partial. ⚠️ ${result.imported} saved, ${result.failed} failed.`,
          { duration: 6000 },
        );
      }

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 4000 });
        });
      }

      // Reset file input
      setFile(null);
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      console.error("Import failed:", error);

      // RTK Query error structure
      const errorMessage =
        error?.data?.message || error?.message || "Upload failed";

      setImportResult({
        success: false,
        message: errorMessage,
        totalRows: 0,
        imported: 0,
        failed: 0,
        categoriesCreated: 0,
        categoriesReused: 0,
        attributesCreated: 0,
        categoryAttributeLinks: 0,
        warnings: [],
        errors: [{ row: 0, message: errorMessage }],
        rowDetails: [],
      });

      toast.error(errorMessage);
    }
  };

  const hasRowDetails =
    importResult &&
    importResult.rowDetails &&
    importResult.rowDetails.length > 0;
  const failedRows =
    importResult?.rowDetails?.filter((r) => r.status === "failed") || [];

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
        padding: "24px 0",
      }}
    >
      <div style={{ maxWidth: "100%", padding: "0 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* ════ Template Download Section ════ */}
          <SectionCard
            id="templateDownload"
            icon={<Download size={15} color="#1D4ED8" />}
            title="Download Template"
            subtitle="Configure and download Excel templates for bulk import"
          >
            <div style={{ marginBottom: 16 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateOptions(!showTemplateOptions)}
                style={{
                  border: "1.5px solid #C7D2FE",
                  color: "#1D4ED8",
                  background: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 9,
                  padding: "6px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Settings size={14} />
                {showTemplateOptions ? (
                  <>
                    <span>Hide Options</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>Template Options</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </Button>
            </div>

            <AnimatePresence>
              {showTemplateOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5 overflow-hidden"
                >
                  {templateInfo && (
                    <div
                      style={{
                        background: "#EEF3FB",
                        border: "1px solid #C7D2FE",
                        borderRadius: 10,
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Info size={16} color="#1D4ED8" />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0D1B2E",
                          }}
                        >
                          Template Rules
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <p style={{ fontSize: 12, color: "#3D5068" }}>
                          <strong style={{ color: "#1D4ED8" }}>Image:</strong>{" "}
                          {templateInfo.data.rules.image}
                        </p>
                        <p style={{ fontSize: 12, color: "#3D5068" }}>
                          <strong style={{ color: "#1D4ED8" }}>
                            Keywords:
                          </strong>{" "}
                          {templateInfo.data.rules.keywords}
                        </p>
                        <p style={{ fontSize: 12, color: "#3D5068" }}>
                          <strong style={{ color: "#1D4ED8" }}>Tags:</strong>{" "}
                          {templateInfo.data.rules.tags}
                        </p>
                        <p style={{ fontSize: 12, color: "#3D5068" }}>
                          <strong style={{ color: "#1D4ED8" }}>
                            Attributes:
                          </strong>{" "}
                          {templateInfo.data.rules.attributes}
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      background: "#FAFBFD",
                      border: "1px solid #E5EAF2",
                      borderRadius: 10,
                      padding: "16px 18px",
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <RangeSlider
                        label="Max Category Levels"
                        hint="How deep your category hierarchy goes"
                        value={maxLevels}
                        min={1}
                        max={15}
                        onChange={setMaxLevels}
                        displayValue={String(maxLevels)}
                        displaySuffix="levels"
                      />

                      <RangeSlider
                        label="Include Attributes"
                        hint="Number of attribute columns in template"
                        value={includeAttributes}
                        min={1}
                        max={40}
                        onChange={setIncludeAttributes}
                        displayValue={String(includeAttributes)}
                        displaySuffix="attributes"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ActionButton
                      isLoading={downloadingStandard}
                      onClick={handleDownloadStandard}
                      variant="primary"
                      icon={<Download size={15} />}
                    >
                      Standard Template
                    </ActionButton>

                    <ActionButton
                      isLoading={downloadingCustom}
                      onClick={handleDownloadCustom}
                      variant="outline"
                      icon={<FileSpreadsheet size={15} />}
                    >
                      Custom Template
                    </ActionButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* ════ Bulk Import Section ════ */}
          <SectionCard
            id="bulkImport"
            icon={<Upload size={15} color="#0891B2" />}
            title="Bulk Import Categories"
            subtitle="Upload your Excel file to import categories in bulk"
          >
            {/* Toggle Instructions */}
            <div style={{ marginBottom: 16 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstructions(!showInstructions)}
                style={{
                  border: "1.5px solid #C7D2FE",
                  color: "#1D4ED8",
                  background: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 9,
                  padding: "6px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Info size={14} />
                {showInstructions ? (
                  <>
                    <span>Hide Instructions</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>Show Instructions</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </Button>
            </div>

            {/* ════ Import Results (flat response) ════ */}
            <AnimatePresence>
              {importResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5"
                >
                  <div
                    style={{
                      background:
                        importResult.failed === 0
                          ? "#F0FDF4"
                          : importResult.imported === 0
                            ? "#FEF2F2"
                            : "#FFFBEB",
                      border: `1px solid ${importResult.failed === 0 ? "#BBF7D0" : importResult.imported === 0 ? "#FECACA" : "#FDE68A"}`,
                      borderLeft: `4px solid ${importResult.failed === 0 ? "#22C55E" : importResult.imported === 0 ? "#DC2626" : "#D97706"}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background:
                            importResult.failed === 0
                              ? "#DCFCE7"
                              : importResult.imported === 0
                                ? "#FEE2E2"
                                : "#FEF3C7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {importResult.failed === 0 ? (
                          <CheckCircle2 size={16} color="#16A34A" />
                        ) : importResult.imported === 0 ? (
                          <XCircle size={16} color="#DC2626" />
                        ) : (
                          <AlertTriangle size={16} color="#D97706" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0D1B2E",
                          }}
                        >
                          {importResult.failed === 0
                            ? "Import Successful 🎉"
                            : importResult.imported === 0
                              ? "Import Failed ⚠️"
                              : "Partial Import ⚠️"}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#3D5068",
                            marginTop: 4,
                          }}
                        >
                          {importResult.message}
                        </p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          <div
                            style={{
                              background: "#fff",
                              border: "1px solid #E5EAF2",
                              borderRadius: 8,
                              padding: "10px 12px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 10,
                                color: "#7A90AB",
                                marginBottom: 2,
                              }}
                            >
                              Total Rows
                            </p>
                            <p
                              style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: "#0D1B2E",
                              }}
                            >
                              {importResult.totalRows}
                            </p>
                          </div>
                          <div
                            style={{
                              background: "#F0FDF4",
                              border: "1px solid #BBF7D0",
                              borderRadius: 8,
                              padding: "10px 12px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 10,
                                color: "#15803D",
                                marginBottom: 2,
                              }}
                            >
                              Imported
                            </p>
                            <p
                              style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: "#14532D",
                              }}
                            >
                              {importResult.imported}
                            </p>
                          </div>
                          <div
                            style={{
                              background:
                                importResult.failed > 0 ? "#FEF2F2" : "#fff",
                              border: `1px solid ${importResult.failed > 0 ? "#FECACA" : "#E5EAF2"}`,
                              borderRadius: 8,
                              padding: "10px 12px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 10,
                                color:
                                  importResult.failed > 0
                                    ? "#B91C1C"
                                    : "#7A90AB",
                                marginBottom: 2,
                              }}
                            >
                              Failed
                            </p>
                            <p
                              style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color:
                                  importResult.failed > 0
                                    ? "#7F1D1D"
                                    : "#0D1B2E",
                              }}
                            >
                              {importResult.failed}
                            </p>
                          </div>
                          <div
                            style={{
                              background: "#fff",
                              border: "1px solid #E5EAF2",
                              borderRadius: 8,
                              padding: "10px 12px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 10,
                                color: "#7A90AB",
                                marginBottom: 2,
                              }}
                            >
                              New Categories
                            </p>
                            <p
                              style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: "#0D1B2E",
                              }}
                            >
                              {importResult.categoriesCreated}
                            </p>
                          </div>
                        </div>

                        {/* Row Details Toggle */}
                        {hasRowDetails && (
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => setShowRowDetails(!showRowDetails)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#1D4ED8",
                                background: "#EEF3FB",
                                border: "1px solid #C7D2FE",
                                borderRadius: 8,
                                padding: "6px 12px",
                                cursor: "pointer",
                              }}
                            >
                              <ListChecks size={14} />
                              {showRowDetails
                                ? "Hide Row Details"
                                : `View Row Details (${importResult.rowDetails.length})`}
                              {showRowDetails ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>

                            <AnimatePresence>
                              {showRowDetails && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden mt-3"
                                >
                                  {/* Failed rows first */}
                                  {failedRows.length > 0 && (
                                    <div className="mb-3">
                                      <p
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#7F1D1D",
                                          marginBottom: 6,
                                        }}
                                      >
                                        Failed Rows ({failedRows.length})
                                      </p>
                                      {failedRows.map((detail) => (
                                        <RowDetailCard
                                          key={detail.row}
                                          detail={detail}
                                        />
                                      ))}
                                    </div>
                                  )}

                                  {/* Imported rows */}
                                  {importResult.rowDetails.filter(
                                    (r) => r.status === "imported",
                                  ).length > 0 && (
                                    <div>
                                      <p
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#14532D",
                                          marginBottom: 6,
                                        }}
                                      >
                                        Imported Rows (
                                        {
                                          importResult.rowDetails.filter(
                                            (r) => r.status === "imported",
                                          ).length
                                        }
                                        )
                                      </p>
                                      <div className="max-h-64 overflow-y-auto">
                                        {importResult.rowDetails
                                          .filter(
                                            (r) => r.status === "imported",
                                          )
                                          .map((detail) => (
                                            <RowDetailCard
                                              key={detail.row}
                                              detail={detail}
                                            />
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Legacy errors display (fallback) */}
                        {importResult.errors &&
                          importResult.errors.length > 0 &&
                          !hasRowDetails && (
                            <div className="mt-3">
                              <p
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#7F1D1D",
                                  marginBottom: 6,
                                }}
                              >
                                Errors:
                              </p>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {importResult.errors.map((err, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      fontSize: 11,
                                      background: "#FEF2F2",
                                      border: "1px solid #FECACA",
                                      borderRadius: 6,
                                      padding: "6px 10px",
                                      color: "#B91C1C",
                                    }}
                                  >
                                    <strong style={{ color: "#7F1D1D" }}>
                                      Row {err.row}:
                                    </strong>{" "}
                                    <span>{err.message}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Warnings */}
                        {importResult.warnings &&
                          importResult.warnings.length > 0 && (
                            <div className="mt-3">
                              <p
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#92400E",
                                  marginBottom: 6,
                                }}
                              >
                                Warnings:
                              </p>
                              <div className="space-y-1">
                                {importResult.warnings.map((warning, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      fontSize: 11,
                                      background: "#FFFBEB",
                                      border: "1px solid #FDE68A",
                                      borderRadius: 6,
                                      padding: "6px 10px",
                                      color: "#92400E",
                                    }}
                                  >
                                    ⚠ {warning}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instructions */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div
                    style={{
                      background: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      borderRadius: 10,
                      padding: "14px 16px",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <AlertCircle size={16} color="#D97706" />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#78350F",
                        }}
                      >
                        Excel Template Structure
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#92400E",
                        marginBottom: 8,
                      }}
                    >
                      Your Excel file must follow this structure. Each row
                      represents a category hierarchy.
                    </p>
                    <ul
                      style={{
                        fontSize: 12,
                        color: "#92400E",
                        lineHeight: 1.7,
                        paddingLeft: 16,
                      }}
                    >
                      <li>
                        <strong>Level columns:</strong> Define category
                        hierarchy (Level 1, Level 2, etc.)
                      </li>
                      <li>
                        <strong>image:</strong> Image URL for the root category
                      </li>
                      <li>
                        <strong>keywords/tags:</strong> Comma-separated values
                      </li>
                      <li>
                        <strong>Attributes:</strong> Filterable attributes with
                        name, type, and values
                      </li>
                    </ul>
                  </div>

                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="min-w-[800px] sm:min-w-0">
                      <Table className="border border-gray-200 dark:border-gray-800">
                        <TableHeader style={{ background: "#FAFBFD" }}>
                          <TableRow>
                            {[
                              "Level 1",
                              "Level 2",
                              "Level 3",
                              "image",
                              "keywords",
                              "tags",
                              "attr_RAM",
                              "attr_RAM_type",
                              "attr_RAM_values",
                              "attr_SSD",
                              "attr_SSD_type",
                              "attr_SSD_values",
                            ].map((header) => (
                              <TableHead
                                key={header}
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#0D1B2E",
                                  whiteSpace: "nowrap",
                                  padding: "10px 12px",
                                  borderBottom: "1px solid #E5EAF2",
                                }}
                              >
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          <TableRow
                            style={{ borderBottom: "1px solid #F0F4FA" }}
                          >
                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                fontWeight: 600,
                                color: "#0D1B2E",
                              }}
                            >
                              Electronics
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              Computers
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              Laptops
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                                wordBreak: "break-all",
                              }}
                            >
                              https://example.com/laptop.jpg
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                              }}
                            >
                              laptop,computer
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                              }}
                            >
                              featured,new
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              RAM
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              SELECT
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                              }}
                            >
                              4GB,8GB,16GB,32GB
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              SSD
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              SELECT
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                              }}
                            >
                              256GB,512GB,1TB,2TB
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                fontWeight: 600,
                                color: "#0D1B2E",
                              }}
                            >
                              Electronics
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              Mobile
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              Smartphones
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                                wordBreak: "break-all",
                              }}
                            >
                              https://example.com/phone.jpg
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                              }}
                            >
                              smartphone,android
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                              }}
                            >
                              featured,new
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              RAM
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              SELECT
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                              }}
                            >
                              4GB,6GB,8GB,12GB
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              Storage
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 12,
                                padding: "10px 12px",
                                color: "#3D5068",
                              }}
                            >
                              SELECT
                            </TableCell>

                            <TableCell
                              style={{
                                fontSize: 11,
                                padding: "10px 12px",
                                color: "#7A90AB",
                              }}
                            >
                              64GB,128GB,256GB,512GB
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      background: "#EEF3FB",
                      border: "1px solid #C7D2FE",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0D1B2E",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Sparkles size={14} color="#1D4ED8" />
                      Pro Tips:
                    </p>
                    <ul
                      style={{
                        fontSize: 12,
                        color: "#3D5068",
                        lineHeight: 1.7,
                        paddingLeft: 16,
                      }}
                    >
                      <li>
                        Download the template above to get started with the
                        correct format
                      </li>
                      <li>
                        Attribute types: TEXT, NUMBER, BOOLEAN, SELECT,
                        MULTISELECT
                      </li>
                      <li>
                        Use comma-separated values for SELECT/MULTISELECT
                        attribute values
                      </li>
                      <li>Leave empty cells for unused category levels</li>
                      <li>
                        <strong>Max 500 rows</strong> and{" "}
                        <strong>5MB file size</strong> per upload
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Input Section */}
            <div style={{ marginTop: 4 }}>
              <FieldLabel hint="Supported formats: .xlsx (max 5MB, max 500 rows)">
                Upload Excel File
              </FieldLabel>
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                      style={{
                        border: "2px dashed #C7D2FE",
                        borderRadius: 12,
                        padding: "28px 24px",
                        textAlign: "center",
                        background: "#FAFBFD",
                        transition: "all 0.2s ease",
                      }}
                      className="hover:border-[#1D4ED8] hover:bg-[#EEF3FB]"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: "#EEF3FB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Upload size={22} color="#1D4ED8" />
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0D1B2E",
                            }}
                          >
                            {file
                              ? file.name
                              : "Click to upload or drag and drop"}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "#7A90AB",
                              marginTop: 4,
                            }}
                          >
                            {file
                              ? `${(file.size / 1024).toFixed(2)} KB`
                              : "Excel (.xlsx) — max 5MB, 500 rows"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <ActionButton
                  onClick={handleUpload}
                  isLoading={isUploading}
                  disabled={!file}
                  variant="primary"
                  icon={<FileCheck size={15} />}
                >
                  Process Import
                </ActionButton>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
