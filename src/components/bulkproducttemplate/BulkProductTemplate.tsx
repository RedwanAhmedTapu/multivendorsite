"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGenerateTemplateMutation } from "@/features/productApi";
import CategoryTreeSelector from "../product/vendor/productform/CategoryTreeSelector";

interface CategoryAttribute {
  isRequired: boolean;
  type: string;
  name: string;
}

const STOCK_NOTE =
  "Stock quantities are not part of this template. " +
  "After uploading products, add inventory through Purchase Orders → Receive Items.";

const BulkProductTemplate: React.FC = () => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isLeafCategory, setIsLeafCategory] = useState(false);
  const [selectedPath, setSelectedPath] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [generateDone, setGenerateDone] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);

  const [generateTemplate, { isLoading, error }] = useGenerateTemplateMutation();

  const handleCategorySelect = (
    id: string,
    path: string,
    isLeaf: boolean,
    attributes: CategoryAttribute[]
  ) => {
    setCategoryId(id);
    setIsLeafCategory(isLeaf);
    setSelectedPath(path);
    setCategoryAttributes(attributes ?? []);
    setGenerateDone(false);
  };

  const handleGenerate = async () => {
    if (!categoryId || !isLeafCategory) {
      alert("⚠️ Please select a leaf category first.");
      return;
    }
    try {
      await generateTemplate(categoryId).unwrap();
      setGenerateDone(true);
    } catch (err) {
      console.error("Generate error:", err);
      alert("❌ Failed to generate template. Please try again.");
    }
  };

  const handleDownload = async () => {
    if (!categoryId || !isLeafCategory) {
      alert("⚠️ Please select a leaf category first.");
      return;
    }
    setIsDownloading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/bulkproduct-templates/download/${categoryId}`
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message ?? "Download failed");
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      const match = contentDisposition?.match(/filename="(.+)"/);
      const filename = match ? match[1] : `template_${categoryId}.xlsx`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Download error:", err);
      alert(`❌ ${err.message ?? "Download failed. Please try again."}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateAndDownload = async () => {
    await handleGenerate();
    await handleDownload();
  };

  const requiredCount = categoryAttributes.filter((a) => a.isRequired).length;
  const optionalCount = categoryAttributes.length - requiredCount;
  const variantAttrCount = categoryAttributes.filter(
    (a) => a.type === "SELECT"
  ).length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 py-6 px-4">
     
      {/* ── Stock notice banner ─────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <p className="text-xs text-amber-800 leading-relaxed">{STOCK_NOTE}</p>
      </div>

      {/* ── Step 1: Select category ─────────────────────────────── */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <StepBadge step={1} />
            <CardTitle className="text-base font-semibold text-gray-800">
              Select a Leaf Category
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CategoryTreeSelector onSelect={handleCategorySelect} />
        </CardContent>
      </Card>

      {/* ── Selected category info ──────────────────────────────── */}
      {categoryId && (
        <Card
          className={`shadow-sm border ${
            isLeafCategory ? "border-emerald-200 bg-emerald-50/40" : "border-yellow-200 bg-yellow-50/40"
          }`}
        >
          <CardContent className="pt-4 pb-4 space-y-3">
            {/* Path + leaf badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Selected Category
                </p>
                <p className="text-sm font-semibold text-gray-800 break-words">
                  {selectedPath}
                </p>
              </div>
              {isLeafCategory ? (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Leaf Category
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Has Sub-categories
                </span>
              )}
            </div>

            {/* Non-leaf warning */}
            {!isLeafCategory && (
              <p className="text-xs text-yellow-700">
                Please navigate deeper and select a leaf category (one with no
                further sub-categories) to generate a template.
              </p>
            )}

            {/* Attribute stats — only for leaf */}
            {isLeafCategory && categoryAttributes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <StatTile label="Total Attributes" value={categoryAttributes.length} color="gray" />
                <StatTile label="Required" value={requiredCount} color="red" />
                <StatTile label="Optional" value={optionalCount} color="blue" />
                <StatTile
                  label="Variant Attrs 🔄"
                  value={variantAttrCount}
                  color="purple"
                />
              </div>
            )}

            {isLeafCategory && categoryAttributes.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                No category attributes defined. The template will contain only
                core product and variant fields.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Generate & Download ─────────────────────────── */}
      {categoryId && isLeafCategory && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <StepBadge step={2} />
              <CardTitle className="text-base font-semibold text-gray-800">
                Generate &amp; Download Template
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Individual action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Generate */}
              <div className="space-y-1.5">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className={`
                    w-full h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                    ${
                      isLoading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : generateDone
                        ? "bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                        : "bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98]"
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      Generating…
                    </>
                  ) : generateDone ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Generated
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      1. Generate Template
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Builds the Excel file on the server
                </p>
              </div>

              {/* Download */}
              <div className="space-y-1.5">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`
                    w-full h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                    ${
                      isDownloading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98]"
                    }
                  `}
                >
                  {isDownloading ? (
                    <>
                      <Spinner />
                      Downloading…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      2. Download .xlsx
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Saves the file to your device
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* One-click button */}
            <button
              onClick={handleGenerateAndDownload}
              disabled={isLoading || isDownloading}
              className={`
                w-full h-11 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${
                  isLoading || isDownloading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]"
                }
              `}
            >
              {isLoading || isDownloading ? (
                <>
                  <Spinner />
                  Processing…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate &amp; Download in One Click
                </>
              )}
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── Empty state instructions ────────────────────────────── */}
      {!categoryId && (
        <Card className="shadow-sm border-dashed border-gray-300 bg-gray-50/50">
          <CardContent className="pt-5 pb-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              How it works
            </h4>
           <ol className="space-y-2 text-sm text-gray-600 list-none">
  {[
    "Select a leaf category from the tree above.",
    'Click "Generate & Download" to get the Excel template.', // Fixed line
    "Fill in the template — product info, variant attributes, pricing.",
    "Leave stock quantities blank — add stock via Purchase Orders later.",
    "Upload the filled template using the Bulk Upload feature.",
  ].map((text, i) => (
    <li key={i} className="flex items-start gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
        {i + 1}
      </span>
      <span>{text}</span>
    </li>
  ))}
</ol>
          </CardContent>
        </Card>
      )}

      {/* ── API error ───────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-red-800">
            Template Generation Failed
          </p>
          <p className="text-xs text-red-700">
            {(error as any)?.data?.message ??
              "An unexpected error occurred. Please try again."}
          </p>
          <p className="text-xs text-red-500">
            Tip: Ensure the selected category has attributes defined.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StepBadge: React.FC<{ step: number }> = ({ step }) => (
  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
    {step}
  </span>
);

const Spinner: React.FC = () => (
  <svg
    className="h-4 w-4 animate-spin"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

const StatTile: React.FC<{
  label: string;
  value: number;
  color: "gray" | "red" | "blue" | "purple";
}> = ({ label, value, color }) => {
  const colorMap = {
    gray: "text-gray-800",
    red: "text-red-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2.5 text-center">
      <p className="text-xs text-gray-400 truncate">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
};

export default BulkProductTemplate;