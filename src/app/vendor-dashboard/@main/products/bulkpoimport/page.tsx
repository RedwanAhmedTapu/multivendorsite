"use client";
import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, Loader2, AlertCircle, Check } from "lucide-react";
import type { PurchaseItemInput } from "@/features/purchaseOrderApi";
import { useDownloadStockIntakeTemplateMutation } from "@/features/purchaseOrderApi";

interface BulkImportPOItemsProps {
  // Merges parsed rows into whatever `items` state the PO form already owns —
  // this component never talks to createPurchaseOrder directly.
  onItemsImported: (items: PurchaseItemInput[]) => void;
}

// Must match the column keys written by StockIntakeTemplateService.
const REQUIRED_HEADERS = [
  "Variant ID",
  "Product Name",
  "Variant Name",
  "SKU",
  "Quantity Received *",
  "Unit Cost *",
  "Sell Price",
];

export default function BulkImportPOItems({
  onItemsImported = () => {
    console.warn(
      "BulkImportPOItems: no onItemsImported handler was passed in — parsed items have nowhere to go. " +
        "Pass a function like items => setItems(prev => [...prev, ...items]) from the parent page.",
    );
  },
}: BulkImportPOItemsProps) {
  const [downloadTemplate, { isLoading: isDownloading }] =
    useDownloadStockIntakeTemplateMutation();
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string>("");
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setError("");
    try {
      const blob = await downloadTemplate().unwrap();

      // fetchBaseQuery's custom responseHandler wraps ANY response body into
      // a Blob, success or error — a 400/404 JSON error still "succeeds" here.
      // A real .xlsx is either the spreadsheetml MIME type or a generic
      // octet-stream; anything else (json, text/html) means the backend
      // actually failed and we're holding its error body, not a spreadsheet.
      const isSpreadsheet =
        blob.type.includes("spreadsheetml") || blob.type === "application/octet-stream";

      if (!isSpreadsheet) {
        const text = await blob.text();
        try {
          setError(JSON.parse(text)?.message || "Server didn't return a spreadsheet file.");
        } catch {
          setError("Server didn't return a spreadsheet file.");
        }
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stock-intake-sheet.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.data?.message || "Couldn't generate the intake sheet. Try again.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError("");
    setImportedCount(null);

    try {
      const buffer = await file.arrayBuffer();

      // A real .xlsx is a zip archive — it always starts with the bytes
      // "PK". If it doesn't, this isn't a spreadsheet at all (most likely
      // an error page or JSON body that got saved with an .xlsx extension
      // from a previous failed download) — say so plainly instead of
      // letting XLSX.read() throw an opaque parse error.
      const magic = new Uint8Array(buffer.slice(0, 2));
      if (magic[0] !== 0x50 || magic[1] !== 0x4b) {
        setError(
          "This isn't a valid .xlsx file — it looks like an error page or corrupted download, " +
            "not a spreadsheet. Click 'Download intake sheet' again and re-upload that file.",
        );
        return;
      }

      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets["Stock Intake"] ?? workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

      if (rows.length === 0) {
        setError("That file doesn't have any rows to import.");
        return;
      }

      const headers = Object.keys(rows[0]);
      const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
      if (missing.length > 0) {
        setError(`This doesn't look like a stock intake sheet — missing: ${missing.join(", ")}`);
        return;
      }

      const items: PurchaseItemInput[] = rows
        // A blank Quantity Received means "not part of this shipment" — skip it.
        .filter((r) => r["Quantity Received *"] !== "" && r["Unit Cost *"] !== "")
        .map((r) => ({
          variantId: String(r["Variant ID"]),
          productName: String(r["Product Name"]),
          variantName: String(r["Variant Name"] || ""),
          sku: String(r["SKU"]),
          quantity: Number(r["Quantity Received *"]),
          unitCost: Number(r["Unit Cost *"]),
          sellPrice: Number(r["Sell Price"] || 0),
          expiryDate: r["Expiry Date"] ? String(r["Expiry Date"]) : null,
        }));

      if (items.length === 0) {
        setError("No rows had both Quantity Received and Unit Cost filled in.");
        return;
      }

      const invalid = items.filter((i) => !i.quantity || i.quantity <= 0 || !i.unitCost || i.unitCost <= 0);
      if (invalid.length > 0) {
        setError(`${invalid.length} row(s) have an invalid quantity or unit cost. Fix those and re-upload.`);
        return;
      }

      onItemsImported(items);
      setImportedCount(items.length);
    } catch (err) {
      console.error(err);
      setError("Couldn't read that file — make sure it's the .xlsx you downloaded.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      style={{
        background: "#F8FAFC",
        border: "1.5px dashed #CBD5E1",
        borderRadius: 12,
        padding: "16px 18px",
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2E", marginBottom: 4 }}>
        Bulk import items
      </div>
      <p style={{ fontSize: 11.5, color: "#64748B", marginBottom: 12, lineHeight: 1.5 }}>
        Download the sheet listing your out-of-stock products, fill in quantity and cost, and
        upload it here — it fills the line items below. Supplier, warehouse, VAT, and payment
        are still entered once for the whole order.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1.5px solid #E5EAF2",
            background: "#fff",
            fontSize: 12.5,
            fontWeight: 600,
            color: "#3D5068",
            cursor: isDownloading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {isDownloading ? (
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Download size={13} />
          )}
          Download intake sheet
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            background: isParsing ? "#CBD5E1" : "#1D4ED8",
            fontSize: 12.5,
            fontWeight: 700,
            color: "#fff",
            cursor: isParsing ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {isParsing ? (
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Upload size={13} />
          )}
          Upload filled sheet
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {error && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11.5,
            color: "#DC2626",
          }}
        >
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {importedCount !== null && !error && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11.5,
            color: "#10B981",
          }}
        >
          <Check size={12} />
          Imported {importedCount} line item{importedCount === 1 ? "" : "s"}. Review below before submitting.
        </div>
      )}
    </div>
  );
}