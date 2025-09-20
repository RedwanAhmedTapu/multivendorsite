"use client";

import React, { useState } from "react";
import {
  useGetProductsQuery,
  useUpdateProductStatusMutation,
} from "@/features/productApi";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 15;

export default function AdminProductTable() {
  const { data: products = [], isLoading } = useGetProductsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateProductStatusMutation();

  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginatedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusChange = async (id: string, status: "ACTIVE" | "REJECTED") => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Product has been ${status === "ACTIVE" ? "approved" : "rejected"}`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading products...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Product Approval Management</h2>

      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved By</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((p: any, idx: number) => {
                const nextStatus = p.approvalStatus === "ACTIVE" ? "REJECTED" : "ACTIVE";

                return (
                  <TableRow key={p.id}>
                    <TableCell>{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {p.category?.name || <span className="text-gray-400">Uncategorized</span>}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          p.approvalStatus === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : p.approvalStatus === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {p.approvalStatus}
                      </span>
                    </TableCell>
                    <TableCell>{p.approvedBy?.name || "-"}</TableCell>
                    <TableCell>
                      {new Date(p.updatedAt).toLocaleString("en-BD", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedProduct(p)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Details
                      </Button>
                      <Button
                        size="sm"
                        className={
                          nextStatus === "ACTIVE"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(p.id, nextStatus)}
                      >
                        {isUpdating && <RefreshCw className="w-4 h-4 mr-1 animate-spin" />}
                        {nextStatus === "ACTIVE" ? "Approve" : "Reject"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <span className="text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Product Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Category */}
              <div>
                <strong>Category:</strong>{" "}
                {selectedProduct.category?.name || "Uncategorized"}
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div
                  dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                />
              )}

              {/* Images */}
              {selectedProduct.images?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {selectedProduct.images.map((img: any) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.altText || selectedProduct.name}
                      className="h-24 w-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}

              {/* Variants */}
              {selectedProduct.variants?.length > 0 && (
                <div>
                  <strong>Variants:</strong>
                  <table className="table-auto border-collapse border border-gray-300 w-full mt-2">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-2 py-1">Name</th>
                        <th className="border px-2 py-1">SKU</th>
                        <th className="border px-2 py-1">Price</th>
                        <th className="border px-2 py-1">Stock</th>
                        <th className="border px-2 py-1">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct.variants.map((v: any) => (
                        <tr key={v.id}>
                          <td className="border px-2 py-1">{v.name}</td>
                          <td className="border px-2 py-1">{v.sku}</td>
                          <td className="border px-2 py-1">${v.price}</td>
                          <td className="border px-2 py-1">{v.stock}</td>
                          <td className="border px-2 py-1">{v.weight} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Warranty */}
              {selectedProduct.warranty && (
                <div className="mt-4 border-t pt-2">
                  <strong>Shipping & Warranty Details:</strong>
                  <ul className="list-disc list-inside">
                    <li>
                      Package Weight: {selectedProduct.warranty.packageWeightValue}{" "}
                      {selectedProduct.warranty.packageWeightUnit}
                    </li>
                    <li>
                      Dimensions: {selectedProduct.warranty.packageLength} x{" "}
                      {selectedProduct.warranty.packageWidth} x{" "}
                      {selectedProduct.warranty.packageHeight}
                    </li>
                    <li>Dangerous Goods: {selectedProduct.warranty.dangerousGoods}</li>
                    <li>
                      Warranty Duration: {selectedProduct.warranty.duration}{" "}
                      {selectedProduct.warranty.unit}
                    </li>
                    <li>Policy: {selectedProduct.warranty.policy}</li>
                    <li>Type: {selectedProduct.warranty.type}</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
