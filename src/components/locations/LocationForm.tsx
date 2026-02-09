// components/locations/bulk-upload.tsx - Updated for Sonner
"use client";

import React, { useState } from "react";
import { Upload, Download, X, AlertCircle, CheckCircle, File } from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useBulkUploadLocationsMutation } from "@/features/locationApi";

interface BulkUploadProps {
  open: boolean;
  onClose: () => void;
}

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
        toast.error("File too large or invalid format");
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Locations</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to create multiple locations at once
          </DialogDescription>
        </DialogHeader>

        {uploadResult ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">Upload Complete</h4>
                  <p className="text-sm text-green-700">
                    Your file has been processed successfully
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadResult.divisions.created + uploadResult.divisions.updated}
                </div>
                <div className="text-sm text-gray-600">Divisions</div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.districts.created + uploadResult.districts.updated}
                </div>
                <div className="text-sm text-gray-600">Districts</div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {uploadResult.thanas.created + uploadResult.thanas.updated}
                </div>
                <div className="text-sm text-gray-600">Thanas</div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium text-red-800">
                    Errors ({uploadResult.errors.length})
                  </h4>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {uploadResult.errors.slice(0, 5).map((error: any, index: number) => (
                    <div key={index} className="text-sm text-red-700">
                      <span className="font-medium">Row {error.row}:</span>{" "}
                      {error.message}
                    </div>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <div className="text-sm text-red-600">
                      ... and {uploadResult.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="font-medium mb-2">
                {isDragActive ? "Drop file here" : "Drag & drop your file here"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <p className="text-xs text-gray-400">
                Supports: CSV, Excel (Max 10MB)
              </p>
            </div>

            {file && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {isUploading && <Progress value={66} className="mt-4" />}
              </div>
            )}

            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800">File Format</h4>
                  <p className="text-sm text-blue-700">
                    Required columns: Division, District, Thana, DivisionCode,
                    DistrictCode, ThanaCode, IsCodSupported, IsDgCodSupported
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="mt-2"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            {uploadResult ? "Close" : "Cancel"}
          </Button>
          {!uploadResult && file && (
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}