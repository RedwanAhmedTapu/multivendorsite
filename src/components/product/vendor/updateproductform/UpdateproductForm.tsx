"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "@/features/productApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, Check, ArrowLeft } from "lucide-react";
import CategoryTreeSelector from "../productform/CategoryTreeSelector";
import ImageUploader from "@/components/imageuploader/ImageUploader";
import VideoUploader from "@/components/videouploader/VideoUploader";
import SpecAttributeManager from "../productform/SpecAttributeManager";
import VariantManager from "../productform/VariantManager";
import ProductDescriptionEditor from "@/components/productdescription/ProductDescriptionl";
import ShippingWarrantyForm from "../productform/ShippingWarrantyForm";
import { translateProductName } from "@/utils/translate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { 
  Attribute, 
  VariantNamePart, 
  Product,
  ProductVariant,
  ProductImage,
  Warranty,
  Review,
  OfferProduct,
  CategoryAttribute 
} from "@/types/type";
import {
  ProductAttributeInput,
  ProductImageInput,
  ProductShippingWarrantyInput,
  ProductVariantInput,
  UpdateProductData,
} from "@/types/product";

// Define types specific to this component
interface ExtendedProduct extends Omit<Product, 'reviews' | 'offerProducts'> {
  reviews?: Review[];
  offerProducts?: OfferProduct[];
  warranty?: Warranty | null;
}

interface CategorySuggestion {
  id: string;
  name: string;
  fullPath: string;
}

// Helper function to convert ProductVariant to ProductVariantInput
const convertVariantToInput = (variant: ProductVariant): ProductVariantInput => {
  return {
    id: variant.id,
    name: variant.name || null,
    sku: variant.sku,
    price: variant.price,
    availability: variant.availability,
    specialPrice: variant.specialPrice || null,
    discount: variant.discount || undefined,
    stock: variant.stock,
    weight: variant.weight || null,
    images: variant.images?.map((img: ProductImage) => ({
      url: img.url,
      altText: img.altText || undefined,
      sortOrder: img.sortOrder || undefined,
    })) || [],
    attributes: variant.attributes?.map(attr => ({
      attributeValueId: attr.attributeValueId,
    })),
  };
};

// Helper function to convert ProductAttribute to ProductAttributeInput
const convertAttributeToInput = (attr: any): ProductAttributeInput => {
  return {
    attributeId: attr.attributeId,
    isForVariant: attr.isForVariant || false,
    valueString: attr.valueString || null,
    valueNumber: attr.valueNumber || null,
    valueBoolean: attr.valueBoolean || null,
    attributeValueId: attr.attributeValueId || null,
  };
};

// Helper function to convert Warranty to ProductShippingWarrantyInput
const convertWarrantyToInput = (warranty: Warranty | null | undefined): ProductShippingWarrantyInput | null => {
  if (!warranty) return null;
  
  return {
    packageWeightValue: warranty.packageWeightValue,
    packageWeightUnit: warranty.packageWeightUnit.toLowerCase() as "kg" | "g",
    packageLength: warranty.packageLength,
    packageWidth: warranty.packageWidth,
    packageHeight: warranty.packageHeight,
    dangerousGoods: warranty.dangerousGoods.toLowerCase() as "none" | "contains",
    warrantyType: warranty.type,
    warrantyPeriodValue: warranty.duration,
    warrantyPeriodUnit: warranty.unit.toLowerCase() as "days" | "months" | "years",
    warrantyDetails: warranty.policy || null,
  };
};

