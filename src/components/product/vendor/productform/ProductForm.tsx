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
import { RightSidebar,RightSidebarProvider } from "@/app/vendor-dashboard/rightbar/RightSidebar";

import { ProductCreationWizard } from "@/components/wizard/vendorrightsidewizard/ProductCreationWizard";

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

  // UNIFIED: Single attributes array
  const [attributes, setAttributes] = useState<ProductAttributeInput[]>([]);
  const [variantInputs, setVariantInputs] = useState<ProductVariantInput[]>([]);
  const [variantNameParts, setVariantNameParts] = useState<
    Record<string, VariantNamePart>
  >({});
  const [shippingWarranty, setShippingWarranty] =
    useState<ProductShippingWarrantyInput | null>(null);

  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const [createProduct, { isLoading }] = useCreateProductMutation();

  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId;
  const userRole = user?.role as "VENDOR" | "ADMIN";

  const formRef = useRef<HTMLDivElement>(null);

  // Handle category selection
  const handleCategorySelect = useCallback((
    id: string,
    path: string,
    isLeaf: boolean,
    categoryAttrs: Attribute[]
  ) => {
    setCategoryId(id);
    setIsLeafCategory(isLeaf);
    setCategoryAttributes(categoryAttrs);

    // Separate required attributes
    const requiredAttrs = categoryAttrs.filter(attr => attr.isRequired);
    setRequiredAttributes(requiredAttrs);

    // Initialize variant name parts with display values
    const initialParts: Record<string, VariantNamePart> = {};
    categoryAttrs.forEach((attr) => {
      initialParts[attr.id] = {
        name: attr.name,
        value: "",
        displayValue: "",
        include: false,
      };
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
        name: fieldName, 
        value, 
        displayValue,
        include: includeInVariant 
      },
    }));
  }, []);

  // Generate variant name using display values
  const generateVariantName = useCallback((): string => {
    const parts = Object.values(variantNameParts)
      .filter(part => part.include && part.displayValue)
      .map(part => `${part.name}: ${part.displayValue}`);
    
    return parts.join(' | ');
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
      if (!filledAttribute ) {
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
      url,
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

    // Check if all variants have required fields
    const invalidVariants = variantInputs.filter(
      (v) => !v.sku || !v.price || v.price <= 0
    );

    if (invalidVariants.length > 0) {
      alert("⚠️ All variants must have a SKU and valid price");
      return;
    }

    // Check for special price validation
    const invalidPricing = variantInputs.filter(
      (v) => v.specialPrice && v.specialPrice >= v.price
    );

    if (invalidPricing.length > 0) {
      alert("⚠️ Special price must be less than regular price");
      return;
    }

    const productData: CreateProductData = {
      name,
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
  }, []);

  // Form data for wizard - memoized to prevent unnecessary re-renders
  const formData = useMemo(() => ({
    name,
    nameBn,
    categoryId,
    isLeafCategory,
    images,
    videoUrl,
    description,
    attributes,
    variants: variantInputs,
    shippingWarranty,
    requiredAttributes,
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
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                  required
                  className={validationErrors.productName ? "border-red-500" : ""}
                />
                {validationErrors.productName && (
                  <p className="text-sm text-red-500 mt-1">Product name is required</p>
                )}
              </div>
              <div>
                <label className="block font-medium mb-2">
                  Product Name (Bengali)
                </label>
                <Input
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="Enter product name in Bengali"
                />
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
                vendorId={vendorId || ""}
                userRole={userRole}
              />
            </div>

            {/* Specifications and Attributes */}
            {isLeafCategory && (
              <SpecAttributeManager
                categoryId={categoryId}
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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
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

      {/* Right Sidebar */}
      <RightSidebar
        wizardComponent={<ProductCreationWizard formData={formData} />}
        instructionsComponent={
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Product Creation Guide</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Required Fields</h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Product Name</li>
                  <li>• Category (Leaf Level)</li>
                  <li>• Product Images (Min 1)</li>
                  <li>• Required Attributes</li>
                  <li>• Product Variants (Min 1)</li>
                  <li>• Shipping & Warranty Info</li>
                </ul>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">Best Practices</h4>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Use high-quality product images</li>
                  <li>• Set accurate variant prices</li>
                  <li>• Provide detailed specifications</li>
                  <li>• Set appropriate stock levels</li>
                  <li>• Review before submission</li>
                </ul>
              </div>
            </div>
          </div>
        }
        settingsComponent={
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Form Settings</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Configure your product creation preferences here.
                </p>
              </div>
            </div>
          </div>
        }
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