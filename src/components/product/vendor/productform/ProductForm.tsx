"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
import {
  RightSidebar,
  RightSidebarProvider,
} from "@/app/vendor-dashboard/rightbar/RightSidebar";
import { ProductCreationWizard } from "@/components/wizard/vendorrightsidewizard/ProductCreationWizard";
import { Loader2, Search, AlertCircle, Check } from "lucide-react";
import { translateProductName } from "@/utils/translate";
import { useGetCategoriesQuery } from "@/features/apiSlice";

// Define types for category data structure
interface Category {
  id: string;
  name: string;
  attributes?: Attribute[];
  children?: Category[];
}

interface CategorySuggestion {
  id: string;
  name: string;
  fullPath: string;
}

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

  const [validationErrors, setValidationErrors] = useState<
    Record<string, boolean>
  >({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<
    CategorySuggestion[]
  >([]);

  const [createProduct, { isLoading }] = useCreateProductMutation();
  const { data: categories, isLoading: categoriesLoading } =
    useGetCategoriesQuery();

  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId || "";
  const userRole = (user?.role as "VENDOR" | "ADMIN") || "VENDOR";

  const formRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const categorySuggestionRef = useRef<HTMLDivElement>(null);

  // Translation timeout reference
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Category suggestion timeout reference
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Get name validation error
  const nameValidationError = useMemo(() => {
    return validateNameLength(name);
  }, [name, validateNameLength]);

  // Find category suggestions based on product name
  const findCategorySuggestions = useCallback(
    (productName: string) => {
      if (
        !categories ||
        !productName.trim() ||
        productName.trim().length < 10
      ) {
        setSuggestedCategories([]);
        return;
      }

      const searchTerms = productName
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length > 2);
      if (searchTerms.length === 0) return;

      const suggestions: Array<{
        id: string;
        name: string;
        fullPath: string;
        matchScore: number;
      }> = [];

      const traverseCategories = (
        categoryList: Category[],
        currentPath: string[] = [],
        parentNames: string[] = []
      ) => {
        categoryList.forEach((category: Category) => {
          const fullPath = [...currentPath, category.name];
          const allNames = [...parentNames, category.name];
          const categoryText = allNames.join(" ").toLowerCase();

          // Calculate match score
          let matchScore = 0;
          searchTerms.forEach((term) => {
            if (categoryText.includes(term)) {
              matchScore += term.length * 2; // Weight by term length
            }
          });

          // Also check if category name contains any search term
          const categoryNameLower = category.name.toLowerCase();
          searchTerms.forEach((term) => {
            if (categoryNameLower.includes(term)) {
              matchScore += term.length * 3; // Higher weight for exact category name match
            }
          });

          // Add to suggestions if there's a match
          if (matchScore > 0) {
            suggestions.push({
              id: category.id,
              name: category.name,
              fullPath: fullPath.join(" > "),
              matchScore,
            });
          }

          // Recursively traverse children
          if (category.children && category.children.length > 0) {
            traverseCategories(category.children, fullPath, allNames);
          }
        });
      };

      traverseCategories(categories as Category[]);

      // Sort by match score and take top 5
      const sortedSuggestions = suggestions
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)
        .map(({ id, name, fullPath }) => ({ id, name, fullPath }));

      setSuggestedCategories(sortedSuggestions);
      setShowCategorySuggestions(sortedSuggestions.length > 0);
    },
    [categories]
  );

  // Handle English name change with category suggestions
  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);

      // Clear previous timeout
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }

      // Debounce category suggestion
      suggestionTimeoutRef.current = setTimeout(() => {
        findCategorySuggestions(value);
      }, 500);
    },
    [findCategorySuggestions]
  );

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
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [name, nameBn]);

  // Close category suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categorySuggestionRef.current &&
        !categorySuggestionRef.current.contains(event.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(event.target as Node)
      ) {
        setShowCategorySuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Translation function
  const translateName = async () => {
    if (!name.trim()) return;

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

  // Manual translation button handler
  const handleManualTranslate = async () => {
    if (!name.trim()) {
      alert("Please enter an English name first");
      return;
    }
    await translateName();
  };

  // Handle Bengali name change
  const handleNameBnChange = (value: string) => {
    setNameBn(value || "");
  };

  // Find category by ID helper function
  const findCategoryById = useCallback(
    (cats: Category[], targetId: string): Category | null => {
      for (const cat of cats) {
        if (cat.id === targetId) {
          return cat;
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryById(cat.children, targetId);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  // Handle category selection from suggestions
  const handleCategorySuggestionSelect = (
    categoryId: string,
    fullPath: string
  ) => {
    // Find the category object from categories data
    const category = findCategoryById((categories as Category[]) || [], categoryId);
    
    if (category) {
      const isLeaf = !category.children || category.children.length === 0;
      const categoryAttrs: Attribute[] = category.attributes || [];

      setCategoryId(categoryId);
      setIsLeafCategory(isLeaf);
      setCategoryAttributes(categoryAttrs);

      const requiredAttrs = categoryAttrs.filter((attr: Attribute) => attr.isRequired);
      setRequiredAttributes(requiredAttrs);

      const initialParts: Record<string, VariantNamePart> = {};
      categoryAttrs.forEach((attr: Attribute) => {
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

      // Hide suggestions
      setShowCategorySuggestions(false);
    }
  };

  // Handle category selection from tree selector
  const handleCategorySelect = useCallback(
    (id: string, path: string, isLeaf: boolean, categoryAttrs: Attribute[]) => {
      setCategoryId(id || null);
      setIsLeafCategory(isLeaf);
      setCategoryAttributes(categoryAttrs || []);

      const requiredAttrs = (categoryAttrs || []).filter(
        (attr: Attribute) => attr.isRequired
      );
      setRequiredAttributes(requiredAttrs);

      const initialParts: Record<string, VariantNamePart> = {};
      (categoryAttrs || []).forEach((attr: Attribute) => {
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
    },
    []
  );

  // Handle attribute value change - store display value
  const handleVariantFieldChange = useCallback(
    (
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
          include: includeInVariant,
        },
      }));
    },
    []
  );

  // Generate variant name using display values
  const generateVariantName = useCallback((): string => {
    const parts = Object.values(variantNameParts)
      .filter((part) => part.include && part.displayValue)
      .map((part) => `${part.name}: ${part.displayValue}`);

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

    // Shipping & Warranty
    if (!shippingWarranty?.warrantyType) errors.warrantyType = true;
    if (!shippingWarranty?.warrantyDetails) errors.warrantyDetails = true;

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
    shippingWarranty,
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
    setShowCategorySuggestions(false);
    setSuggestedCategories([]);
  }, []);

  // Form data for wizard - memoized to prevent unnecessary re-renders
  const formData = useMemo(
    () => ({
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
    }),
    [
      name,
      nameBn,
      categoryId,
      isLeafCategory,
      images,
      videoUrl,
      description,
      attributes,
      variantInputs,
      shippingWarranty,
      requiredAttributes,
    ]
  );

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
                      ref={nameInputRef}
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter product name (min 10 characters)"
                      required
                      maxLength={255}
                      className={`pl-10 ${
                        validationErrors.productName ||
                        validationErrors.productNameLength
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                productName={name} // Pass product name
                suggestedCategories={suggestedCategories}
                onSuggestionSelect={handleCategorySuggestionSelect}
              />
              {validationErrors.categorySelector && (
                <p className="text-sm text-red-500 mt-1">
                  Please select a leaf category
                </p>
              )}
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
            <div className="flex gap-4 pt-6 border-t">
              <Button
                onClick={handleSubmit}
                disabled={
                  isLoading || !!nameValidationError || name.length < 10
                }
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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