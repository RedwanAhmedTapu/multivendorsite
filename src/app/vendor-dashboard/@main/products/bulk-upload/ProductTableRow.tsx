// components/bulkupload/ProductTableRow.tsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Attribute, Specification } from "@/types/type";
import { ProductShippingWarrantyInput } from "@/types/product";
import ProductDescriptionEditor from "@/components/productdescription/ProductDescriptionl";
import ShippingWarrantyForm from "@/components/product/vendor/productform/ShippingWarrantyForm";
import { 
  ImageIcon, 
  Video, 
  FileText, 
  Trash2, 
  Upload,
  Check
} from "lucide-react";
import ImageUploader from "@/components/imageuploader/ImageUploader";
import VideoUploader from "@/components/videouploader/VideoUploader";

// Define the interface locally since we can't import from page
interface BulkProductData {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  variantGroupNo?: number;
  images: string[];
  videoUrl?: string;
  specInputs: any[];
  attributeSettings: any[];
  variantInputs: any[];
  shippingWarranty?: ProductShippingWarrantyInput;
  errors: Record<string, string>;
  status: 'draft' | 'processing' | 'success' | 'error';
}

interface ProductTableRowProps {
  product: BulkProductData;
  categoryAttributes: Attribute[];
  categorySpecifications: Specification[];
  onUpdateField: (productId: string, field: string, value: any) => void;
  onUpdateSpec: (productId: string, specId: string, value: string) => void;
  onUpdateAttribute: (productId: string, attrId: string, valueId: string) => void;
  onUpdateImages: (productId: string, images: string[]) => void;
  onUpdateVideo: (productId: string, videoUrl: string | null) => void;
  onUpdateShippingWarranty: (productId: string, shippingWarranty: ProductShippingWarrantyInput) => void;
  onRemove: (productId: string) => void;
  vendorId?: string;
  userRole: "VENDOR" | "ADMIN";
}

export function ProductTableRow({ 
  product, 
  categoryAttributes, 
  categorySpecifications, 
  onUpdateField,
  onUpdateSpec,
  onUpdateAttribute,
  onUpdateImages,
  onUpdateVideo,
  onUpdateShippingWarranty,
  onRemove,
  vendorId,
  userRole
}: ProductTableRowProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);

  const statusColors = {
    draft: 'bg-gray-300',
    processing: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500'
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      {/* Status */}
      <td className="p-2 sticky left-0 bg-white">
        <div className={`w-3 h-3 rounded-full ${statusColors[product.status]}`} />
      </td>

      {/* Name */}
      <td className="p-2">
        <Input
          value={product.name}
          onChange={(e) => onUpdateField(product.id, 'name', e.target.value)}
          placeholder="Product name"
          className={`h-8 text-sm ${product.errors.name ? 'border-red-500' : ''}`}
        />
        {product.errors.name && (
          <span className="text-xs text-red-500">{product.errors.name}</span>
        )}
      </td>

      {/* SKU */}
      <td className="p-2">
        <Input
          value={product.sku}
          onChange={(e) => onUpdateField(product.id, 'sku', e.target.value)}
          placeholder="SKU"
          className={`h-8 text-sm ${product.errors.sku ? 'border-red-500' : ''}`}
        />
        {product.errors.sku && (
          <span className="text-xs text-red-500">{product.errors.sku}</span>
        )}
      </td>

      {/* Price */}
      <td className="p-2">
        <Input
          type="number"
          step="0.01"
          value={product.price || ''}
          onChange={(e) => onUpdateField(product.id, 'price', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className={`h-8 text-sm ${product.errors.price ? 'border-red-500' : ''}`}
        />
      </td>

      {/* Stock */}
      <td className="p-2">
        <Input
          type="number"
          value={product.stock || ''}
          onChange={(e) => onUpdateField(product.id, 'stock', parseInt(e.target.value) || 0)}
          placeholder="0"
          className={`h-8 text-sm ${product.errors.stock ? 'border-red-500' : ''}`}
        />
      </td>

      {/* Variant Group */}
      <td className="p-2">
        <Input
          type="number"
          value={product.variantGroupNo || ''}
          onChange={(e) => onUpdateField(product.id, 'variantGroupNo', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="Optional"
          className="h-8 text-sm"
        />
      </td>

      {/* Specifications */}
      {categorySpecifications.map(spec => {
        const specInput = product.specInputs.find(s => s.specificationId === spec.id);
        return (
          <td key={spec.id} className="p-2">
            <Input
              value={specInput?.value || ''}
              onChange={(e) => onUpdateSpec(product.id, spec.id, e.target.value)}
              placeholder={`Enter ${spec.name}`}
              className="h-8 text-sm"
            />
          </td>
        );
      })}

      {/* Attributes */}
      {categoryAttributes.map(attr => {
        const attrSetting = product.attributeSettings.find(a => a.attributeId === attr.id);
        return (
          <td key={attr.id} className="p-2">
            <Select
              value={attrSetting?.selectedValueId || ''}
              onValueChange={(value) => onUpdateAttribute(product.id, attr.id, value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={`Select ${attr.name}`} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(attr.values) && attr.values.map(value => (
                  <SelectItem key={value.id} value={value.id}>
                    {value.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>
        );
      })}

      {/* Images */}
      <td className="p-2">
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 relative">
              <ImageIcon className="h-4 w-4" />
              {product.images.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {product.images.length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Images</DialogTitle>
            </DialogHeader>
            <ImageUploader 
              images={product.images} 
              setImages={(images) => onUpdateImages(product.id, images)} 
              maxImages={10} 
            />
          </DialogContent>
        </Dialog>
      </td>

      {/* Video */}
      <td className="p-2">
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 relative">
              <Video className="h-4 w-4" />
              {product.videoUrl && <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Video</DialogTitle>
            </DialogHeader>
            <VideoUploader
              videoUrl={product.videoUrl ?? null}
              setVideoUrl={(videoUrl) => onUpdateVideo(product.id, videoUrl)}
              vendorId={vendorId || ""}
              userRole={userRole}
            />
          </DialogContent>
        </Dialog>
      </td>

      {/* Description */}
      <td className="p-2">
        <Dialog open={descriptionDialogOpen} onOpenChange={setDescriptionDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 relative">
              <FileText className="h-4 w-4" />
              {product.description && <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Description</DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <ProductDescriptionEditor
                value={product.description}
                onChange={(value) => onUpdateField(product.id, 'description', value)}
              />
              <Button 
                onClick={() => setDescriptionDialogOpen(false)} 
                className="w-full mt-4"
              >
                Save Description
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </td>

      {/* Shipping & Warranty */}
      <td className="p-2">
        <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 relative">
              <Upload className="h-4 w-4" />
              {product.shippingWarranty && <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Shipping & Warranty Information</DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <ShippingWarrantyForm
                value={product.shippingWarranty ?? null}
                onChange={(value) => onUpdateShippingWarranty(product.id, value)}
              />
              <Button 
                onClick={() => setShippingDialogOpen(false)} 
                className="w-full mt-4"
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </td>

      {/* Actions */}
      <td className="p-2 sticky right-0 bg-white">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(product.id)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}