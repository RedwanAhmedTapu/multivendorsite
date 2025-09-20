"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProductModal({ isOpen, onClose, product }) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category */}
          <div>
            <strong>Category:</strong> {product.category?.name}
          </div>

          {/* Description */}
          {product.description && (
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          {/* Images */}
          {product.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.altText || product.name}
                  className="h-24 w-24 object-cover rounded"
                />
              ))}
            </div>
          )}

          {/* Variants */}
          {product.variants.length > 0 && (
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
                  {product.variants.map((v) => (
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
          {product.warranty && (
            <div className="mt-4 border-t pt-2">
              <strong>Shipping & Warranty Details:</strong>
              <ul className="list-disc list-inside">
                <li>Package Weight: {product.warranty.packageWeightValue} {product.warranty.packageWeightUnit}</li>
                <li>Dimensions: {product.warranty.packageLength} x {product.warranty.packageWidth} x {product.warranty.packageHeight}</li>
                <li>Dangerous Goods: {product.warranty.dangerousGoods}</li>
                <li>Warranty Duration: {product.warranty.duration} {product.warranty.unit}</li>
                <li>Policy: {product.warranty.policy}</li>
                <li>Type: {product.warranty.type}</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
