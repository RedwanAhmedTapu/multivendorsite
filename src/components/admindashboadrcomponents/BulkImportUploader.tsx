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
import { Upload, Info } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useBulkImportCategoriesMutation } from "../../features/apiSlice";

export default function BulkImportUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const [bulkImport, { isLoading }] = useBulkImportCategoriesMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file before uploading");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await bulkImport(formData).unwrap();
      toast.success(res.message || "File imported successfully 🚀");
    } catch (err: any) {
      toast.error(err?.data?.error || "Upload failed");
    } finally {
      setFile(null);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8 shadow-lg rounded-2xl">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-xl font-bold">Bulk Import Categories</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <Info className="w-4 h-4 mr-2" /> Instructions
        </Button>
      </CardHeader>

      <CardContent>
        {/* File Input */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            className="border rounded p-2 w-full sm:w-auto"
          />
          <Button
            onClick={handleUpload}
            disabled={isLoading || !file}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </div>

        {/* Instructions Table */}
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="mb-4 text-sm text-gray-600">
              Your file must follow this structure. Each row represents a category path, its specifications, and attributes.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category1</TableHead>
                  <TableHead>Category2</TableHead>
                  <TableHead>Category3</TableHead>
                  <TableHead>SpecificationName</TableHead>
                  <TableHead>SpecType</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>AttributeName</TableHead>
                  <TableHead>AttrType</TableHead>
                  <TableHead>Values</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Electronics</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Smartphone</TableCell>
                  <TableCell>Screen Size</TableCell>
                  <TableCell>NUMBER</TableCell>
                  <TableCell>Inch</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>SELECT</TableCell>
                  <TableCell>Black, White, Blue</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Electronics</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Smartphone</TableCell>
                  <TableCell>Battery</TableCell>
                  <TableCell>NUMBER</TableCell>
                  <TableCell>mAh</TableCell>
                  <TableCell>Storage</TableCell>
                  <TableCell>SELECT</TableCell>
                  <TableCell>64GB, 128GB, 256GB</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Fashion</TableCell>
                  <TableCell>Men</TableCell>
                  <TableCell>T-Shirt</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>TEXT</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>SELECT</TableCell>
                  <TableCell>S, M, L, XL</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
