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
import { useCreateProductMutation } from "@/features/productApi";
import CategoryTreeSelector from "./CategoryTreeSelector";
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
import {
  Loader2,
  Search,
  AlertCircle,
  Check,
  FileText,
  Tag,
  Image,
  Layers,
  Package,
  Truck,
  Percent,
  Warehouse,
} from "lucide-react";
import { translateProductName } from "@/utils/translate";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import ProductMediaUploader from "@/components/mediauploader/ProductMediaUploader";
import WarehouseRackSelector, {
  WarehouseRackSelection,
} from "./WarehouseRack";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Section Card Shell ───────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  badge,
  children,
  error,
  id,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: "required" | "optional";
  children: React.ReactNode;
  error?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      style={{
        background: "#fff",
        border: `1.5px solid ${error ? "#FCA5A5" : "#E5EAF2"}`,
        borderRadius: 14,
        marginBottom: 0,
        boxShadow: error
          ? "0 0 0 3px rgba(239,68,68,0.08)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid #F0F4FA",
          background: "#FAFBFD",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: error ? "#FEF2F2" : "#EEF3FB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#0D1B2E",
                letterSpacing: "-0.2px",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 1 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 9px",
              borderRadius: 20,
              background: badge === "required" ? "#FEF2F2" : "#F0F9F0",
              color: badge === "required" ? "#DC2626" : "#16A34A",
              border: `1px solid ${badge === "required" ? "#FECACA" : "#BBF7D0"}`,
            }}
          >
            {badge === "required" ? "Required" : "Optional"}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "18px 18px" }}>{children}</div>
    </div>
  );
}

// ─── Field Label ──────────────────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#3D5068",
          letterSpacing: "0.01em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {children}
        {required && (
          <span style={{ color: "#DC2626", fontWeight: 800 }}>*</span>
        )}
      </label>
      {hint && (
        <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 2 }}>{hint}</p>
      )}
    </div>
  );
}

