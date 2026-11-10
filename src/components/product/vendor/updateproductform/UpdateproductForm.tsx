"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useGetVendorProductByIdQuery,
  useUpdateProductMutation,
} from "@/features/productapi/vendorProductApi";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
  FileText,
  Layers,
  Package,
  Truck,
  Sparkles,
  ArrowRight,
  Search,
  Tag,
  Percent,
} from "lucide-react";
import CategoryTreeSelector from "../productform/CategoryTreeSelector";
import SpecAttributeManager from "../productform/SpecAttributeManager";
import VariantManager from "../productform/VariantManager";
import ProductDescriptionEditor from "@/components/productdescription/ProductDescriptionl";
import ShippingWarrantyForm from "../productform/ShippingWarrantyForm";
import CatalogRequestModal from "../productform/CatalogRequestModal";
import ProductMediaUploader from "@/components/mediauploader/ProductMediaUploader";
import { translateProductName } from "@/utils/translate";
import type { Attribute, VariantNamePart } from "@/types/type";
import {
  ProductAttributeInput,
  ProductImageInput,
  ProductShippingWarrantyInput,
  ProductVariantInput,
  UpdateProductData,
  Product,
  ProductVariant,
  ProductImage,
  Warranty,
  Review,
  OfferProduct,
} from "@/types/product";

/* ─────────────────────────────────────────────────────────────────────────
 * Unified design with ProductForm.tsx (Add Product). 
 * Same palette, same SectionCard shell, same layout, same ProductMediaUploader.
 * Sidebar/Wizard removed for Full-Width experience.
 * ────────────────────────────────────────────────────────────────────── */

const PALETTE = {
  text: "#0D1B2E",
  textMuted: "#3D5068",
  textFaint: "#7A90AB",
  textFainter: "#9BAABB",
  border: "#E5EAF2",
  borderSoft: "#F0F4FA",
  panelBg: "#FAFBFD",
  pageBg: "#F0F4FA",
  iconBg: "#EEF3FB",
  primary: "#1D4ED8",
  purple: "#7C3AED",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
  success: "#16A34A",
  successBg: "#F0F9F0",
  successBorder: "#BBF7D0",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberBorder: "#FDE68A",
};

interface ExtendedProduct extends Omit<Product, "reviews" | "offerProducts"> {
  reviews?: Review[];
  offerProducts?: OfferProduct[];
  warranty?: Warranty | null;
  brandId?: string | null;
  taxRate?: number | null;
}

interface CategorySuggestion {
  id: string;
  name: string;
  fullPath: string;
}

interface Category {
  id: string;
  name: string;
  attributes?: Attribute[];
  children?: Category[];
}

const convertVariantToInput = (variant: ProductVariant): ProductVariantInput => ({
  id: variant.id,
  name: variant.name || null,
  sku: variant.sku,
  barcode: variant.barcode || null,
  availability: variant.availability,
  weight: variant.weight || null,
  images:
    variant.images?.map((img: ProductImage) => ({
      url: img.url,
      altText: img.altText || undefined,
      sortOrder: img.sortOrder || undefined,
    })) || [],
  attributes: variant.attributes?.map((attr) => ({ attributeValueId: attr.attributeValueId })),
});

const convertAttributeToInput = (attr: any): ProductAttributeInput => ({
  attributeId: attr.attributeId,
  isForVariant: attr.isForVariant || false,
  valueString: attr.valueString || null,
  valueNumber: attr.valueNumber || null,
  valueBoolean: attr.valueBoolean || null,
  attributeValueId: attr.attributeValueId || null,
});

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

const ERROR_GLOW_CLASS = "fm-error-glow";
const ERROR_SCROLL_ORDER = [
  "productName",
  "categorySelector",
  "brandSelector",
  "productImages",
  "attributesSection",
  "variantsSection",
  "productDescriptionSection",
  "packageWeight",
  "packageDimensions",
  "warrantyType",
  "warrantyDetails",
];

