"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2 } from "lucide-react";
import ImageUploader from "@/components/imageuploader/ImageUploader";
import { VariantNamePart } from "@/types/type";
import { ProductVariantInput } from "@/types/product";

interface Props {
  variants: ProductVariantInput[];
  setVariants: (v: ProductVariantInput[]) => void;
  variantNameParts: Record<string, VariantNamePart>;
}

export default function VariantManager({
  variants,
  setVariants,
  variantNameParts,
}: Props) {
  const [showImageUploaders, setShowImageUploaders] = useState<Record<string, boolean>>({});
  const [showSpecialPrice, setShowSpecialPrice] = useState<Record<string, boolean>>({});

  // Generate variant name from selected fields
  const generateVariantName = (): string => {
    const parts = Object.values(variantNameParts)
      .filter(part => part.include && part.value)
      .map(part => `${part.name}-${part.value}`);
    
    return parts.join('/');
  };

  const addVariant = () => {
    const variantName = generateVariantName();
    if (!variantName) {
      alert("Please select at least one field to include in variants and set values");
      return;
    }

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

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
    setShowImageUploaders(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    setShowSpecialPrice(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleChange = (
    id: string,
    field: keyof ProductVariantInput,
    value: string | number
  ) => {
    const updated = variants.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    setVariants(updated);
  };

  const handleImagesChange = (id: string, images: string[]) => {
    const updated = variants.map((v) =>
      v.id === id ? { ...v, images: images.slice(0, 8) } : v
    );
    setVariants(updated);
  };

  const toggleImageUploader = (id: string) => {
    setShowImageUploaders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSpecialPrice = (id: string) => {
    setShowSpecialPrice(prev => ({
      ...prev,
      [id]: !prev[id]
    }));

    // If we're hiding the special price, clear the specialPrice value
    if (showSpecialPrice[id]) {
      const updated = variants.map((v) =>
        v.id === id ? { ...v, specialPrice: undefined } : v
      );
      setVariants(updated);
    }
  };

  return (
    <div className="border p-4 rounded-lg mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Variants</h3>
        <Button onClick={addVariant} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="p-4 border rounded bg-gray-50 text-center">
          <p className="text-gray-500 mb-2">No variants added yet</p>
          <p className="text-sm text-gray-400">
            Configure specifications/attributes above and click "Add Variant"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant) => (
            <div key={variant.id} className="border p-4 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{variant.name}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariant(variant.id!)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <Input
                    value={variant.sku}
                    onChange={(e) => handleChange(variant.id!, "sku", e.target.value)}
                    placeholder="SKU"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <Input
                    type="number"
                    value={variant.price}
                    onChange={(e) => handleChange(variant.id!, "price", Number(e.target.value))}
                    placeholder="Price"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Special Price</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={variant.specialPrice || ""}
                      onChange={(e) => handleChange(variant.id!, "specialPrice", Number(e.target.value))}
                      placeholder="Special Price"
                    />
                    {variant.specialPrice && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleChange(variant.id!, "specialPrice", undefined!)}
                        className="mt-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Stock</label>
                  <Input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => handleChange(variant.id!, "stock", Number(e.target.value))}
                    placeholder="Stock"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Weight</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variant.weight}
                    onChange={(e) => handleChange(variant.id!, "weight", Number(e.target.value))}
                    placeholder="Weight"
                  />
                </div>
              </div>

              {/* Images Section */}
              <div className="mb-3">
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleImageUploader(variant.id!)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {showImageUploaders[variant.id!] ? 'Hide Uploader' : 'Add Images'}
                  </Button>
                  
                  {showImageUploaders[variant.id!] && (
                    <div className="mt-2 p-3 border rounded bg-white">
                      <ImageUploader
                        images={variant.images || []}
                        setImages={(images) => handleImagesChange(variant.id!, images)}
                        maxImages={8}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}