// components/locations/BulkUpload.tsx
"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button, Modal, Notice, cx } from "@/components/payouts/ui";
import { useBulkUploadLocationsMutation } from "@/features/locationApi";

interface BulkUploadProps {
  open: boolean;
  onClose: () => void;
}

const REQUIRED_COLUMNS = "Division, District, Thana, DivisionCode, DistrictCode, ThanaCode, IsCodSupported, IsDgCodSupported";

export default function BulkUpload({ open, onClose }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [bulkUpload] = useBulkUploadLocationsMutation();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error("File too large or invalid format (max 10MB, CSV/XLS/XLSX)");
        return;
      }
      setFile(acceptedFiles[0]);
      setUploadResult(null);
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await bulkUpload(formData).unwrap();
      setUploadResult(result.data);
      toast.success("Bulk upload completed successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      ["Division", "District", "Thana", "DivisionCode", "DistrictCode", "ThanaCode", "IsCodSupported", "IsDgCodSupported"],
      ["Dhaka", "Dhaka", "Gulshan", "DHA", "DHA-01", "GUL", "true", "false"],
      ["Chittagong", "Chittagong", "Kotwali", "CTG", "CTG-01", "KOT", "true", "true"],
    ];

    const csvContent = templateData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "location_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setUploadResult(null);
    setIsUploading(false);
    onClose();
  };

  const summaryCards = uploadResult
    ? [
        { label: "Divisions", value: uploadResult.divisions.created + uploadResult.divisions.updated, cls: "text-sky-600" },
        { label: "Districts", value: uploadResult.districts.created + uploadResult.districts.updated, cls: "text-emerald-600" },
        { label: "Thanas", value: uploadResult.thanas.created + uploadResult.thanas.updated, cls: "text-indigo-600" },
      ]
    : [];

  return (
    <Modal
      open={open}
      title="Bulk Upload Locations"
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {uploadResult ? "Close" : "Cancel"}
          </Button>
          {!uploadResult && (
            <Button onClick={handleUpload} disabled={!file} loading={isUploading}>
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          )}
        </>
      }
    >
      {uploadResult ? (
        <div className="space-y-4">
          <Notice tone="green">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Upload complete — your file has been processed successfully.
            </span>
          </Notice>

          <div className="grid grid-cols-3 gap-3">
            {summaryCards.map((c) => (
              <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className={cx("text-[20px] font-semibold tabular-nums", c.cls)}>{c.value}</div>
                <div className="text-[11px] text-slate-500">{c.label}</div>
              </div>
            ))}
          </div>

          {uploadResult.errors.length > 0 && (
            <Notice tone="red">
              <p className="mb-1.5 font-semibold">
                {uploadResult.errors.length} row{uploadResult.errors.length === 1 ? "" : "s"} failed
              </p>
              <div className="max-h-36 space-y-1 overflow-y-auto">
                {uploadResult.errors.slice(0, 5).map((error: any, index: number) => (
                  <p key={index}>Row {error.row}: {error.message}</p>
                ))}
                {uploadResult.errors.length > 5 && (
                  <p>... and {uploadResult.errors.length - 5} more errors</p>
                )}
              </div>
            </Notice>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cx(
              "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              isDragActive
                ? "border-[#4338CA] bg-indigo-50/60"
                : "border-slate-300 hover:border-[#4338CA]/60 hover:bg-slate-50/60",
            )}
          >
            <input {...getInputProps()} />
            <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-lg bg-indigo-50 text-[#4338CA]">
              <Upload className="h-5 w-5" />
            </span>
            <p className="text-[13px] font-semibold text-slate-800">
              {isDragActive ? "Drop the file here" : "Drag & drop your file here"}
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              or click to browse · CSV, XLS, XLSX · max 10MB
            </p>
          </div>

          {file && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#4338CA]" />
                <div>
                  <p className="text-[12px] font-medium text-slate-800">{file.name}</p>
                  <p className="text-[11px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {isUploading ? (
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-[#4338CA]" />
                </div>
              ) : (
                <Button size="sm" variant="ghost" title="Remove file" onClick={() => setFile(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}

          <Notice tone="violet">
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Required columns
            </p>
            <p className="break-words">{REQUIRED_COLUMNS}</p>
          </Notice>

          <div>
            <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-3.5 w-3.5" /> Download Template
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}