// ─── Inline error ─────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 5,
        fontSize: 11.5,
        color: "#DC2626",
      }}
    >
      <AlertCircle size={12} />
      {message}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({
  n,
  active,
  done,
}: {
  n: number;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: done ? "#0D9488" : active ? "#1D4ED8" : "#E5EAF2",
        color: done || active ? "#fff" : "#94A3B8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 800,
        flexShrink: 0,
        transition: "all 0.2s",
      }}
    >
      {done ? <Check size={12} /> : n}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

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
  const [resetKey, setResetKey] = useState(0);
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

  // ── VAT field ──────────────────────────────────────────────────────────────
  const [vatPercentage, setVatPercentage] = useState<string>("");
  const [vatError, setVatError] = useState<string>("");

  // ── Warehouse & Rack ───────────────────────────────────────────────────────
  const [warehouseRack, setWarehouseRack] =
    useState<WarehouseRackSelection | null>(null);

  const [createProduct, { isLoading }] = useCreateProductMutation();
  const { data: categories } = useGetCategoriesQuery();
  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId || "";
  const userRole = (user?.role as "VENDOR" | "ADMIN") || "VENDOR";

  const formRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const categorySuggestionRef = useRef<HTMLDivElement>(null);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateNameLength = useCallback((value: string) => {
    if (value.length > 0 && value.length < 10)
      return "Product name must be at least 10 characters";
    if (value.length > 255) return "Product name cannot exceed 255 characters";
    return "";
  }, []);

  const nameValidationError = useMemo(
    () => validateNameLength(name),
    [name, validateNameLength]
  );

  // ── VAT validation ─────────────────────────────────────────────────────────

  const handleVatChange = useCallback((value: string) => {
    if (value === "" || /^\d{0,3}(\.\d{0,2})?$/.test(value)) {
      setVatPercentage(value);
      const num = parseFloat(value);
      if (value !== "" && (isNaN(num) || num < 0 || num > 100)) {
        setVatError("VAT must be between 0% and 100%");
      } else {
        setVatError("");
      }
    }
  }, []);

  // ── Category suggestions ────────────────────────────────────────────────────

  const findCategorySuggestions = useCallback(
    (productName: string) => {
      if (!categories || !productName.trim() || productName.trim().length < 10) {
        setSuggestedCategories([]);
        return;
      }
      const searchTerms = productName
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 2);
      if (!searchTerms.length) return;

      const suggestions: Array<{
        id: string;
        name: string;
        fullPath: string;
        matchScore: number;
      }> = [];

      const traverse = (
        list: Category[],
        path: string[] = [],
        parents: string[] = []
      ) => {
        list.forEach((cat) => {
          const fullPath = [...path, cat.name];
          const allNames = [...parents, cat.name];
          const catText = allNames.join(" ").toLowerCase();
          const catNameLower = cat.name.toLowerCase();
          let score = 0;
          searchTerms.forEach((t) => {
            if (catText.includes(t)) score += t.length * 2;
            if (catNameLower.includes(t)) score += t.length * 3;
          });
          if (score > 0)
            suggestions.push({
              id: cat.id,
              name: cat.name,
              fullPath: fullPath.join(" > "),
              matchScore: score,
            });
          if (cat.children?.length) traverse(cat.children, fullPath, allNames);
        });
      };

      traverse(categories as Category[]);
      const sorted = suggestions
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)
        .map(({ id, name, fullPath }) => ({ id, name, fullPath }));
      setSuggestedCategories(sorted);
      setShowCategorySuggestions(sorted.length > 0);
    },
    [categories]
  );

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (suggestionTimeoutRef.current)
        clearTimeout(suggestionTimeoutRef.current);
      suggestionTimeoutRef.current = setTimeout(
        () => findCategorySuggestions(value),
        500
      );
    },
    [findCategorySuggestions]
  );

  // ── Translation ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (name.trim()) {
      if (translationTimeoutRef.current)
        clearTimeout(translationTimeoutRef.current);
      translationTimeoutRef.current = setTimeout(async () => {
        if (name.trim() && !nameBn.trim()) await translateName();
      }, 1000);
    }
    return () => {
      if (translationTimeoutRef.current)
        clearTimeout(translationTimeoutRef.current);
      if (suggestionTimeoutRef.current)
        clearTimeout(suggestionTimeoutRef.current);
    };
  }, [name, nameBn]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        categorySuggestionRef.current &&
        !categorySuggestionRef.current.contains(e.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(e.target as Node)
      )
        setShowCategorySuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const translateName = async () => {
    if (!name.trim()) return;
    setIsTranslating(true);
    try {
      const t = await translateProductName(name);
      setNameBn(t || "");
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleManualTranslate = async () => {
    if (!name.trim()) return alert("Please enter an English name first");
    await translateName();
  };

  // ── Category ────────────────────────────────────────────────────────────────

  const findCategoryById = useCallback(
    (cats: Category[], targetId: string): Category | null => {
      for (const cat of cats) {
        if (cat.id === targetId) return cat;
        if (cat.children?.length) {
          const found = findCategoryById(cat.children, targetId);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const handleCategorySuggestionSelect = (catId: string, _fullPath: string) => {
    const cat = findCategoryById((categories as Category[]) || [], catId);
    if (!cat) return;
    const isLeaf = !cat.children || !cat.children.length;
    const attrs: Attribute[] = cat.attributes || [];
    setCategoryId(catId);
    setIsLeafCategory(isLeaf);
    setCategoryAttributes(attrs);
    setRequiredAttributes(attrs.filter((a) => a.isRequired));
    const parts: Record<string, VariantNamePart> = {};
    attrs.forEach((a) => {
      if (a.id) parts[a.id] = { name: a.name || "", value: "", include: false };
    });
    setVariantNameParts(parts);
    setShowCategorySuggestions(false);
  };

  const handleCategorySelect = useCallback(
    (id: string, _path: string, isLeaf: boolean, attrs: Attribute[]) => {
      setCategoryId(id || null);
      setIsLeafCategory(isLeaf);
      setCategoryAttributes(attrs || []);
      setRequiredAttributes((attrs || []).filter((a) => a.isRequired));
      const parts: Record<string, VariantNamePart> = {};
      (attrs || []).forEach((a) => {
        if (a.id)
          parts[a.id] = { name: a.name || "", value: "", include: false };
      });
      setVariantNameParts(parts);
    },
    []
  );

  const handleVariantFieldChange = useCallback(
    (
      fieldId: string,
      fieldName: string,
      value: any,
      includeInVariant: boolean
    ) => {
      setVariantNameParts((prev) => ({
        ...prev,
        [fieldId]: { name: fieldName || "", value, include: includeInVariant },
      }));
    },
    []
  );

  const generateVariantName = useCallback((): string => {
    return (
      Object.values(variantNameParts)
        .filter((p) => p.include && p.value)
        .map((p) => `${p.name}: ${p.value}`)
        .join(" | ") || ""
    );
  }, [variantNameParts]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const validateRequiredFields = useCallback(() => {
    const errors: Record<string, boolean> = {};
    if (!name) errors.productName = true;
    if (nameValidationError) errors.productNameLength = true;
    if (!categoryId || !isLeafCategory) errors.categorySelector = true;
    if (images.length === 0) errors.productImages = true;
    requiredAttributes.forEach((attr) => {
      if (!attributes.find((a) => a.attributeId === attr.id))
        errors[`attribute-${attr.id}`] = true;
    });
    if (variantInputs.length === 0) errors.variantsSection = true;
    // Warehouse is required
    if (!warehouseRack?.warehouseId) errors.warehouseId = true;
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
    warehouseRack,
  ]);

  const scrollToFirstError = useCallback(() => {
    const firstId = Object.keys(validationErrors)[0];
    if (!firstId) return;
    const el = document.getElementById(firstId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("border-red-500", "ring-2", "ring-red-200");
      setTimeout(
        () => el.classList.remove("border-red-500", "ring-2", "ring-red-200"),
        3000
      );
    }
  }, [validationErrors]);

  const convertImages = useCallback(
    (): ProductImageInput[] =>
      images.map((url, i) => ({
        url: url || "",
        altText: `${name} image ${i + 1}`,
        sortOrder: i,
      })),
    [images, name]
  );

  const handleSubmit = async () => {
    if (nameValidationError) {
      setValidationErrors((p) => ({ ...p, productNameLength: true }));
      alert(`⚠️ ${nameValidationError}`);
      return;
    }
    if (vatError) {
      alert(`⚠️ ${vatError}`);
      return;
    }
    if (!validateRequiredFields()) {
      scrollToFirstError();
      alert("⚠️ Please fill in all required fields");
      return;
    }
    if (!variantInputs.length) {
      alert("⚠️ Please add at least one product variant");
      return;
    }
    if (variantInputs.some((v) => !v.sku || !v.price || v.price <= 0)) {
      alert("⚠️ All variants must have a SKU and valid price");
      return;
    }
    if (variantInputs.some((v) => v.specialPrice && v.specialPrice >= v.price)) {
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
      attributes,
      variants: variantInputs.map((v) => ({
        ...v,
        name: v.name || generateVariantName(),
        images: v.images?.map((img) => {
          if (typeof img === "string") return img;
          if (img && typeof img === "object" && "url" in img)
            return (img as ProductImageInput).url;
          return img;
        }),
      })),
      shippingWarranty: shippingWarranty || undefined,
      // VAT — include only if a value was entered
      ...(vatPercentage !== "" && { vatPercentage: parseFloat(vatPercentage) }),
      // Warehouse & Rack — always include warehouseId; rackId only when set
      warehouseId: warehouseRack?.warehouseId || "",
      ...(warehouseRack?.rackId && { rackId: warehouseRack.rackId }),
    };

    try {
      const result = await createProduct(productData).unwrap();
      alert("✅ Product created successfully!");
      console.log("Created product:", result);
      resetForm();
    } catch (err: any) {
      console.error("❌ Error:", err);
      alert(
        `❌ ${err?.data?.message || err?.message || "Failed to create product"}`
      );
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
    setVatPercentage("");
    setVatError("");
    setWarehouseRack(null);
    setResetKey((p) => p + 1);
  }, []);

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

  // ── Derived state for step completeness ─────────────────────────────────────

  const step1Done = name.length >= 10 && !nameValidationError;
  const step2Done = !!categoryId && isLeafCategory;
  const step3Done = images.length > 0;
  const step4Done = isLeafCategory && attributes.length > 0;
  const step5Done = variantInputs.length > 0;
  const step6Done = !!shippingWarranty;
  const step7Done = !!warehouseRack?.warehouseId;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
      }}
    >
      {/* ── Two-column layout ── */}
      <div
        ref={formRef}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 13rem",
          gap: 16,
          padding: "18px 20px",
          maxWidth: 1200,
          margin: "0 auto",
          alignItems: "start",
        }}
      >
        {/* ════ LEFT — form sections ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── 1. Basic Information ── */}
          <SectionCard
            id="productName"
            icon={
              <FileText
                size={15}
                color={validationErrors.productName ? "#DC2626" : "#1D4ED8"}
              />
            }
            title="Basic Information"
            subtitle="Product name, identification and tax"
            badge="required"
            error={
              !!(
                validationErrors.productName ||
                validationErrors.productNameLength
              )
            }
          >
            {/* Name row — two equal columns */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                alignItems: "start",
              }}
            >
              {/* English name */}
              <div>
                <FieldLabel required hint="Minimum 10 characters, max 255">
                  Product Name (English)
                  {name.length > 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        fontWeight: 500,
                        color: name.length < 10 ? "#DC2626" : "#64748B",
                      }}
                    >
                      {name.length}/255
                    </span>
                  )}
                </FieldLabel>
                <div style={{ position: "relative" }}>
                  <Search
                    size={14}
                    color="#94A3B8"
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <Input
                    ref={nameInputRef}
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Samsung Galaxy S24 Ultra 5G"
                    required
                    maxLength={255}
                    style={{
                      paddingLeft: 32,
                      paddingRight:
                        name.length >= 10 && !nameValidationError ? 32 : 12,
                      fontSize: 13,
                      borderColor:
                        validationErrors.productName ||
                        validationErrors.productNameLength
                          ? "#FCA5A5"
                          : name.length >= 10 && !nameValidationError
                          ? "#6EE7B7"
                          : undefined,
                    }}
                  />
                  {name.length >= 10 && !nameValidationError && (
                    <Check
                      size={14}
                      color="#10B981"
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                  )}
                </div>
                {validationErrors.productName && (
                  <FieldError message="Product name is required" />
                )}
                {nameValidationError && (
                  <FieldError message={nameValidationError} />
                )}
                {name.length >= 10 && !nameValidationError && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#10B981",
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Check size={11} /> Name length is good
                  </p>
                )}
              </div>

              {/* Bengali name */}
              <div>
                <FieldLabel hint="Auto-translated or enter manually">
                  Product Name (বাংলা)
                  <button
                    type="button"
                    onClick={handleManualTranslate}
                    disabled={
                      isTranslating || !name.trim() || name.length < 10
                    }
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      cursor:
                        isTranslating || !name.trim() || name.length < 10
                          ? "not-allowed"
                          : "pointer",
                      fontSize: 10.5,
                      fontWeight: 600,
                      color:
                        name.length >= 10 && !isTranslating
                          ? "#0891B2"
                          : "#CBD5E1",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      padding: 0,
                      fontFamily: "inherit",
                      transition: "color 0.15s",
                    }}
                  >
                    {isTranslating ? (
                      <>
                        <Loader2
                          size={10}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        Translating…
                      </>
                    ) : (
                      "↻ Auto-translate"
                    )}
                  </button>
                </FieldLabel>
                <div style={{ position: "relative" }}>
                  <Input
                    value={nameBn}
                    onChange={(e) => setNameBn(e.target.value || "")}
                    placeholder={
                      name.length >= 10
                        ? "স্বয়ংক্রিয়ভাবে অনুবাদ হবে…"
                        : "প্রথমে ইংরেজি নাম লিখুন"
                    }
                    maxLength={255}
                    disabled={name.length < 10}
                    style={{
                      fontSize: 13,
                      opacity: isTranslating
                        ? 0.5
                        : name.length < 10
                        ? 0.4
                        : 1,
                      transition: "opacity 0.2s",
                    }}
                  />
                  {isTranslating && (
                    <Loader2
                      size={14}
                      color="#0891B2"
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  )}
                </div>
                <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 4 }}>
                  {name.length >= 10
                    ? "Auto-translated from English. You can edit if needed."
                    : "Enter at least 10 characters in English to enable"}
                </p>
              </div>
            </div>

            {/* ── VAT field ── */}
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px dashed #E5EAF2",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                alignItems: "start",
              }}
            >
              <div>
                <FieldLabel hint="Enter the applicable VAT/tax rate for this product (0–100%)">
                  VAT / Tax Rate
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 10,
                      fontWeight: 500,
                      color: "#9BAABB",
                    }}
                  >
                    (%)
                  </span>
                </FieldLabel>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: vatError ? "#FEF2F2" : "#F1F5F9",
                      borderRight: `1px solid ${vatError ? "#FCA5A5" : "#E2E8F0"}`,
                      borderRadius: "6px 0 0 6px",
                      pointerEvents: "none",
                    }}
                  >
                    <Percent
                      size={13}
                      color={vatError ? "#DC2626" : "#64748B"}
                    />
                  </div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={vatPercentage}
                    onChange={(e) => handleVatChange(e.target.value)}
                    placeholder="e.g. 15"
                    style={{
                      paddingLeft: 44,
                      paddingRight:
                        vatPercentage !== "" && !vatError ? 32 : 12,
                      fontSize: 13,
                      borderColor: vatError
                        ? "#FCA5A5"
                        : vatPercentage !== "" && !vatError
                        ? "#6EE7B7"
                        : undefined,
                    }}
                  />
                  {vatPercentage !== "" && !vatError && (
                    <Check
                      size={14}
                      color="#10B981"
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                  )}
                </div>
                {vatError && <FieldError message={vatError} />}
                {!vatError && vatPercentage === "" && (
                  <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 4 }}>
                    Leave blank if no VAT applies to this product
                  </p>
                )}
                {!vatError && vatPercentage !== "" && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#10B981",
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Check size={11} /> VAT set to {vatPercentage}%
                  </p>
                )}
              </div>

              {/* Right column — VAT info hint card */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 9,
                  padding: "10px 12px",
                  fontSize: 11.5,
                  color: "#475569",
                  lineHeight: 1.6,
                  marginTop: 22,
                }}
              >
                <strong style={{ color: "#1E293B", fontWeight: 700 }}>
                  What is VAT?
                </strong>
                <br />
                VAT (Value Added Tax) will be displayed to buyers at checkout.
                Standard rate in Bangladesh is{" "}
                <strong style={{ color: "#0891B2" }}>15%</strong>. Enter{" "}
                <strong>0</strong> for zero-rated items.
              </div>
            </div>
          </SectionCard>

          {/* ── 2. Category ── */}
          <SectionCard
            id="categorySelector"
            icon={
              <Tag
                size={15}
                color={
                  validationErrors.categorySelector ? "#DC2626" : "#7C3AED"
                }
              />
            }
            title="Product Category"
            subtitle="Select the most specific category that fits your product"
            badge="required"
            error={!!validationErrors.categorySelector}
          >
            {categoryId && isLeafCategory && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 7,
                  marginBottom: 10,
                  fontSize: 11.5,
                  color: "#15803D",
                  fontWeight: 500,
                }}
              >
                <Check size={13} color="#22C55E" />
                Leaf category selected
              </div>
            )}
            <CategoryTreeSelector
              onSelect={handleCategorySelect}
              productName={name}
              suggestedCategories={suggestedCategories}
              onSuggestionSelect={handleCategorySuggestionSelect}
            />
            {validationErrors.categorySelector && (
              <FieldError message="Please select a leaf category (final level)" />
            )}
            {!isLeafCategory && categoryId && (
              <div
                style={{
                  marginTop: 10,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "#92400E",
                  display: "flex",
                  gap: 7,
                  alignItems: "flex-start",
                }}
              >
                <AlertCircle
                  size={14}
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <span>
                  Please select a <strong>leaf category</strong> to unlock
                  attributes and variants. Leaf categories are the deepest
                  level with no sub-categories.
                </span>
              </div>
            )}
          </SectionCard>

          {/* ── 3. Media ── */}
          <SectionCard
            id="productImages"
            icon={
              <Image
                size={15}
                color={
                  validationErrors.productImages ? "#DC2626" : "#0891B2"
                }
              />
            }
            title="Product Media"
            subtitle="Images are required · Video is optional"
            badge="required"
            error={!!validationErrors.productImages}
          >
            <ProductMediaUploader
              images={images}
              setImages={setImages}
              videoUrl={videoUrl}
              setVideoUrl={setVideoUrl}
              vendorId={vendorId}
              userRole={userRole}
            />
            {validationErrors.productImages && (
              <FieldError message="At least one product image is required" />
            )}
          </SectionCard>

          {/* ── 4. Attributes ── */}
          {isLeafCategory && (
            <SectionCard
              icon={<Layers size={15} color="#D97706" />}
              title="Specifications & Attributes"
              subtitle="Define product properties — toggle variant to generate listings"
              badge="required"
            >
              <SpecAttributeManager
                categoryId={categoryId || ""}
                attributes={attributes}
                setAttributes={setAttributes}
                categoryAttributes={categoryAttributes}
                requiredAttributes={requiredAttributes}
                onVariantFieldChange={handleVariantFieldChange}
                validationErrors={validationErrors}
              />
            </SectionCard>
          )}

          {/* ── 5. Variants ── */}
          {isLeafCategory && (
            <SectionCard
              id="variantsSection"
              icon={
                <Package
                  size={15}
                  color={
                    validationErrors.variantsSection ? "#DC2626" : "#16A34A"
                  }
                />
              }
              title="Product Variants"
              subtitle="SKU, pricing, and stock per variant combination"
              badge="required"
              error={!!validationErrors.variantsSection}
            >
              {validationErrors.variantsSection && (
                <FieldError message="At least one variant is required" />
              )}
              <VariantManager
                variants={variantInputs}
                setVariants={setVariantInputs}
                variantNameParts={variantNameParts}
                onGenerateVariantName={generateVariantName}
                categoryAttributes={categoryAttributes}
              />
            </SectionCard>
          )}

          {/* ── 6. Description ── */}
          <SectionCard
            icon={<FileText size={15} color="#64748B" />}
            title="Product Description"
            subtitle="Rich text description — supports headings, lists, and images"
            badge="optional"
          >
            <ProductDescriptionEditor
              value={description}
              onChange={setDescription}
            />
          </SectionCard>

          {/* ── 7. Shipping & Warranty ── */}
          <SectionCard
            icon={<Truck size={15} color="#0891B2" />}
            title="Shipping & Warranty"
            subtitle="Package dimensions, weight, and warranty terms"
            badge="required"
          >
            <ShippingWarrantyForm
              key={resetKey}
              value={shippingWarranty}
              onChange={setShippingWarranty}
              validationErrors={validationErrors}
            />
          </SectionCard>

          {/* ── 8. Warehouse & Rack ── */}
          <SectionCard
            id="warehouseId"
            icon={
              <Warehouse
                size={15}
                color={validationErrors.warehouseId ? "#DC2626" : "#15803D"}
              />
            }
            title="Warehouse & Storage"
            subtitle="Assign a warehouse and optional rack/shelf for this product"
            badge="required"
            error={!!validationErrors.warehouseId}
          >
            <WarehouseRackSelector
              key={resetKey}
              vendorId={vendorId}
              value={warehouseRack}
              onChange={setWarehouseRack}
              validationErrors={validationErrors}
            />
            {validationErrors.warehouseId && (
              <FieldError message="Please select a warehouse" />
            )}
          </SectionCard>

          {/* ── Bottom submit row ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              padding: "14px 18px",
              background: "#fff",
              border: "1.5px solid #E5EAF2",
              borderRadius: 14,
            }}
          >
            <button
              onClick={() => {
                if (confirm("Reset all form data?")) resetForm();
              }}
              disabled={isLoading}
              style={{
                padding: "9px 20px",
                borderRadius: 9,
                border: "1.5px solid #E5EAF2",
                background: "#fff",
                fontSize: 13,
                fontWeight: 600,
                color: "#64748B",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Reset Form
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isLoading || !!nameValidationError || name.length < 10
              }
              style={{
                padding: "9px 28px",
                borderRadius: 9,
                border: "none",
                background:
                  isLoading || !!nameValidationError || name.length < 10
                    ? "#CBD5E1"
                    : "linear-gradient(135deg,#1D4ED8,#0891B2)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  isLoading || !!nameValidationError || name.length < 10
                    ? "not-allowed"
                    : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 7,
                transition: "all 0.15s",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Saving…
                </>
              ) : (
                "Create Product"
              )}
            </button>
          </div>
        </div>

        {/* ════ RIGHT — sticky sidebar ════ */}
        <div style={{ position: "sticky", top: 64 }}>
          <RightSidebar
            wizardComponent={<ProductCreationWizard formData={formData} />}
          />
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .form-grid { grid-template-columns: 1fr !important; }
          .name-grid { grid-template-columns: 1fr !important; }
          .sidebar-col { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function AddProductForm() {
  return (
    <RightSidebarProvider>
      <AddProductFormContent />
    </RightSidebarProvider>
  );
}