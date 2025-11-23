// components/bulkupload/ProductsTable.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Attribute, Specification } from "@/types/type";
import { ProductTableRow } from "./ProductTableRow";
import { BulkUploadPagination } from "./BulkUploadPagination";
import { Product, ProductAttributeSettingInput, BulkProductData, ProductShippingWarrantyInput } from "@/types/product";

interface ProductsTableProps {
  products: BulkProductData[];
  categoryAttributes: Attribute[];
  categorySpecifications: Specification[];
  totalProducts: number;
  onUpdateField: (productId: string, field: string, value: any) => void;
  onUpdateSpec: (productId: string, specId: string, value: string) => void;
  onUpdateAttribute: (productId: string, attrId: string, valueId: string) => void;
  onUpdateImages: (productId: string, images: string[]) => void;
  onUpdateVideo: (productId: string, videoUrl: string | null) => void;
  onUpdateShippingWarranty: (productId: string, shippingWarranty: ProductShippingWarrantyInput) => void;
  onRemoveProduct: (productId: string) => void;
  onAddProduct: () => void;
  onQuickAddRows: (count: number) => void;
  onUploadAll: () => void;
  isLoading: boolean;
  vendorId?: string;
  userRole: "VENDOR" | "ADMIN";
}

export function ProductsTable({
  products,
  categoryAttributes,
  categorySpecifications,
  totalProducts,
  onUpdateField,
  onUpdateSpec,
  onUpdateAttribute,
  onUpdateImages,
  onUpdateVideo,
  onUpdateShippingWarranty,
  onRemoveProduct,
  onAddProduct,
  onQuickAddRows,
  onUploadAll,
  isLoading,
  vendorId,
  userRole
}: ProductsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Products ({totalProducts})</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button onClick={onAddProduct} variant="outline">
            + Add Row
          </Button>
          <Button 
            onClick={onUploadAll} 
            disabled={isLoading || totalProducts === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Uploading..." : `Upload All (${totalProducts})`}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-2 text-left text-xs font-semibold sticky left-0 bg-gray-50 z-10">Status</th>
                <th className="p-2 text-left text-xs font-semibold min-w-[150px]">Name *</th>
                <th className="p-2 text-left text-xs font-semibold min-w-[120px]">SKU *</th>
                <th className="p-2 text-left text-xs font-semibold min-w-[100px]">Price *</th>
                <th className="p-2 text-left text-xs font-semibold min-w-[80px]">Stock *</th>
                <th className="p-2 text-left text-xs font-semibold min-w-[100px]">Variant Group</th>
                
                {/* Specifications Columns */}
                {categorySpecifications.map(spec => (
                  <th key={spec.id} className="p-2 text-left text-xs font-semibold min-w-[120px]">
                    {spec.name}
                  </th>
                ))}
                
                {/* Attributes Columns */}
                {categoryAttributes.map(attr => (
                  <th key={attr.id} className="p-2 text-left text-xs font-semibold min-w-[120px]">
                    {attr.name}
                  </th>
                ))}
                
                <th className="p-2 text-left text-xs font-semibold min-w-[80px]">Images</th>
                <th className="p-2 text-left text-xs font-semibold min-w-[80px]">Video</th>
                <th className="p-2 text-left text-xs font-semibold min-w-[80px]">Description</th>
                <th className="p-2 text-left text-xs font-semibold min-w-[80px]">Shipping</th>
                <th className="p-2 text-left text-xs font-semibold sticky right-0 bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  categoryAttributes={categoryAttributes}
                  categorySpecifications={categorySpecifications}
                  onUpdateField={onUpdateField}
                  onUpdateSpec={onUpdateSpec}
                  onUpdateAttribute={onUpdateAttribute}
                  onUpdateImages={onUpdateImages}
                  onUpdateVideo={onUpdateVideo}
                  onUpdateShippingWarranty={onUpdateShippingWarranty}
                  onRemove={onRemoveProduct}
                  vendorId={vendorId}
                  userRole={userRole}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Add */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Quick Add Multiple Rows</h4>
              <p className="text-sm text-gray-600">Add multiple empty product rows at once</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onQuickAddRows(5)}
              >
                + 5 Rows
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onQuickAddRows(10)}
              >
                + 10 Rows
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}