if (typeof document !== "undefined" && !document.getElementById("fm-error-glow-style")) {
  const s = document.createElement("style");
  s.id = "fm-error-glow-style";
  s.textContent = `
    @keyframes fm-error-pulse {
      0%, 100% { box-shadow: 0 0 0 2px rgba(168,85,247,0.35), 0 0 10px 0 rgba(239,68,68,0.12); border-color: #A855F7 !important; }
      50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.28), 0 0 20px 2px rgba(168,85,247,0.18); border-color: #EF4444 !important; }
    }
    .${ERROR_GLOW_CLASS} { animation: fm-error-pulse 0.9s ease-in-out 4 !important; }
  `;
  document.head.appendChild(s);
}

/* ─── Section Card Shell (Identical to ProductForm) ──────────────────── */
function SectionCard({ icon, title, subtitle, badge, children, error, id }: any) {
  return (
    <div
      id={id}
      style={{
        background: "#fff",
        border: `1.5px solid ${error ? "#FCA5A5" : PALETTE.border}`,
        borderRadius: 14,
        boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: `1px solid ${PALETTE.borderSoft}`,
          background: PALETTE.panelBg,
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: error ? PALETTE.dangerBg : PALETTE.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: PALETTE.text, letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: PALETTE.textFaint, marginTop: 1 }}>{subtitle}</div>}
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
              background: badge === "required" ? PALETTE.dangerBg : PALETTE.successBg,
              color: badge === "required" ? PALETTE.danger : PALETTE.success,
              border: `1px solid ${badge === "required" ? PALETTE.dangerBorder : PALETTE.successBorder}`,
            }}
          >
            {badge === "required" ? "Required" : "Optional"}
          </span>
        )}
      </div>
      <div style={{ padding: "18px 18px" }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: PALETTE.textMuted, letterSpacing: "0.01em", display: "flex", alignItems: "center", gap: 4 }}>
        {children}
        {required && <span style={{ color: PALETTE.danger, fontWeight: 800 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 10.5, color: PALETTE.textFainter, marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11.5, color: PALETTE.danger }}>
      <AlertCircle size={12} />
      {message}
    </div>
  );
}

