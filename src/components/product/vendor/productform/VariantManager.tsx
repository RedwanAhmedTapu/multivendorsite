"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2 } from "lucide-react";
import ImageUploader from "@/components/imageuploader/ImageUploader";
import { ProductVariantInput, ProductImageInput } from "@/types/product";
import { VariantNamePart } from "@/types/product";

interface Props {
  variants: ProductVariantInput[];
  setVariants: (v: ProductVariantInput[]) => void;
  variantNameParts: Record<string, VariantNamePart>;
  onGenerateVariantName: () => string;
}

export default function VariantManager({
  variants,
  setVariants,
  variantNameParts,
  onGenerateVariantName,
}: Props) {
  const [showImageUploaders, setShowImageUploaders] = useState<Record<string, boolean>>({});

  const addVariant = () => {
    const variantName = onGenerateVariantName();
    // if (!variantName || variantName === " | ") {
    //   alert("Please select at least one attribute to include in variants and set values");
    //   return;
    // }

    const newVariant: ProductVariantInput = {
      id: String(Date.now()),
      name: variantName,
      sku: "",
      price: 0,
      stock: 0,
      weight: 0,
      images: [],
      attributes: [],
    };

    setVariants([...variants, newVariant]);
  };

  const removeVariant = (id?: string) => {
    if (!id) return;
    
    setVariants(variants.filter(v => v.id !== id));
    setShowImageUploaders(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleChange = (
    id: string | undefined,
    field: keyof ProductVariantInput,
    value: string | number | null
  ) => {
    if (!id) return;
    
    const updated = variants.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    setVariants(updated);
  };

  const handleImagesChange = (id: string | undefined, images: (string | ProductImageInput)[]) => {
    if (!id) return;
    
    const updated = variants.map((v) =>
      v.id === id ? { ...v, images: images.slice(0, 8) } : v
    );
    setVariants(updated);
  };

  const toggleImageUploader = (id: string | undefined) => {
    if (!id) return;
    
    setShowImageUploaders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSpecialPriceChange = (id: string | undefined, specialPrice: number | null) => {
    if (!id) return;
    
    const variant = variants.find(v => v.id === id);
    if (!variant) return;

    let discount = 0;
    if (specialPrice && specialPrice < variant.price) {
      discount = Math.round(((variant.price - specialPrice) / variant.price) * 100);
    }

    const updated = variants.map((v) =>
      v.id === id 
        ? { ...v, specialPrice: specialPrice || null, discount } 
        : v
    );
    setVariants(updated);
  };

  // Get variant attributes summary
  const getVariantAttributesSummary = () => {
    const includedParts = Object.values(variantNameParts)
      .filter(part => part.include && part.value);
    
    if (includedParts.length === 0) {
      return "No attributes selected for variants";
    }

    return includedParts.map(part => `${part.name}: ${part.value}`).join(' • ');
  };

  return (
    <div className="border p-4 rounded-lg mt-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold">Product Variants</h3>
          <p className="text-sm text-gray-600 mt-1">
            {getVariantAttributesSummary()}
          </p>
        </div>
        <Button onClick={addVariant} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="p-4 border rounded bg-gray-50 text-center">
          <p className="text-gray-500 mb-2">No variants added yet</p>
          <p className="text-sm text-gray-400">
            Select attributes above and click "Add Variant"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={variant.id || index} className="border p-4 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-medium">{variant.name}</h4>
                 
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariant(variant.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
                <div>
                  <label className="text-sm font-medium">SKU *</label>
                  <Input
                    value={variant.sku}
                    onChange={(e) => handleChange(variant.id, "sku", e.target.value)}
                    placeholder="SKU-001"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.price}
                    onChange={(e) => handleChange(variant.id, "price", Number(e.target.value))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Special Price</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={variant.specialPrice || ""}
                      onChange={(e) => 
                        handleSpecialPriceChange(
                          variant.id, 
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="0.00"
                    />
                    {variant.specialPrice && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSpecialPriceChange(variant.id, null)}
                        className="mt-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {variant.specialPrice && variant.specialPrice >= variant.price && (
                    <p className="text-xs text-red-500 mt-1">
                      Special price must be less than regular price
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Stock</label>
                  <Input
                    type="number"
                    min="0"
                    value={variant.stock || 0}
                    onChange={(e) => handleChange(variant.id, "stock", Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Weight (g)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.weight || 0}
                    onChange={(e) => handleChange(variant.id, "weight", Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Price Summary */}
              {variant.specialPrice && variant.specialPrice < variant.price && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Regular Price:</span>
                    <span className="line-through text-gray-500">${variant.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-green-700">Sale Price:</span>
                    <span className="text-green-700">${variant.specialPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">You Save:</span>
                    <span className="text-green-600">
                      ${(variant.price - variant.specialPrice).toFixed(2)} ({variant.discount}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Images Section */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Variant Images {variant.images && variant.images.length > 0 && (
                      <span className="text-xs text-gray-500">
                        ({variant.images.length}/8)
                      </span>
                    )}
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleImageUploader(variant.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {showImageUploaders[variant.id!] ? 'Hide' : 'Add Images'}
                  </Button>
                </div>
                
                {showImageUploaders[variant.id!] && (
                  <div className="mt-2 p-3 border rounded bg-white">
                    <ImageUploader
                      images={(variant.images || []).map(img => typeof img === 'string' ? img : img.url)}
                      setImages={(images) => handleImagesChange(variant.id, images)}
                      maxImages={8}
                    />
                  </div>
                )}

                {/* Image Preview */}
                {variant.images && variant.images.length > 0 && !showImageUploaders[variant.id!] && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {variant.images.slice(0, 4).map((img, imgIdx) => (
                      <div key={imgIdx} className="flex-shrink-0">
                        <img
                          src={typeof img === 'string' ? img : img.url}
                          alt={typeof img === 'string' ? `Variant ${index + 1} image ${imgIdx + 1}` : img.altText || ''}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      </div>
                    ))}
                    {variant.images.length > 4 && (
                      <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gray-100 rounded border text-xs text-gray-600">
                        +{variant.images.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stock Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  !variant.stock || variant.stock === 0
                    ? 'bg-red-500'
                    : variant.stock < 10
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`} />
                <span className="text-xs text-gray-600">
                  {!variant.stock || variant.stock === 0
                    ? 'Out of Stock'
                    : variant.stock < 10
                    ? 'Low Stock'
                    : 'In Stock'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variants Summary */}
      {variants.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="font-medium mb-2 text-sm">Variants Summary</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Total Variants:</span>
              <span className="font-medium ml-1">{variants.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Stock:</span>
              <span className="font-medium ml-1">
                {variants.reduce((sum, v) => sum + (v.stock || 0), 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Avg Price:</span>
              <span className="font-medium ml-1">
                $
                {(
                  variants.reduce((sum, v) => sum + (v.specialPrice || v.price), 0) /
                  variants.length
                ).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">With Images:</span>
              <span className="font-medium ml-1">
                {variants.filter(v => v.images && v.images.length > 0).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}