// Main Update Component
export default function UpdateProductForm() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId || "";
  const userRole = (user?.role as "VENDOR" | "ADMIN") || "VENDOR";

  // RTK Query hooks
  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
    refetch,
  } = useGetProductByIdQuery(productId);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  // State management
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
  const [productStatus, setProductStatus] = useState<
    "PENDING" | "ACTIVE" | "REJECTED" | "DRAFT" | "INACTIVE"
  >("PENDING");

  const [validationErrors, setValidationErrors] = useState<
    Record<string, boolean>
  >({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<
    CategorySuggestion[]
  >([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user owns this product
  useEffect(() => {
    if (product && vendorId && (product as Product).vendorId !== vendorId && userRole === "VENDOR") {
      alert("You don't have permission to edit this product");
      router.push("/vendor-dashboard/products");
    }
  }, [product, vendorId, userRole, router]);

  // Initialize form with product data
  useEffect(() => {
    if (product && !initialLoadComplete) {
      const productData = product as ExtendedProduct;
      
      setName(productData.name || "");
      setNameBn(productData.nameBn || "");
      setDescription(productData.description || "");
      setCategoryId(productData.categoryId || null);
      setIsLeafCategory(true); // Assuming category is already selected
      setImages(productData.images?.map((img: ProductImage) => img.url) || []);
      setVideoUrl(productData.videoUrl || null);
      
      // Convert attributes
      const convertedAttributes = (productData.attributes || []).map(convertAttributeToInput);
      setAttributes(convertedAttributes);
      
      // Convert variants
      const convertedVariants = (productData.variants || []).map(convertVariantToInput);
      setVariantInputs(convertedVariants);
      
      // Convert warranty
      const convertedWarranty = convertWarrantyToInput(productData.warranty);
      setShippingWarranty(convertedWarranty);
      
      setProductStatus(productData.approvalStatus || "PENDING");

      // Set initial variant name parts
      // Note: We need to get attributes from category, but we'll initialize from existing product attributes
      const initialParts: Record<string, VariantNamePart> = {};
      (productData.attributes || []).forEach((attr: any) => {
        if (attr.attribute) {
          initialParts[attr.attributeId] = {
            name: attr.attribute.name || "",
            value: attr.valueString || attr.valueNumber?.toString() || attr.attributeValue?.value || "",
            include: attr.isForVariant || false,
          };
        }
      });
      setVariantNameParts(initialParts);

      setInitialLoadComplete(true);
    }
  }, [product, initialLoadComplete]);

  // Track changes
  useEffect(() => {
    if (initialLoadComplete && product) {
      const productData = product as ExtendedProduct;
      
      const currentData = {
        name,
        nameBn,
        description,
        categoryId,
        images,
        videoUrl,
        attributes: JSON.stringify(attributes),
        variants: JSON.stringify(variantInputs),
        shippingWarranty: JSON.stringify(shippingWarranty),
      };

      const originalData = {
        name: productData.name || "",
        nameBn: productData.nameBn || "",
        description: productData.description || "",
        categoryId: productData.categoryId || null,
        images: JSON.stringify(productData.images?.map((img: ProductImage) => img.url) || []),
        videoUrl: productData.videoUrl || null,
        attributes: JSON.stringify((productData.attributes || []).map(convertAttributeToInput)),
        variants: JSON.stringify((productData.variants || []).map(convertVariantToInput)),
        shippingWarranty: JSON.stringify(convertWarrantyToInput(productData.warranty)),
      };

      const hasChanges = Object.keys(currentData).some(
        (key) =>
          JSON.stringify(currentData[key as keyof typeof currentData]) !==
          JSON.stringify(originalData[key as keyof typeof originalData])
      );

      setHasChanges(hasChanges);
    }
  }, [
    name,
    nameBn,
    description,
    categoryId,
    images,
    videoUrl,
    attributes,
    variantInputs,
    shippingWarranty,
    product,
    initialLoadComplete,
  ]);

  // Validate product name length
  const validateNameLength = useCallback((value: string) => {
    if (value.length > 0 && value.length < 10) {
      return "Product name must be at least 10 characters";
    }
    if (value.length > 255) {
      return "Product name cannot exceed 255 characters";
    }
    return "";
  }, []);

  const nameValidationError = useMemo(() => {
    return validateNameLength(name);
  }, [name, validateNameLength]);

  // Handle English name change
  const handleNameChange = useCallback((value: string) => {
    setName(value);
  }, []);

  // Auto-translate when English name changes
  useEffect(() => {
    if (name.trim() && !nameBn.trim() && hasChanges) {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }

      translationTimeoutRef.current = setTimeout(async () => {
        setIsTranslating(true);
        try {
          const translatedName = await translateProductName(name);
          setNameBn(translatedName || "");
        } catch (error) {
          console.error("Translation error:", error);
        } finally {
          setIsTranslating(false);
        }
      }, 1000);
    }

    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [name, nameBn, hasChanges]);

  // Manual translation button handler
  const handleManualTranslate = async () => {
    if (!name.trim()) {
      alert("Please enter an English name first");
      return;
    }
    setIsTranslating(true);
    try {
      const translatedName = await translateProductName(name);
      setNameBn(translatedName || "");
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle Bengali name change
  const handleNameBnChange = (value: string) => {
    setNameBn(value || "");
  };

  // Handle category selection
 // Handle category selection - FIXED: Safely handle undefined attributes and different data structures
const handleCategorySelect = useCallback(
  (id: string, path: string, isLeaf: boolean, categoryAttrs: any[]) => {
    setCategoryId(id || null);
    setIsLeafCategory(isLeaf);
    
    // Log for debugging
    console.log("Category attrs received:", categoryAttrs);
    
    let convertedAttributes: Attribute[] = [];
    
    if (categoryAttrs && categoryAttrs.length > 0) {
      // Try to determine the structure of the attributes
      const firstAttr = categoryAttrs[0];
      
      if (firstAttr && firstAttr.attribute) {
        // It's the CategoryAttribute structure: { attribute: Attribute, isRequired: boolean, ... }
        convertedAttributes = categoryAttrs
          .filter((catAttr): catAttr is { attribute: Attribute } => 
            catAttr && catAttr.attribute && catAttr.attribute.id
          )
          .map(catAttr => ({
            id: catAttr.attribute.id,
            name: catAttr.attribute.name,
            slug: catAttr.attribute.slug,
            type: catAttr.attribute.type,
            isRequired: catAttr.isRequired || false,
            isForVariant: catAttr.isForVariant || false,
            isSearchable: catAttr.attribute.isSearchable || false,
            isFilterable: catAttr.attribute.isFilterable || false,
            values: catAttr.attribute.values || [],
            categoryId: catAttr.categoryId || catAttr.attribute.categoryId,
            createdAt: catAttr.attribute.createdAt || new Date().toISOString(),
            updatedAt: catAttr.attribute.updatedAt || new Date().toISOString(),
          }));
      } else if (firstAttr && firstAttr.id) {
        // It's already an Attribute structure
        convertedAttributes = categoryAttrs.map(attr => ({
          id: attr.id,
          name: attr.name,
          slug: attr.slug,
          type: attr.type,
          isRequired: attr.isRequired || false,
          isForVariant: attr.isForVariant || false,
          isSearchable: attr.isSearchable || false,
          isFilterable: attr.isFilterable || false,
          values: attr.values || [],
          categoryId: attr.categoryId,
          createdAt: attr.createdAt || new Date().toISOString(),
          updatedAt: attr.updatedAt || new Date().toISOString(),
        }));
      }
    }
    
    setCategoryAttributes(convertedAttributes);

    const requiredAttrs = convertedAttributes.filter(
      (attr: Attribute) => attr.isRequired
    );
    setRequiredAttributes(requiredAttrs);

    const initialParts: Record<string, VariantNamePart> = {};
    convertedAttributes.forEach((attr: Attribute) => {
      if (attr.id) {
        initialParts[attr.id] = {
          name: attr.name || "",
          value: "",
          include: attr.isForVariant || false,
        };
      }
    });
    setVariantNameParts(initialParts);
  },
  []
);

  // Handle attribute value change
  const handleVariantFieldChange = useCallback(
    (
      fieldId: string,
      fieldName: string,
      value: any,
      includeInVariant: boolean
    ) => {
      setVariantNameParts((prev) => ({
        ...prev,
        [fieldId]: {
          name: fieldName || "",
          value,
          include: includeInVariant,
        },
      }));
    },
    []
  );

  // Generate variant name
  const generateVariantName = useCallback((): string => {
    const parts = Object.values(variantNameParts)
      .filter((part) => part.include && part.value)
      .map((part) => `${part.name}: ${part.value}`);

    return parts.join(" | ") || "";
  }, [variantNameParts]);

  // Validate required fields
  const validateRequiredFields = useCallback(() => {
    const errors: Record<string, boolean> = {};

    // Basic info
    if (!name) errors.productName = true;
    if (nameValidationError) errors.productNameLength = true;
    if (!categoryId || !isLeafCategory) errors.categorySelector = true;

    // Media
    if (images.length === 0) errors.productImages = true;

    // Required attributes
    requiredAttributes.forEach((attr: Attribute) => {
      const filledAttribute = attributes.find((a) => a.attributeId === attr.id);
      if (!filledAttribute) {
        errors[`attribute-${attr.id}`] = true;
      }
    });

    // Variants
    if (variantInputs.length === 0) errors.variantsSection = true;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [
    name,
    nameValidationError,
    categoryId,
    isLeafCategory,
    images,
    requiredAttributes,
    attributes,
    variantInputs,
  ]);

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
        errorElement.classList.remove(
          "border-red-500",
          "ring-2",
          "ring-red-200"
        );
      }, 3000);
    }
  }, [validationErrors]);

  // Convert uploaded image URLs to ProductImageInput[]
  const convertImages = useCallback(
    (): ProductImageInput[] =>
      images.map((url, index) => ({
        url: url || "",
        altText: `${name} image ${index + 1}`,
        sortOrder: index,
      })),
    [images, name]
  );

  // Handle submit with validation
  const handleSubmit = async () => {
    // Validate name length first
    if (nameValidationError) {
      setValidationErrors((prev) => ({ ...prev, productNameLength: true }));
      alert(`⚠️ ${nameValidationError}`);
      return;
    }

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

    // Prepare update data
    const updateData: UpdateProductData = {
      name: name || "",
      nameBn: nameBn || undefined,
      description: description || undefined,
      categoryId: categoryId || "",
      videoUrl: videoUrl || undefined,
      images: convertImages(),
      attributes: attributes,
      variants: variantInputs.map((v) => {
        const variantData: ProductVariantInput = {
          id: v.id,
          name: v.name || generateVariantName(),
          sku: v.sku,
          price: v.price,
          availability: v.availability !== undefined ? v.availability : true,
          specialPrice: v.specialPrice || null,
          discount: v.discount,
          stock: v.stock || 0,
          weight: v.weight || null,
          attributes: v.attributes?.map(attr => ({
            attributeValueId: attr.attributeValueId,
            value: attr.value,
          })),
          images: v.images?.map((img) => {
            if (typeof img === "string") {
              return img;
            }
            return (img as ProductImageInput).url;
          }),
        };
        return variantData;
      }),
      shippingWarranty: shippingWarranty || undefined,
    };

    try {
      const result = await updateProduct({
        id: productId,
        data: updateData,
      }).unwrap();
      alert("✅ Product updated successfully!");
      refetch(); // Refresh product data
      setHasChanges(false);
    } catch (err: any) {
      console.error("❌ Error updating product:", err);
      const errorMessage =
        err?.data?.message || err?.message || "Failed to update product";
      alert(`❌ ${errorMessage}`);
    }
  };

  // Handle reset to original values
  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset all changes? This will revert to original product data."
      )
    ) {
      if (product) {
        const productData = product as ExtendedProduct;
        
        setName(productData.name || "");
        setNameBn(productData.nameBn || "");
        setDescription(productData.description || "");
        setCategoryId(productData.categoryId || null);
        setImages(productData.images?.map((img: ProductImage) => img.url) || []);
        setVideoUrl(productData.videoUrl || null);
        
        const convertedAttributes = (productData.attributes || []).map(convertAttributeToInput);
        setAttributes(convertedAttributes);
        
        const convertedVariants = (productData.variants || []).map(convertVariantToInput);
        setVariantInputs(convertedVariants);
        
        const convertedWarranty = convertWarrantyToInput(productData.warranty);
        setShippingWarranty(convertedWarranty);
        
        setHasChanges(false);
      }
    }
  };

  // Handle go back
  const handleGoBack = () => {
    if (hasChanges) {
      const confirmLeave = confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }
    router.push("/vendor-dashboard/products");
  };

  // Loading state
  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading product data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (productError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load product. Please try again later.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/vendor-dashboard/products")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Product not found</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/vendor-dashboard/products")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    );
  }

  const productData = product as ExtendedProduct;

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Product: {productData.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  productStatus === "ACTIVE"
                    ? "default"
                    : productStatus === "REJECTED"
                    ? "destructive"
                    : "outline"
                }
              >
                {productStatus}
              </Badge>
              <span className="text-sm text-gray-500">
                Product ID: {productId}
              </span>
            </div>
          </div>
        </div>

        {hasChanges && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Unsaved Changes
          </Badge>
        )}
      </div>

      {/* Product Status Alert */}
      {productStatus === "REJECTED" && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            This product was rejected. Please update and resubmit for approval.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_13rem] gap-4">
        {/* MAIN FORM */}
        <div ref={formRef}>
          <Card className="w-full mx-auto shadow-sm border">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>Edit Product Details</span>
                <span className="text-sm font-normal text-gray-600">
                  Update required fields marked with *
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Product Name - Required */}
              <div id="productName" className="relative">
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                    validationErrors.productName
                      ? "border-l-4 border-red-500 pl-4"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <label className="block font-medium mb-2">
                      Product Name <span className="text-red-500">*</span>
                      {name.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          ({name.length}/255 characters)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Input
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Enter product name (min 10 characters)"
                        required
                        maxLength={255}
                        className={`${
                          validationErrors.productName ||
                          validationErrors.productNameLength
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {name.length > 0 &&
                        name.length >= 10 &&
                        !nameValidationError && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                    </div>

                    {/* Validation messages */}
                    {validationErrors.productName && (
                      <p className="text-sm text-red-500 mt-1">
                        Product name is required
                      </p>
                    )}
                    {nameValidationError && (
                      <div className="flex items-center gap-1 text-sm text-red-500 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{nameValidationError}</span>
                      </div>
                    )}
                    {name.length >= 10 && !nameValidationError && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <Check className="h-4 w-4" />
                        Product name length is good
                      </p>
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
                        disabled={
                          isTranslating || !name.trim() || name.length < 10
                        }
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
                        placeholder={
                          name.length >= 10
                            ? "Auto-translated from English"
                            : "Enter English name first"
                        }
                        maxLength={255}
                        className={isTranslating ? "opacity-50" : ""}
                        disabled={name.length < 10}
                      />
                      {isTranslating && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {name.length >= 10
                        ? "Auto-translates from English. You can edit if needed."
                        : "Enter at least 10 characters in English name to enable translation"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Selection - Required */}
              <div
                id="categorySelector"
                className={
                  validationErrors.categorySelector
                    ? "border-l-4 border-red-500 pl-4"
                    : ""
                }
              >
                <label className="block font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                  {categoryId && (
                    <span className="ml-2 text-xs font-normal text-teal-600">
                      ✓ Selected
                    </span>
                  )}
                </label>
                <CategoryTreeSelector
                  onSelect={handleCategorySelect}
                  productName={name}
                  suggestedCategories={suggestedCategories}
                  onSuggestionSelect={() => {}}
                  initialCategoryId={categoryId}
                />
                {validationErrors.categorySelector && (
                  <p className="text-sm text-red-500 mt-1">
                    Please select a leaf category
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Current category: {productData.category?.name || "Not set"}
                </p>
              </div>

              {/* Product Images - Required */}
              <div
                id="productImages"
                className={
                  validationErrors.productImages
                    ? "border-l-4 border-red-500 pl-4"
                    : ""
                }
              >
                <label className="block font-medium mb-2">
                  Product Images <span className="text-red-500">*</span>
                  {images.length > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({images.length}/10 uploaded)
                    </span>
                  )}
                </label>
                {validationErrors.productImages && (
                  <p className="text-sm text-red-500 mb-2">
                    At least one image is required
                  </p>
                )}
                <ImageUploader
                  images={images}
                  setImages={setImages}
                  maxImages={10}
                  existingImages={productData.images?.map((img: ProductImage) => img.url) || []}
                />
              </div>

              {/* Product Video - Optional */}
              <div>
                <label className="block font-medium mb-2">
                  Product Video{" "}
                  <span className="text-sm text-gray-500">(Optional)</span>
                </label>
                <VideoUploader
                  videoUrl={videoUrl}
                  setVideoUrl={setVideoUrl}
                  vendorId={vendorId}
                  userRole={userRole}
                  existingVideoUrl={productData.videoUrl || null}
                />
              </div>

              {/* Specifications and Attributes */}
              {isLeafCategory && categoryAttributes.length > 0 && (
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
                <div
                  id="variantsSection"
                  className={
                    validationErrors.variantsSection
                      ? "border-l-4 border-red-500 pl-4"
                      : ""
                  }
                >
                  {validationErrors.variantsSection && (
                    <p className="text-sm text-red-500 mb-2">
                      At least one variant is required
                    </p>
                  )}
                  <VariantManager
                    variants={variantInputs}
                    setVariants={setVariantInputs}
                    variantNameParts={variantNameParts}
                    onGenerateVariantName={generateVariantName}
                    categoryAttributes={categoryAttributes}
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
                <label className="block font-medium mb-2">Description</label>
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
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isUpdating || !!nameValidationError || name.length < 10 || !hasChanges
                  }
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  size="lg"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="bg-amber-200 hover:bg-amber-300"
                  onClick={handleReset}
                  disabled={isUpdating || !hasChanges}
                  size="lg"
                >
                  Reset Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  disabled={isUpdating}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="hidden lg:block">
          <aside className="sticky top-0">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <CardTitle className="text-lg">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge
                      variant={
                        productStatus === "ACTIVE"
                          ? "default"
                          : productStatus === "REJECTED"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {productStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm">
                      {new Date(productData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <span className="text-sm">
                      {new Date(productData.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Variants:</span>
                    <span className="text-sm font-medium">
                      {productData.variants?.length || 0}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        window.open(
                          `/product/${productId}`,
                          "_blank"
                        );
                      }}
                    >
                      View Live Product
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        navigator.clipboard.writeText(productId);
                        alert("Product ID copied to clipboard!");
                      }}
                    >
                      Copy Product ID
                    </Button>
                  </div>
                </div>

                {hasChanges && (
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 text-sm">
                      You have unsaved changes. Don't forget to update!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}