function PrimaryButton({ isLoading, disabled, onClick, label, loadingLabel }: { isLoading: boolean; disabled?: boolean; onClick: () => void; label: string; loadingLabel: string }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || isLoading;

  return (
    <button type="button" onClick={onClick} disabled={isDisabled} onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPressed(false); }} onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} style={{ padding: "11px 32px", borderRadius: 11, border: "none", background: isDisabled ? "#CBD5E1" : hovered ? "linear-gradient(135deg,#2563EB,#8B5CF6)" : "linear-gradient(135deg,#1D4ED8,#7C3AED)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: isDisabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: isDisabled ? "none" : hovered ? "0 10px 24px rgba(124,58,237,0.35), 0 2px 6px rgba(29,78,216,0.25)" : "0 4px 14px rgba(124,58,237,0.25)", transform: pressed ? "scale(0.97)" : hovered ? "translateY(-1px)" : "translateY(0)", transition: "all 0.18s ease" }}>
      {isLoading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> {loadingLabel}</> : <><Sparkles size={14} style={{ opacity: 0.9 }} /> {label} <ArrowRight size={14} style={{ transition: "transform 0.18s ease", transform: hovered ? "translateX(3px)" : "translateX(0)" }} /></>}
    </button>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function UpdateProductForm() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId || "";
  const userRole = (user?.role as "VENDOR" | "ADMIN") || "VENDOR";

  const { data: product, isLoading: isLoadingProduct, error: productError, refetch } = useGetVendorProductByIdQuery(productId);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

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
  const [variantNameParts, setVariantNameParts] = useState<Record<string, VariantNamePart>>({});
  const [shippingWarranty, setShippingWarranty] = useState<ProductShippingWarrantyInput | null>(null);
  const [productStatus, setProductStatus] = useState<"PENDING" | "ACTIVE" | "REJECTED" | "DRAFT" | "INACTIVE">("PENDING");

  const [brandId, setBrandId] = useState<string | null>(null);
  const [vatPercentage, setVatPercentage] = useState<string>("");
  const [vatError, setVatError] = useState<string>("");

  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<CategorySuggestion[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  
  const [catalogModal, setCatalogModal] = useState<{ open: boolean; flow: "CATEGORY" | "ATTRIBUTE" | null; categoryId?: string; categoryPath?: string }>({ open: false, flow: null });

  const formRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (product && vendorId && (product as Product).vendorId !== vendorId && userRole === "VENDOR") {
      toast.error("You don't have permission to edit this product");
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
      setIsLeafCategory(true);
      setImages(productData.images?.map((img: ProductImage) => img.url) || []);
      setVideoUrl(productData.videoUrl || null);
      setBrandId(productData.brandId || null);
      
      // FIX: taxRate is inside the variant in API response
      const variantTaxRate = (productData.variants?.[0] as any)?.taxRate;
      setVatPercentage(variantTaxRate ? String(variantTaxRate) : "");

      const convertedAttributes = (productData.attributes || []).map(convertAttributeToInput);
      setAttributes(convertedAttributes);

      const convertedVariants = (productData.variants || []).map(convertVariantToInput);
      setVariantInputs(convertedVariants);

      const convertedWarranty = convertWarrantyToInput(productData.warranty);
      setShippingWarranty(convertedWarranty);

      setProductStatus(productData.approvalStatus || "PENDING");

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
        name, nameBn, description, categoryId, brandId, images, videoUrl, vatPercentage,
        attributes: JSON.stringify(attributes),
        variants: JSON.stringify(variantInputs),
        shippingWarranty: JSON.stringify(shippingWarranty),
      };
      const originalData = {
        name: productData.name || "",
        nameBn: productData.nameBn || "",
        description: productData.description || "",
        categoryId: productData.categoryId || null,
        brandId: productData.brandId || null,
        images: JSON.stringify(productData.images?.map((img: ProductImage) => img.url) || []),
        videoUrl: productData.videoUrl || null,
        vatPercentage: (productData.variants?.[0] as any)?.taxRate ? String((productData.variants[0] as any).taxRate) : "",
        attributes: JSON.stringify((productData.attributes || []).map(convertAttributeToInput)),
        variants: JSON.stringify((productData.variants || []).map(convertVariantToInput)),
        shippingWarranty: JSON.stringify(convertWarrantyToInput(productData.warranty)),
      };
      setHasChanges(
        Object.keys(currentData).some(
          (key) => JSON.stringify(currentData[key as keyof typeof currentData]) !== JSON.stringify(originalData[key as keyof typeof originalData])
        )
      );
    }
  }, [name, nameBn, description, categoryId, brandId, images, videoUrl, vatPercentage, attributes, variantInputs, shippingWarranty, product, initialLoadComplete]);

  const validateNameLength = useCallback((value: string) => {
    if (value.length > 0 && value.length < 10) return "Product name must be at least 10 characters";
    if (value.length > 255) return "Product name cannot exceed 255 characters";
    return "";
  }, []);

  const nameValidationError = useMemo(() => validateNameLength(name), [name, validateNameLength]);

  const handleVatChange = useCallback((value: string) => {
    if (value === "" || /^\d{0,3}(\.\d{0,2})?$/.test(value)) {
      setVatPercentage(value);
      const num = parseFloat(value);
      if (value !== "" && (isNaN(num) || num < 0 || num > 100)) setVatError("VAT must be between 0% and 100%");
      else setVatError("");
    }
  }, []);

  useEffect(() => {
    if (name.trim() && !nameBn.trim() && hasChanges) {
      if (translationTimeoutRef.current) clearTimeout(translationTimeoutRef.current);
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
    return () => { if (translationTimeoutRef.current) clearTimeout(translationTimeoutRef.current); };
  }, [name, nameBn, hasChanges]);

  const handleManualTranslate = async () => {
    if (!name.trim()) { toast.error("Please enter an English name first"); return; }
    setIsTranslating(true);
    try {
      const translatedName = await translateProductName(name);
      setNameBn(translatedName || "");
    } catch (error) { console.error("Translation error:", error); } 
    finally { setIsTranslating(false); }
  };

  const handleCategorySelect = useCallback((id: string, path: string, isLeaf: boolean, categoryAttrs: any[]) => {
    setCategoryId(id || null);
    setIsLeafCategory(isLeaf);
    const convertedAttributes: Attribute[] = (categoryAttrs || []).map((catAttr: any) => ({
      id: catAttr.attribute?.id || catAttr.id,
      name: catAttr.attribute?.name || catAttr.name,
      slug: catAttr.attribute?.slug || catAttr.slug,
      type: catAttr.attribute?.type || catAttr.type,
      isRequired: catAttr.isRequired || false,
      isForVariant: catAttr.isForVariant || false,
      isSearchable: catAttr.attribute?.isSearchable || false,
      isFilterable: catAttr.attribute?.isFilterable || false,
      values: catAttr.attribute?.values || catAttr.values || [],
      categoryId: catAttr.categoryId || catAttr.attribute?.categoryId,
      createdAt: catAttr.attribute?.createdAt || catAttr.createdAt || new Date().toISOString(),
      updatedAt: catAttr.attribute?.updatedAt || catAttr.updatedAt || new Date().toISOString(),
    }));
    setCategoryAttributes(convertedAttributes);
    setRequiredAttributes(convertedAttributes.filter((attr: Attribute) => attr.isRequired));
    
    const initialParts: Record<string, VariantNamePart> = {};
    convertedAttributes.forEach((attr: Attribute) => {
      if (attr.id) initialParts[attr.id] = { name: attr.name || "", value: "", include: attr.isForVariant || false };
    });
    setVariantNameParts(initialParts);
  }, []);

  const handleVariantFieldChange = useCallback((fieldId: string, fieldName: string, value: any, includeInVariant: boolean) => {
    setVariantNameParts((prev) => ({ ...prev, [fieldId]: { name: fieldName || "", value, include: includeInVariant } }));
  }, []);

  const generateVariantName = useCallback((): string => {
    const parts = Object.values(variantNameParts).filter((part) => part.include && part.value).map((part) => `${part.name}: ${part.value}`);
    return parts.join(" | ") || "";
  }, [variantNameParts]);

  const validateRequiredFields = useCallback(() => {
    const errors: Record<string, boolean> = {};
    if (!name) errors.productName = true;
    if (nameValidationError) errors.productNameLength = true;
    if (!categoryId || !isLeafCategory) errors.categorySelector = true;
    if (!brandId) errors.brandSelector = true;
    if (images.length === 0) errors.productImages = true;

    requiredAttributes.forEach((attr: Attribute) => {
      if (!attributes.find((a) => a.attributeId === attr.id)) errors[`attribute-${attr.id}`] = true;
    });
    if (requiredAttributes.some((a) => errors[`attribute-${a.id}`])) errors.attributesSection = true;

    if (variantInputs.length === 0) errors.variantsSection = true;
    if (!description || !description.trim()) errors.productDescriptionSection = true;

    const sw = shippingWarranty;
    const hasWeight = !!sw && sw.packageWeightValue > 0;
    const hasDimensions = !!sw && sw.packageLength > 0 && sw.packageWidth > 0 && sw.packageHeight > 0;
    const hasWarrantyType = !!sw && !!sw.warrantyType && String(sw.warrantyType).trim().length > 0;
    const hasWarrantyDetails = !!sw && !!sw.warrantyDetails && String(sw.warrantyDetails).trim().length > 0;

    if (!hasWeight) errors.packageWeight = true;
    if (!hasDimensions) errors.packageDimensions = true;
    if (!hasWarrantyType) errors.warrantyType = true;
    if (!hasWarrantyDetails) errors.warrantyDetails = true;
    if (!hasWeight || !hasDimensions || !hasWarrantyType || !hasWarrantyDetails) errors.shippingWarrantySection = true;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, nameValidationError, categoryId, isLeafCategory, brandId, images, requiredAttributes, attributes, variantInputs, description, shippingWarranty]);

  const scrollToFirstError = useCallback(() => {
    let targetId: string | null = null;
    for (const key of ERROR_SCROLL_ORDER) {
      if (validationErrors[key]) { targetId = key; break; }
    }
    if (!targetId) targetId = Object.keys(validationErrors)[0] || null;
    if (!targetId) return;

    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      el.classList.add(ERROR_GLOW_CLASS);
      setTimeout(() => el.classList.remove(ERROR_GLOW_CLASS), 3800);
    }, 350);
  }, [validationErrors]);

  const convertImages = useCallback((): ProductImageInput[] => 
    images.map((url, index) => ({ url: url || "", altText: `${name} image ${index + 1}`, sortOrder: index })), [images, name]);

  const handleSubmit = async () => {
    if (isUpdating) { toast.info("Already saving — please wait…"); return; }
    if (nameValidationError) { setValidationErrors((p) => ({ ...p, productNameLength: true })); toast.error(nameValidationError); return; }
    if (vatError) { toast.error(vatError); return; }
    if (!validateRequiredFields()) { scrollToFirstError(); toast.warning("Please fill in all required fields"); return; }
    if (variantInputs.length === 0) { toast.error("Please add at least one product variant"); return; }
    if (variantInputs.some((v) => !v.sku)) { toast.error("All variants must have a SKU"); return; }

    const updateData: UpdateProductData = {
      name: name || "",
      nameBn: nameBn || undefined,
      description: description || undefined,
      categoryId: categoryId || "",
      brandId: brandId || undefined,
      videoUrl: videoUrl || undefined,
      images: convertImages(),
      attributes,
      variants: variantInputs.map((v) => ({
        id: v.id,
        name: v.name || generateVariantName(),
        sku: v.sku,
        barcode: v.barcode || undefined,
        availability: v.availability !== undefined ? v.availability : true,
        weight: v.weight || null,
        attributes: v.attributes?.map((attr) => ({ attributeValueId: attr.attributeValueId })),
        images: v.images?.map((img) => (typeof img === "string" ? img : (img as ProductImageInput).url)),
      })),
      shippingWarranty: shippingWarranty || undefined,
      ...(vatPercentage !== "" && { taxRate: parseFloat(vatPercentage) }),
    } as UpdateProductData;

    try {
      await updateProduct({ id: productId, data: updateData }).unwrap();
      toast.success("Product updated successfully!");
      refetch();
      setHasChanges(false);
    } catch (err: any) {
      console.error("Error updating product:", err);
      toast.error(err?.data?.message || err?.message || "Failed to update product");
    }
  };

  const handleReset = () => {
    if (!confirm("Reset all changes? This will revert to the original product data.")) return;
    if (!product) return;
    const productData = product as ExtendedProduct;

    setName(productData.name || "");
    setNameBn(productData.nameBn || "");
    setDescription(productData.description || "");
    setCategoryId(productData.categoryId || null);
    setImages(productData.images?.map((img: ProductImage) => img.url) || []);
    setVideoUrl(productData.videoUrl || null);
    setBrandId(productData.brandId || null);
    const variantTaxRate = (productData.variants?.[0] as any)?.taxRate;
    setVatPercentage(variantTaxRate ? String(variantTaxRate) : "");
    setAttributes((productData.attributes || []).map(convertAttributeToInput));
    setVariantInputs((productData.variants || []).map(convertVariantToInput));
    setShippingWarranty(convertWarrantyToInput(productData.warranty));
    setHasChanges(false);
    setResetKey((p) => p + 1);
    toast.success("Changes reset");
  };

  const handleGoBack = () => {
    if (hasChanges && !confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    router.push("/vendor-dashboard/products");
  };

  // FIX: Prevent form from rendering until data is fully loaded and initialized
  // This ensures that uncontrolled components (like ShippingWarrantyForm) get the correct initial values.
  if (isLoadingProduct || (product && !initialLoadComplete)) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh", background: PALETTE.pageBg }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={40} color={PALETTE.primary} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: PALETTE.textFaint, fontSize: 13.5 }}>Loading product data…</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div style={{ minHeight: "70vh", background: PALETTE.pageBg, padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 420, textAlign: "center", background: "#fff", border: `1.5px solid ${PALETTE.dangerBorder}`, borderRadius: 14, padding: 28 }}>
          <div style={{ width: 48, height: 48, margin: "0 auto 12px", borderRadius: 14, background: PALETTE.dangerBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={22} color={PALETTE.danger} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: PALETTE.danger, margin: 0 }}>{productError ? "Failed to load product" : "Product not found"}</p>
          <p style={{ fontSize: 12, color: PALETTE.textFaint, marginTop: 4 }}>Please try again, or go back to your product list.</p>
          <button onClick={() => router.push("/vendor-dashboard/products")} style={{ marginTop: 16, padding: "9px 20px", borderRadius: 9, border: `1.5px solid ${PALETTE.border}`, background: "#fff", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const productData = product as ExtendedProduct;
  const statusColors = productStatus === "ACTIVE" ? { bg: PALETTE.successBg, color: PALETTE.success, border: PALETTE.successBorder } : productStatus === "REJECTED" ? { bg: PALETTE.dangerBg, color: PALETTE.danger, border: PALETTE.dangerBorder } : { bg: PALETTE.amberBg, color: PALETTE.amber, border: PALETTE.amberBorder };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: PALETTE.pageBg, minHeight: "100vh", padding: "20px 16px 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button onClick={handleGoBack} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${PALETTE.border}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} aria-label="Back">
              <ArrowLeft size={16} color={PALETTE.textMuted} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 17, fontWeight: 800, color: PALETTE.text, letterSpacing: "-0.3px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Edit Product</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "2px 9px", borderRadius: 20, background: statusColors.bg, color: statusColors.color, border: `1px solid ${statusColors.border}` }}>{productStatus}</span>
                <span style={{ fontSize: 11, color: PALETTE.textFainter }}>{productData.name}</span>
              </div>
            </div>
          </div>
          {hasChanges && (
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: PALETTE.amberBg, color: PALETTE.amber, border: `1px solid ${PALETTE.amberBorder}`, whiteSpace: "nowrap" }}>Unsaved changes</span>
          )}
        </div>

        {/* ── Full-width Form Layout ── */}
        <div ref={formRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          
          {/* 1. Basic Information */}
          <SectionCard id="productName" icon={<FileText size={15} color={validationErrors.productName ? PALETTE.danger : PALETTE.primary} />} title="Basic Information" subtitle="Product name, identification and tax" badge="required" error={!!(validationErrors.productName || validationErrors.productNameLength)}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
              <div>
                <FieldLabel required hint="Minimum 10 characters, max 255">Product Name (English) {name.length > 0 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 500, color: name.length < 10 ? PALETTE.danger : "#64748B" }}>{name.length}/255</span>}</FieldLabel>
                <div style={{ position: "relative" }}>
                  <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <Input ref={nameInputRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Samsung Galaxy S24 Ultra 5G" maxLength={255} style={{ paddingLeft: 32, paddingRight: name.length >= 10 && !nameValidationError ? 32 : 12, fontSize: 13, borderColor: validationErrors.productName || validationErrors.productNameLength ? "#FCA5A5" : name.length >= 10 && !nameValidationError ? "#6EE7B7" : undefined }} />
                  {name.length >= 10 && !nameValidationError && <Check size={14} color="#10B981" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />}
                </div>
                {validationErrors.productName && <FieldError message="Product name is required" />}
                {nameValidationError && <FieldError message={nameValidationError} />}
              </div>
              <div>
                <FieldLabel hint="Auto-translated or enter manually">Product Name (বাংলা)
                  <button type="button" onClick={handleManualTranslate} disabled={isTranslating || !name.trim() || name.length < 10} style={{ marginLeft: "auto", background: "none", border: "none", cursor: isTranslating || !name.trim() || name.length < 10 ? "not-allowed" : "pointer", fontSize: 10.5, fontWeight: 600, color: name.length >= 10 && !isTranslating ? "#0891B2" : "#CBD5E1", display: "flex", alignItems: "center", gap: 3, padding: 0 }}>
                    {isTranslating ? <><Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> Translating…</> : "↻ Auto-translate"}
                  </button>
                </FieldLabel>
                <Input value={nameBn} onChange={(e) => setNameBn(e.target.value)} placeholder={name.length >= 10 ? "স্বয়ংক্রিয়ভাবে অনুবাদ হবে…" : "প্রথমে ইংরেজি নাম লিখুন"} maxLength={255} disabled={name.length < 10} style={{ fontSize: 13, opacity: isTranslating ? 0.5 : name.length < 10 ? 0.4 : 1 }} />
              </div>
            </div>

            {/* VAT Section */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed #E5EAF2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
              <div>
                <FieldLabel hint="Enter the applicable VAT/tax rate (0–100%)">VAT / Tax Rate <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 500, color: "#9BAABB" }}>(%)</span></FieldLabel>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 36, display: "flex", alignItems: "center", justifyContent: "center", background: vatError ? "#FEF2F2" : "#F1F5F9", borderRight: `1px solid ${vatError ? "#FCA5A5" : "#E2E8F0"}`, borderRadius: "6px 0 0 6px", pointerEvents: "none" }}>
                    <Percent size={13} color={vatError ? "#DC2626" : "#64748B"} />
                  </div>
                  <Input type="text" inputMode="decimal" value={vatPercentage} onChange={(e) => handleVatChange(e.target.value)} placeholder="e.g. 15" style={{ paddingLeft: 44, paddingRight: vatPercentage !== "" && !vatError ? 32 : 12, fontSize: 13, borderColor: vatError ? "#FCA5A5" : vatPercentage !== "" && !vatError ? "#6EE7B7" : undefined }} />
                  {vatPercentage !== "" && !vatError && <Check size={14} color="#10B981" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />}
                </div>
                {vatError && <FieldError message={vatError} />}
              </div>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 9, padding: "10px 12px", fontSize: 11.5, color: "#475569", lineHeight: 1.6, marginTop: 22 }}>
                <strong style={{ color: "#1E293B", fontWeight: 700 }}>What is VAT?</strong><br />
                VAT (Value Added Tax) is displayed to buyers at checkout. Standard rate in Bangladesh is <strong style={{ color: "#0891B2" }}>15%</strong>. Enter <strong>0</strong> for zero-rated items.
              </div>
            </div>
          </SectionCard>

          {/* 2. Category */}
          <SectionCard id="categorySelector" icon={<Tag size={15} color={validationErrors.categorySelector ? PALETTE.danger : PALETTE.purple} />} title="Product Category" subtitle="Select the most specific category" badge="required" error={!!validationErrors.categorySelector}>
            {categoryId && isLeafCategory && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 7, marginBottom: 10, fontSize: 11.5, color: "#15803D", fontWeight: 500 }}>
                <Check size={13} color="#22C55E" /> Leaf category selected
              </div>
            )}
            <CategoryTreeSelector
              onSelect={handleCategorySelect}
              productName={name}
              suggestedCategories={suggestedCategories}
              onSuggestionSelect={() => {}}
              initialCategoryId={categoryId}
              onRequestMissing={(catId, catPath) => setCatalogModal({ open: true, flow: "CATEGORY", categoryId: catId, categoryPath: catPath })}
            />
            {validationErrors.categorySelector && <FieldError message="Please select a leaf category" />}
          </SectionCard>

          {/* 3. Product Media (Using ProductMediaUploader) */}
          <SectionCard id="productImages" icon={<FileText size={15} color={validationErrors.productImages ? PALETTE.danger : "#0891B2"} />} title="Product Media" subtitle="Images are required · Video is optional" badge="required" error={!!validationErrors.productImages}>
            <ProductMediaUploader
              images={images}
              setImages={setImages}
              videoUrl={videoUrl}
              setVideoUrl={setVideoUrl}
              vendorId={vendorId}
              userRole={userRole}
            />
            {validationErrors.productImages && <FieldError message="At least one product image is required" />}
          </SectionCard>

          {/* 4. Attributes & Brand */}
          {isLeafCategory && (
            <SectionCard id="attributesSection" icon={<Layers size={15} color={PALETTE.amber} />} title="Specifications, Brand & Attributes" subtitle="Select brand and define product properties" badge="required" error={!!validationErrors.attributesSection}>
              <SpecAttributeManager
                categoryId={categoryId || ""}
                attributes={attributes}
                setAttributes={setAttributes}
                categoryAttributes={categoryAttributes}
                requiredAttributes={requiredAttributes}
                onVariantFieldChange={handleVariantFieldChange}
                validationErrors={validationErrors}
                brandId={brandId}
                onBrandChange={setBrandId}
                onRequestMissing={() => setCatalogModal({ open: true, flow: "ATTRIBUTE", categoryId: categoryId || undefined })}
              />
            </SectionCard>
          )}

          {/* 5. Variants */}
          {isLeafCategory && (
            <SectionCard id="variantsSection" icon={<Package size={15} color={validationErrors.variantsSection ? PALETTE.danger : PALETTE.success} />} title="Product Variants" subtitle="SKU, images and attributes per variant" badge="required" error={!!validationErrors.variantsSection}>
              {validationErrors.variantsSection && <FieldError message="At least one variant is required" />}
              <VariantManager variants={variantInputs} setVariants={setVariantInputs} variantNameParts={variantNameParts} onGenerateVariantName={generateVariantName} categoryAttributes={categoryAttributes} />
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: PALETTE.textFaint, background: PALETTE.panelBg, border: `1px solid ${PALETTE.borderSoft}`, borderRadius: 8, padding: "7px 10px" }}>
                <AlertCircle size={12} style={{ flexShrink: 0 }} />
                Price and stock aren't edited here — manage them from the pricing &amp; stock screen in your product list.
              </div>
            </SectionCard>
          )}

          {/* 6. Description */}
          <SectionCard id="productDescriptionSection" icon={<FileText size={15} color={validationErrors.productDescriptionSection ? PALETTE.danger : "#64748B"} />} title="Product Description" subtitle="Rich text — headings, lists, images" badge="required" error={!!validationErrors.productDescriptionSection}>
            <ProductDescriptionEditor value={description} onChange={setDescription} />
            {validationErrors.productDescriptionSection && <FieldError message="Product description is required" />}
          </SectionCard>

          {/* 7. Shipping & Warranty */}
          <SectionCard id="shippingWarrantySection" icon={<Truck size={15} color={validationErrors.shippingWarrantySection ? PALETTE.danger : "#0891B2"} />} title="Shipping & Warranty" subtitle="Package dimensions, weight, warranty terms" badge="required" error={!!validationErrors.shippingWarrantySection}>
            <ShippingWarrantyForm 
              key={resetKey} 
              value={shippingWarranty} 
              onChange={setShippingWarranty} 
              validationErrors={validationErrors} 
            />
          </SectionCard>

          {/* ── Bottom action row ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, padding: "14px 18px", background: "#fff", border: `1.5px solid ${PALETTE.border}`, borderRadius: 14, flexWrap: "wrap" }}>
            <button onClick={handleGoBack} disabled={isUpdating} style={{ padding: "9px 20px", borderRadius: 9, border: `1.5px solid ${PALETTE.border}`, background: "#fff", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: isUpdating ? "not-allowed" : "pointer", opacity: isUpdating ? 0.6 : 1 }}>Cancel</button>
            <button onClick={handleReset} disabled={isUpdating || !hasChanges} style={{ padding: "9px 20px", borderRadius: 9, border: `1.5px solid ${PALETTE.border}`, background: "#fff", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: isUpdating || !hasChanges ? "not-allowed" : "pointer", opacity: isUpdating || !hasChanges ? 0.6 : 1 }}>Reset Changes</button>
            <PrimaryButton isLoading={isUpdating} disabled={!!nameValidationError || name.length < 10 || !hasChanges} onClick={handleSubmit} label="Save Changes" loadingLabel="Saving…" />
          </div>
        </div>
      </div>

      <CatalogRequestModal open={catalogModal.open} onClose={() => setCatalogModal({ open: false, flow: null })} forceFlow={catalogModal.flow} initialCategoryId={catalogModal.categoryId ?? null} initialCategoryPath={catalogModal.categoryPath} onSuccess={() => { toast.success("Request submitted — our team will review it shortly"); setCatalogModal({ open: false, flow: null }); }} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) { .upf-name-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}