

"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCreateProductMutation } from "@/features/productApi";
import CategoryTreeSelector from "./CategoryTreeSelector";
import ImageUploader from "@/components/imageuploader/ImageUploader";
import VideoUploader from "@/components/videouploader/VideoUploader";
import SpecAttributeManager from "./SpecAttributeManager";
import VariantManager from "./VariantManager";
import type { Attribute, VariantNamePart } from "@/types/type";
import {
  CreateProductData,
  ProductAttributeInput,
  ProductImageInput,
  ProductShippingWarrantyInput,
  ProductVariantInput,
} from "@/types/product";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import ProductDescriptionEditor from "@/components/productdescription/ProductDescriptionl";
import ShippingWarrantyForm from "./ShippingWarrantyForm";
import { RightSidebar, RightSidebarProvider } from "@/app/vendor-dashboard/rightbar/RightSidebar";
import { ProductCreationWizard } from "@/components/wizard/vendorrightsidewizard/ProductCreationWizard";
import { Loader2 } from "lucide-react";
import { translateProductName } from "@/utils/translate";

// Main Form Component
function AddProductFormContent() {
  const [name, setName] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isLeafCategory, setIsLeafCategory] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState<Attribute[]>([]);
  const [requiredAttributes, setRequiredAttributes] = useState<Attribute[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [attributes, setAttributes] = useState<ProductAttributeInput[]>([]);
  const [variantInputs, setVariantInputs] = useState<ProductVariantInput[]>([]);
  const [variantNameParts, setVariantNameParts] = useState<
    Record<string, VariantNamePart>
  >({});
  const [shippingWarranty, setShippingWarranty] =
    useState<ProductShippingWarrantyInput | null>(null);

  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const [createProduct, { isLoading }] = useCreateProductMutation();

  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId || ""; // Ensure it's always a string
  const userRole = user?.role as "VENDOR" | "ADMIN" || "VENDOR"; // Default value

  const formRef = useRef<HTMLDivElement>(null);

  // Translation timeout reference
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-translate when English name changes
  useEffect(() => {
    if (name.trim()) {
      // Clear previous timeout
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }

      // Set new timeout to debounce translation
      translationTimeoutRef.current = setTimeout(async () => {
        if (name.trim() && !nameBn.trim()) {
          // Only auto-translate if Bengali field is empty
          await translateName();
        }
      }, 1000);
    }

    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [name]);

  // Translation function
  const translateName = async () => {
    if (!name.trim()) return;

    setIsTranslating(true);
    try {
      const translatedName = await translateProductName(name);
      setNameBn(translatedName || ""); // Ensure it's always a string
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Manual translation button handler
  const handleManualTranslate = async () => {
    if (!name.trim()) {
      alert("Please enter an English name first");
      return;
    }
    await translateName();
  };

  // Handle English name change
  const handleNameChange = (value: string) => {
    setName(value);
  };

  // Handle Bengali name change
  const handleNameBnChange = (value: string) => {
    setNameBn(value || ""); // Ensure it's never undefined
  };

  // Handle category selection
  const handleCategorySelect = useCallback((
    id: string,
    path: string,
    isLeaf: boolean,
    categoryAttrs: Attribute[]
  ) => {
    setCategoryId(id || null);
    setIsLeafCategory(isLeaf);
    setCategoryAttributes(categoryAttrs || []);

    const requiredAttrs = (categoryAttrs || []).filter(attr => attr.isRequired);
    setRequiredAttributes(requiredAttrs);

    const initialParts: Record<string, VariantNamePart> = {};
    (categoryAttrs || []).forEach((attr) => {
      if (attr.id) {
        initialParts[attr.id] = {
          name: attr.name || "",
          value: "",
          displayValue: "",
          include: false,
        };
      }
    });
    setVariantNameParts(initialParts);
  }, []);

  // Handle attribute value change - store display value
  const handleVariantFieldChange = useCallback((
    fieldId: string,
    fieldName: string,
    value: any,
    displayValue: string,
    includeInVariant: boolean
  ) => {
    setVariantNameParts((prev) => ({
      ...prev,
      [fieldId]: { 
        name: fieldName || "", 
        value, 
        displayValue: displayValue || "",
        include: includeInVariant 
      },
    }));
  }, []);

  // Generate variant name using display values
  const generateVariantName = useCallback((): string => {
    const parts = Object.values(variantNameParts)
      .filter(part => part.include && part.displayValue)
      .map(part => `${part.name}: ${part.displayValue}`);
    
    return parts.join(' | ') || "";
  }, [variantNameParts]);

  // Validate required fields
  const validateRequiredFields = useCallback(() => {
    const errors: Record<string, boolean> = {};

    // Basic info
    if (!name) errors.productName = true;
    if (!categoryId || !isLeafCategory) errors.categorySelector = true;
    
    // Media
    if (images.length === 0) errors.productImages = true;
    
    // Required attributes
    requiredAttributes.forEach(attr => {
      const filledAttribute = attributes.find(a => a.attributeId === attr.id);
      if (!filledAttribute) {
        errors[`attribute-${attr.id}`] = true;
      }
    });
    
    // Variants
    if (variantInputs.length === 0) errors.variantsSection = true;
    
    // Shipping & Warranty
    if (!shippingWarranty?.warrantyType) errors.warrantyType = true;
    if (!shippingWarranty?.warrantyDetails) errors.warrantyDetails = true;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, categoryId, isLeafCategory, images, requiredAttributes, attributes, variantInputs, shippingWarranty]);

  // Scroll to first error
  const scrollToFirstError = useCallback(() => {
    if (!formRef.current) return;

    const errorFields = Object.keys(validationErrors);
    if (errorFields.length === 0) return;

    const firstErrorId = errorFields[0];
    const errorElement = document.getElementById(firstErrorId);
    
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      errorElement.classList.add("border-red-500", "ring-2", "ring-red-200");
      setTimeout(() => {
        errorElement.classList.remove("border-red-500", "ring-2", "ring-red-200");
      }, 3000);
    }
  }, [validationErrors]);

  // Convert uploaded image URLs to ProductImageInput[]
  const convertImages = useCallback((): ProductImageInput[] =>
    images.map((url, index) => ({
      url: url || "",
      altText: `${name} image ${index + 1}`,
      sortOrder: index,
    })), [images, name]);

  // Handle submit with validation
  const handleSubmit = async () => {
    if (!validateRequiredFields()) {
      scrollToFirstError();
      alert("⚠️ Please fill in all required fields");
      return;
    }

    if (variantInputs.length === 0) {
      alert("⚠️ Please add at least one product variant");
      return;
    }

    const invalidVariants = variantInputs.filter(
      (v) => !v.sku || !v.price || v.price <= 0
    );

    if (invalidVariants.length > 0) {
      alert("⚠️ All variants must have a SKU and valid price");
      return;
    }

    const invalidPricing = variantInputs.filter(
      (v) => v.specialPrice && v.specialPrice >= v.price
    );

    if (invalidPricing.length > 0) {
      alert("⚠️ Special price must be less than regular price");
      return;
    }

    const productData: CreateProductData = {
      name: name || "",
      nameBn: nameBn || undefined,
      description: description || undefined,
      categoryId: categoryId || "",
      vendorId: vendorId || "",
      images: convertImages(),
      videoUrl: videoUrl || undefined,
      attributes: attributes,
      variants: variantInputs.map((v) => ({
        ...v,
        name: v.name || generateVariantName(),
        images: v.images?.map((img) => {
          if (typeof img === "string") return img;
          if (img && typeof img === "object" && "url" in img) {
            return (img as ProductImageInput).url;
          }
          return img;
        }),
      })),
      shippingWarranty: shippingWarranty || undefined,
    };

    try {
      const result = await createProduct(productData).unwrap();
      alert("✅ Product created successfully!");
      console.log("Created product:", result);
      resetForm();
    } catch (err: any) {
      console.error("❌ Error creating product:", err);
      const errorMessage =
        err?.data?.message || err?.message || "Failed to create product";
      alert(`❌ ${errorMessage}`);
    }
  };

  const resetForm = useCallback(() => {
    setName("");
    setNameBn("");
    setDescription("");
    setCategoryId(null);
    setIsLeafCategory(false);
    setCategoryAttributes([]);
    setRequiredAttributes([]);
    setImages([]);
    setVideoUrl(null);
    setAttributes([]);
    setVariantInputs([]);
    setVariantNameParts({});
    setShippingWarranty(null);
    setValidationErrors({});
    setIsTranslating(false);
  }, []);

  // Form data for wizard - memoized to prevent unnecessary re-renders
  const formData = useMemo(() => ({
    name: name || "",
    nameBn: nameBn || "",
    categoryId: categoryId || "",
    isLeafCategory: isLeafCategory || false,
    images: images || [],
    videoUrl: videoUrl || "",
    description: description || "",
    attributes: attributes || [],
    variants: variantInputs || [],
    shippingWarranty: shippingWarranty || null,
    requiredAttributes: requiredAttributes || [],
  }), [
    name, nameBn, categoryId, isLeafCategory, images, videoUrl, 
    description, attributes, variantInputs, shippingWarranty, requiredAttributes
  ]);

  return (
    <div className="flex gap-6">
      {/* Main Form */}
      <div className="flex-1" ref={formRef}>
        <Card className="w-full mx-auto shadow-none border-none md:p-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add New Product</span>
              <span className="text-sm font-normal text-gray-600">
                Complete all required fields marked with *
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Name - Required */}
            <div id="productName" className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${validationErrors.productName ? 'border-l-4 border-red-500 pl-4' : ''}`}>
              <div>
                <label className="block font-medium mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter product name"
                  required
                  className={validationErrors.productName ? "border-red-500" : ""}
                />
                {validationErrors.productName && (
                  <p className="text-sm text-red-500 mt-1">Product name is required</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-medium">
                    Product Name (Bengali)
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleManualTranslate}
                    disabled={isTranslating || !name.trim()}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      "↻ Auto-translate"
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    value={nameBn}
                    onChange={(e) => handleNameBnChange(e.target.value)}
                    placeholder="Auto-translated from English"
                    className={isTranslating ? "opacity-50" : ""}
                  />
                  {isTranslating && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-translates from English. You can edit if needed.
                </p>
              </div>
            </div>

            {/* Category Selection - Required */}
            <div id="categorySelector" className={validationErrors.categorySelector ? 'border-l-4 border-red-500 pl-4' : ''}>
              <label className="block font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <CategoryTreeSelector 
                onSelect={handleCategorySelect} 
              />
              {validationErrors.categorySelector && (
                <p className="text-sm text-red-500 mt-1">Please select a leaf category</p>
              )}
            </div>

            {/* Product Images - Required */}
            <div id="productImages" className={validationErrors.productImages ? 'border-l-4 border-red-500 pl-4' : ''}>
              <label className="block font-medium mb-2">
                Product Images <span className="text-red-500">*</span>
                {images.length > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({images.length}/10 uploaded)
                  </span>
                )}
              </label>
              {validationErrors.productImages && (
                <p className="text-sm text-red-500 mb-2">At least one image is required</p>
              )}
              <ImageUploader images={images} setImages={setImages} maxImages={10} />
            </div>

            {/* Product Video - Optional */}
            <div>
              <label className="block font-medium mb-2">
                Product Video <span className="text-sm text-gray-500">(Optional)</span>
              </label>
              <VideoUploader
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                vendorId={vendorId}
                userRole={userRole}
              />
            </div>

            {/* Specifications and Attributes */}
            {isLeafCategory && (
              <SpecAttributeManager
                categoryId={categoryId || ""}
                attributes={attributes}
                setAttributes={setAttributes}
                categoryAttributes={categoryAttributes}
                requiredAttributes={requiredAttributes}
                onVariantFieldChange={handleVariantFieldChange}
                validationErrors={validationErrors}
              />
            )}

            {/* Variants */}
            {isLeafCategory && (
              <div id="variantsSection" className={validationErrors.variantsSection ? 'border-l-4 border-red-500 pl-4' : ''}>
                {validationErrors.variantsSection && (
                  <p className="text-sm text-red-500 mb-2">At least one variant is required</p>
                )}
                <VariantManager
                  variants={variantInputs}
                  setVariants={setVariantInputs}
                  variantNameParts={variantNameParts}
                  onGenerateVariantName={generateVariantName}
                />
              </div>
            )}

            {/* Warning for non-leaf categories */}
            {!isLeafCategory && categoryId && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-yellow-800 font-medium">
                  ⚠️ Please select a leaf category to add specifications and
                  variants.
                </p>
                <p className="text-yellow-600 text-sm mt-1">
                  Leaf categories are the final level categories (not parent
                  categories).
                </p>
              </div>
            )}

            {/* Description - Optional */}
            <div>
              <label className="block font-medium mb-2">
                Description
              </label>
              <ProductDescriptionEditor
                value={description}
                onChange={setDescription}
              />
            </div>

            {/* Shipping & Warranty - Required */}
            <ShippingWarrantyForm
              value={shippingWarranty}
              onChange={setShippingWarranty}
              validationErrors={validationErrors}
            />

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
              <Button
                variant="outline"
                className="bg-amber-200"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to reset the form? All data will be lost."
                    )
                  ) {
                    resetForm();
                  }
                }}
                disabled={isLoading}
                size="lg"
              >
                Reset Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar - Only Wizard */}
      <RightSidebar
        wizardComponent={<ProductCreationWizard formData={formData} />}
      />
    </div>
  );
}

// Main Export with Provider
export default function AddProductForm() {
  return (
    <RightSidebarProvider>
      <AddProductFormContent />
    </RightSidebarProvider>
  );
}