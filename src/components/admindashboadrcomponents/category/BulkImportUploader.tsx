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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  useBulkImportCategoriesMutation,
  useDownloadStandardTemplateMutation,
  useDownloadCustomTemplateMutation,
  useGetTemplateInfoQuery,
} from "../../../features/apiSlice";

export default function BulkImportUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [maxLevels, setMaxLevels] = useState(5);
  const [includeAttributes, setIncludeAttributes] = useState(3);
  const [importResult, setImportResult] = useState<any>(null);

  // RTK Query hooks
  const { data: templateInfo } = useGetTemplateInfoQuery();
  const [bulkImport, { isLoading: isUploading }] = useBulkImportCategoriesMutation();
  const [downloadStandard, { isLoading: downloadingStandard }] = useDownloadStandardTemplateMutation();
  const [downloadCustom, { isLoading: downloadingCustom }] = useDownloadCustomTemplateMutation();

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
   * Download standard template
   */
  const handleDownloadStandard = async () => {
    try {
      const result = await downloadStandard({
        maxLevels,
        includeAttributes,
      }).unwrap();

      triggerDownload(result.data.buffer, result.data.fileName);
      toast.success("Standard template downloaded successfully! 📥");
    } catch (error: any) {
      console.error("Failed to download template:", error);
      toast.error(error?.message || "Failed to download template");
    }
  };

  /**
   * Download custom template
   */
  const handleDownloadCustom = async () => {
    try {
      const result = await downloadCustom({
        maxLevels,
        includeAttributes,
      }).unwrap();

      triggerDownload(result.data.buffer, result.data.fileName);
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
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        toast.error("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }
      setFile(selectedFile);
      setImportResult(null); // Reset previous results
      toast.info(`File selected: ${selectedFile.name}`);
    }
  };

  /**
   * Handle bulk import
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

      if (result.success) {
        const { imported = 0, failed = 0 } = result.data || {};
        
        toast.success(
          `Import completed! ✅ Imported: ${imported}, Failed: ${failed}`,
          { duration: 5000 }
        );

        // Show warnings if any
        if (result.data?.warnings && result.data.warnings.length > 0) {
          result.data.warnings.forEach((warning: string) => {
            toast.warning(warning, { duration: 4000 });
          });
        }
      }

      // Reset file input
      setFile(null);
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error: any) {
      console.error("Import failed:", error);
      
      const errorMessage = error?.message || error?.data?.message || "Upload failed";
      setImportResult({
        success: false,
        message: errorMessage,
        data: error?.data,
      });

      toast.error(errorMessage);

      // Display detailed errors
      if (error?.data?.errors) {
        error.data.errors.forEach((err: any) => {
          toast.error(`Row ${err.row}: ${err.errors.join(", ")}`, {
            duration: 6000,
          });
        });
      }
    }
  };

  return (
    <div className="w-full  mx-auto py-4 sm:py-6 space-y-2 sm:space-y-4">
      {/* Template Download Section */}
      <Card className="shadow-none rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <Download className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Download Template
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Download Excel templates for bulk import
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateOptions(!showTemplateOptions)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/20"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              {showTemplateOptions ? (
                <>
                  <span className="hidden sm:inline">Hide Options</span>
                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Template Options</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          <AnimatePresence>
            {showTemplateOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 sm:space-y-6 overflow-hidden"
              >
                {/* Template Info */}
                {templateInfo && (
                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-900 dark:text-blue-100">Template Rules</AlertTitle>
                    <AlertDescription className="mt-2 space-y-1 text-xs sm:text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <p><strong className="text-blue-700 dark:text-blue-300">Image:</strong> {templateInfo.data.rules.image}</p>
                        <p><strong className="text-blue-700 dark:text-blue-300">Keywords:</strong> {templateInfo.data.rules.keywords}</p>
                        <p><strong className="text-blue-700 dark:text-blue-300">Tags:</strong> {templateInfo.data.rules.tags}</p>
                        <p><strong className="text-blue-700 dark:text-blue-300">Attributes:</strong> {templateInfo.data.rules.attributes}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Max Category Levels
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">1</span>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        value={maxLevels}
                        onChange={(e) => setMaxLevels(parseInt(e.target.value) || 5)}
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600"
                      />
                      <span className="text-xs text-gray-500">15</span>
                    </div>
                    <div className="text-center">
                      <span className="inline-block px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-xs font-medium">
                        {maxLevels} levels
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include Attributes
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">1</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={includeAttributes}
                        onChange={(e) => setIncludeAttributes(parseInt(e.target.value) || 3)}
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600"
                      />
                      <span className="text-xs text-gray-500">5</span>
                    </div>
                    <div className="text-center">
                      <span className="inline-block px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-xs font-medium">
                        {includeAttributes} attributes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Button
                    onClick={handleDownloadStandard}
                    disabled={downloadingStandard}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-600/25 transition-all duration-300"
                  >
                    {downloadingStandard ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Standard Template</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleDownloadCustom}
                    disabled={downloadingCustom}
                    className="w-full flex items-center justify-center gap-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-400 dark:hover:border-teal-600 transition-all duration-300"
                    variant="outline"
                  >
                    {downloadingCustom ? (
                      <>
                        <div className="w-4 h-4 border-2 border-teal-600 dark:border-teal-400 border-t-transparent rounded-full animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Custom Template</span>
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Bulk Import Section */}
      <Card className="shadow-none rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Bulk Import Categories
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Upload your Excel file to import categories in bulk
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/20"
            >
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              {showInstructions ? "Hide Instructions" : "Show Instructions"}
              {showInstructions ? (
                <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              )}
            </Button>
          </div>
        </CardHeader>

       <CardContent className="p-4 sm:p-6 pt-0">
         {/* Import Results */}
  {importResult && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Alert 
        className={`border-l-4 ${
          importResult.success 
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-600' 
            : 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
        }`}
      >
        <div className="flex items-start gap-3">
          {importResult.success ? (
            <div className="p-1 bg-teal-100 dark:bg-teal-900 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
          ) : (
            <div className="p-1 bg-red-100 dark:bg-red-900 rounded-full">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          )}
          <div className="flex-1">
            <AlertTitle className={`text-sm sm:text-base font-semibold ${
              importResult.success ? 'text-teal-900 dark:text-teal-100' : 'text-red-900 dark:text-red-100'
            }`}>
              {importResult.success ? "Import Successful 🎉" : "Import Failed ⚠️"}
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className={`text-xs sm:text-sm font-medium ${
                importResult.success ? 'text-teal-700 dark:text-teal-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {importResult.message}
              </p>
              
              {importResult.data && (
                <div className="mt-3 space-y-3">
                  {/* Import Stats */}
                  {(importResult.data.imported !== undefined || importResult.data.failed !== undefined) && (
                    <div className="grid grid-cols-2 gap-3">
                      {importResult.data.imported !== undefined && (
                        <div className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-lg">
                          <p className="text-xs text-teal-700 dark:text-teal-300 mb-1">Imported</p>
                          <p className="text-lg sm:text-xl font-bold text-teal-900 dark:text-teal-100">
                            {importResult.data.imported}
                          </p>
                        </div>
                      )}
                      {importResult.data.failed !== undefined && importResult.data.failed > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                          <p className="text-xs text-red-700 dark:text-red-300 mb-1">Failed</p>
                          <p className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-100">
                            {importResult.data.failed}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Display Errors */}
                  {importResult.data.errors && importResult.data.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Errors:</p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {importResult.data.errors.map((err: any, idx: number) => (
                          <div key={idx} className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                            <strong className="text-red-700 dark:text-red-300">Row {err.row}:</strong>
                            <span className="text-red-600 dark:text-red-400 ml-1">{err.errors.join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display Warnings */}
                  {importResult.data.warnings && importResult.data.warnings.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">Warnings:</p>
                      <div className="space-y-1">
                        {importResult.data.warnings.map((warning: string, idx: number) => (
                          <div key={idx} className="text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                            <span className="text-amber-700 dark:text-amber-300">⚠ {warning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </motion.div>
  )}

  {/* Instructions Table */}
  <AnimatePresence>
    {showInstructions && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mb-4">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">Excel Template Structure</AlertTitle>
          <AlertDescription className="mt-2 text-xs sm:text-sm">
            <p className="text-amber-700 dark:text-amber-300 mb-2">
              Your Excel file must follow this structure. Each row represents a category hierarchy.
            </p>
            <ul className="space-y-1 list-disc list-inside text-amber-700 dark:text-amber-300">
              <li><strong>Level columns:</strong> Define category hierarchy (Level 1, Level 2, etc.)</li>
              <li><strong>image:</strong> Image URL for the root category</li>
              <li><strong>keywords/tags:</strong> Comma-separated values</li>
              <li><strong>Attributes:</strong> Filterable attributes with name, type, and values</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto -mx-4 sm:mx-0 scrollbar-slim">
          <div className="min-w-[800px] sm:min-w-0 scrollbar-slim">
            <Table className="border border-gray-200 dark:border-gray-800">
              <TableHeader className="bg-gray-100 dark:bg-gray-800">
                <TableRow>
                  {["Level 1", "Level 2", "Level 3", "image", "keywords", "tags", "attr_Brand", "attr_Brand_type", "attr_Brand_values"].map((header) => (
                    <TableHead 
                      key={header}
                      className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap px-3 py-2"
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="text-xs sm:text-sm px-3 py-2 font-medium">Electronics</TableCell>
                  <TableCell className="text-xs sm:text-sm px-3 py-2">Smartphones</TableCell>
                  <TableCell className="text-xs sm:text-sm px-3 py-2">Android Phones</TableCell>
                  <TableCell className="text-[10px] sm:text-xs px-3 py-2 break-all">https://example.com/img.jpg</TableCell>
                  <TableCell className="text-[10px] sm:text-xs px-3 py-2">smartphone,android</TableCell>
                  <TableCell className="text-[10px] sm:text-xs px-3 py-2">featured,new</TableCell>
                  <TableCell className="text-xs sm:text-sm px-3 py-2">Brand</TableCell>
                  <TableCell className="text-xs sm:text-sm px-3 py-2">SELECT</TableCell>
                  <TableCell className="text-[10px] sm:text-xs px-3 py-2">Samsung,OnePlus</TableCell>
                </TableRow>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="text-xs sm:text-sm px-3 py-2 font-medium">Fashion</TableCell>
                  <TableCell className="text-xs sm:text-sm px-3 py-2">Men</TableCell>
                  <TableCell className="text-xs sm:text-sm px-3 py-2">T-Shirts</TableCell>
                  <TableCell className="text-[10px] sm:text-xs px-3 py-2 break-all">https://example.com/fashion.jpg</TableCell>
                  <TableCell className="text-[10px] sm:text-xs px-3 py-2">tshirt,casual</TableCell>
                  <TableCell className="text-[10px] sm:text-xs px-3 py-2">summer,sale</TableCell>
                  <TableCell className="text-xs sm:text-sm px-3 py-2">Size</TableCell>
                  <TableCell className="text-xs sm:text-sm px-3 py-2">SELECT</TableCell>
                  <TableCell className="text-[10px] sm:text-xs px-3 py-2">S,M,L,XL</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-4 p-3 sm:p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
          <p className="text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-100 mb-2 flex items-center gap-2">
            <Info className="w-3 h-3 sm:w-4 sm:h-4" />
            💡 Pro Tips:
          </p>
          <ul className="text-xs sm:text-sm space-y-1 text-teal-700 dark:text-teal-300">
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Download the template above to get started with the correct format</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Attribute types: TEXT, NUMBER, BOOLEAN, SELECT, MULTISELECT</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Use comma-separated values for SELECT/MULTISELECT attribute values</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Leave empty cells for unused category levels</span>
            </li>
          </ul>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  {/* File Input Section */}
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      Upload Excel File
    </label>
    <div className="flex flex-col gap-4">
      <div className="flex-1">
        <div className="relative">
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 sm:p-6 text-center hover:border-teal-400 dark:hover:border-teal-600 transition-colors duration-300 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {file ? file.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {file ? `${(file.size / 1024).toFixed(2)} KB` : "Excel (.xlsx, .xls) up to 10MB"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Button
        onClick={handleUpload}
        disabled={isUploading || !file}
        className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Uploading...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <FileCheck className="w-4 h-4" />
            <span>Process Import</span>
          </div>
        )}
      </Button>
    </div>
  </div>

 
</CardContent>
      </Card>
    </div>
  );
}