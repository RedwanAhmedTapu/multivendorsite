"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Tag,
  Layers,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  ListPlus,
  FolderPlus,
  Sparkles,
} from "lucide-react";
import {
  useGetCategoriesQuery,
  useCreateCatalogRequestMutation,
} from "@/features/apiSlice";
import type { Category, Attribute } from "@/types/type";

type FlowType = "CATEGORY" | "ATTRIBUTE" | null;
type AttrSubType = "ATTRIBUTE" | "ATTRIBUTE_VALUE" | null;
type Step = "type" | "category" | "subtype" | "pickAttribute" | "description";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialCategoryId?: string | null;
  /** ★ NEW — fallback breadcrumb string (e.g. "Electronics > Phones > Accessories")
   *  passed directly from the selector so the banner always renders even if
   *  the category tree hasn't loaded in this component yet. */
  initialCategoryPath?: string;
  forceFlow?: FlowType;
}

const findCategoryById = (cats: Category[], id: string): Category | null => {
  for (const cat of cats) {
    if (cat.id === id) return cat;
    if (cat.children?.length) {
      const found = findCategoryById(cat.children, id);
      if (found) return found;
    }
  }
  return null;
};

const findCategoryPath = (
  cats: Category[],
  id: string,
  path: string[] = [],
): string[] | null => {
  for (const cat of cats) {
    const currentPath = [...path, cat.name];
    if (cat.id === id) return currentPath;
    if (cat.children?.length) {
      const found = findCategoryPath(cat.children, id, currentPath);
      if (found) return found;
    }
  }
  return null;
};

const flattenLeaves = (
  cats: Category[],
  path: string[] = [],
): Array<{ category: Category; path: string[] }> => {
  const out: Array<{ category: Category; path: string[] }> = [];
  cats.forEach((cat) => {
    const currentPath = [...path, cat.name];
    if (!cat.children || cat.children.length === 0) {
      out.push({ category: cat, path: currentPath });
    } else {
      out.push(...flattenLeaves(cat.children, currentPath));
    }
  });
  return out;
};

const flattenAll = (
  cats: Category[],
  path: string[] = [],
): Array<{ category: Category; path: string[] }> => {
  const out: Array<{ category: Category; path: string[] }> = [];
  cats.forEach((cat) => {
    const currentPath = [...path, cat.name];
    out.push({ category: cat, path: currentPath });
    if (cat.children?.length) {
      out.push(...flattenAll(cat.children, currentPath));
    }
  });
  return out;
};

export default function CatalogRequestModal({
  open,
  onClose,
  onSuccess,
  initialCategoryId = null,
  initialCategoryPath,
  forceFlow = null,
}: Props) {
  const { data: categories } = useGetCategoriesQuery();
  const [createCatalogRequest, { isLoading }] =
    useCreateCatalogRequestMutation();

  const [step, setStep] = useState<Step>("type");
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [attrSubType, setAttrSubType] = useState<AttrSubType>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>("");
  const [requestedName, setRequestedName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [hasPresetCategory, setHasPresetCategory] = useState(false);

  // Reset whenever the modal is (re)opened
  useEffect(() => {
    if (!open) return;
    setFlowType(forceFlow);
    setAttrSubType(null);
    setCategorySearch("");
    setSelectedAttributeId("");
    setRequestedName("");
    setDescription("");
    setError("");
    setHasPresetCategory(!!initialCategoryId);

    if (initialCategoryId) {
      setSelectedCategoryId(initialCategoryId);
      setStep(
        forceFlow === "ATTRIBUTE"
          ? "subtype"
          : forceFlow
            ? "description"
            : "type",
      );
    } else {
      setSelectedCategoryId("");
      setStep(
        forceFlow
          ? forceFlow === "ATTRIBUTE"
            ? "category"
            : "description"
          : "type",
      );
    }
  }, [open, initialCategoryId, forceFlow]);

  const selectedCategory = useMemo(
    () =>
      categories && selectedCategoryId
        ? findCategoryById(categories as Category[], selectedCategoryId)
        : null,
    [categories, selectedCategoryId],
  );

  /* ★ KEY FIX — Two-source breadcrumb resolution:
   *   1. Try a live tree lookup (most accurate, updates if data changes).
   *   2. Fall back to `initialCategoryPath` prop — the "Cat1 > Cat2" string
   *      the selector already built — so the banner renders immediately
   *      even if this component's RTK Query instance hasn't fetched yet. */
  const displayCategoryPath = useMemo((): string[] | null => {
    // 1) Live tree lookup
    if (categories && selectedCategoryId) {
      const fromTree = findCategoryPath(
        categories as Category[],
        selectedCategoryId,
      );
      if (fromTree && fromTree.length > 0) return fromTree;
    }
    // 2) Fallback: parse the string the selector handed us
    if (initialCategoryPath) {
      const parsed = initialCategoryPath
        .split(">")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return null;
  }, [categories, selectedCategoryId, initialCategoryPath]);

  const leafCategories = useMemo(
    () => (categories ? flattenLeaves(categories as Category[]) : []),
    [categories],
  );

  const allCategories = useMemo(
    () => (categories ? flattenAll(categories as Category[]) : []),
    [categories],
  );

  const pickableCategories =
    flowType === "CATEGORY" ? allCategories : leafCategories;

  const filteredLeaves = useMemo(() => {
    if (!categorySearch.trim()) return pickableCategories.slice(0, 40);
    const q = categorySearch.toLowerCase();
    return pickableCategories
      .filter(
        ({ category, path }) =>
          category.name.toLowerCase().includes(q) ||
          path.join(" > ").toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [categorySearch, pickableCategories]);

  const categoryAttributes: Attribute[] = selectedCategory?.attributes || [];

  if (!open) return null;

  // ── Navigation helpers ──────────────────────────────────────────────────

  const stepsForFlow = (): Step[] => {
    if (flowType === "CATEGORY") {
      return hasPresetCategory
        ? ["type", "description"]
        : ["type", "category", "description"];
    }
    if (attrSubType === "ATTRIBUTE")
      return ["type", "category", "subtype", "description"];
    if (attrSubType === "ATTRIBUTE_VALUE")
      return ["type", "category", "subtype", "pickAttribute", "description"];
    return ["type", "category", "subtype"];
  };

  const goBack = () => {
    const seq = stepsForFlow();
    const idx = seq.indexOf(step);
    if (idx > 0) setStep(seq[idx - 1]);
  };

  const handleTypeSelect = (type: FlowType) => {
    setFlowType(type);
    if (type === "CATEGORY") {
      setStep(hasPresetCategory ? "description" : "category");
    } else {
      setStep("category");
    }
  };

  const handleCategoryPick = (id: string) => {
    setSelectedCategoryId(id);
    setStep(flowType === "CATEGORY" ? "description" : "subtype");
  };

  const handleSkipParent = () => {
    setSelectedCategoryId("");
    setStep("description");
  };

  const handleSubtypeSelect = (sub: AttrSubType) => {
    setAttrSubType(sub);
    setStep(sub === "ATTRIBUTE_VALUE" ? "pickAttribute" : "description");
  };

  const handleAttributePick = (id: string) => {
    setSelectedAttributeId(id);
    setStep("description");
  };

  const handleSubmit = async () => {
    setError("");
    if (!requestedName.trim()) {
      setError(
        flowType === "CATEGORY"
          ? "Please enter the category name you're requesting"
          : attrSubType === "ATTRIBUTE_VALUE"
            ? "Please enter the missing value"
            : "Please enter the attribute name",
      );
      return;
    }

    const requestType =
      flowType === "CATEGORY"
        ? "CATEGORY"
        : attrSubType === "ATTRIBUTE_VALUE"
          ? "ATTRIBUTE_VALUE"
          : "ATTRIBUTE";

    try {
      await createCatalogRequest({
        requestType,
        /* ★ FIX — send categoryId for BOTH flows:
         *   - ATTRIBUTE flow → the category the attribute belongs to
         *   - CATEGORY flow  → the parent category under which to create
         *     (undefined if vendor chose "top-level") */
        categoryId: selectedCategoryId || undefined,
        attributeId:
          attrSubType === "ATTRIBUTE_VALUE" ? selectedAttributeId : undefined,
        requestedName: requestedName.trim(),
        description: description.trim() || undefined,
      }).unwrap();

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(
        err?.data?.message || "Failed to submit request. Please try again.",
      );
    }
  };

  // ── Step indicator dots ─────────────────────────────────────────────────

  const seq = stepsForFlow();
  const currentIdx = seq.indexOf(step);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,27,46,0.45)",
        backdropFilter: "blur(2px)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "5vh 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#F0F4FA",
          borderRadius: 16,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(13,27,46,0.25)",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            padding: "16px 20px",
            background: "#fff",
            borderBottom: "1px solid #E5EAF2",
            borderRadius: "16px 16px 0 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {step !== "type" && (
                <button
                  onClick={goBack}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: "1px solid #E5EAF2",
                    background: "#FAFBFD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <ChevronLeft size={14} color="#64748B" />
                </button>
              )}
              <div>
                <div
                  style={{ fontSize: 15, fontWeight: 800, color: "#0D1B2E" }}
                >
                  Request Missing Catalog Item
                </div>
                <div style={{ fontSize: 11.5, color: "#7A90AB", marginTop: 1 }}>
                  Our team will review and add it to the catalog
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid #E5EAF2",
                background: "#FAFBFD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
              aria-label="Close"
            >
              <X size={16} color="#64748B" />
            </button>
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", gap: 5, marginTop: 12 }}>
            {seq.map((s, i) => (
              <div
                key={s}
                style={{
                  height: 4,
                  flex: 1,
                  borderRadius: 4,
                  background:
                    i <= currentIdx
                      ? "linear-gradient(135deg,#1D4ED8,#0891B2)"
                      : "#E5EAF2",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>

          {/* ★ FIXED — Persistent breadcrumb using two-source resolution */}
          {displayCategoryPath && displayCategoryPath.length > 0 && (
            <CategoryPathBanner
              path={displayCategoryPath}
              label={
                flowType === "CATEGORY"
                  ? "New category will be created under"
                  : "Category"
              }
            />
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: 20 }}>
          {/* Step: type */}
          {step === "type" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12.5, color: "#7A90AB", marginBottom: 4 }}>
                What are you unable to find?
              </p>
              <ChoiceCard
                icon={<FolderPlus size={18} color="#7C3AED" />}
                iconBg="#F5F3FF"
                title="A category is missing"
                subtitle="The product doesn't fit any existing category"
                onClick={() => handleTypeSelect("CATEGORY")}
              />
              <ChoiceCard
                icon={<Layers size={18} color="#D97706" />}
                iconBg="#FFFBEB"
                title="An attribute or value is missing"
                subtitle="A category exists, but a spec field or option is missing"
                onClick={() => handleTypeSelect("ATTRIBUTE")}
              />
            </div>
          )}

          {/* Step: category */}
          {step === "category" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12.5, color: "#7A90AB", marginBottom: 2 }}>
                {flowType === "CATEGORY"
                  ? "Which category should the new one go under?"
                  : "Which category does this belong to?"}
              </p>
              <input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories…"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  fontSize: 12.5,
                  fontFamily: "inherit",
                  background: "#fff",
                }}
              />
              <div
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  border: "1px solid #E5EAF2",
                  borderRadius: 10,
                  background: "#fff",
                }}
              >
                {filteredLeaves.length === 0 ? (
                  <div
                    style={{
                      padding: 20,
                      textAlign: "center",
                      fontSize: 12,
                      color: "#94A3B8",
                    }}
                  >
                    No categories found
                  </div>
                ) : (
                  filteredLeaves.map(({ category, path }, i) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryPick(category.id)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        borderBottom:
                          i < filteredLeaves.length - 1
                            ? "1px solid #F0F4FA"
                            : "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#EFF6FF")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "none")
                      }
                    >
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "#0D1B2E",
                        }}
                      >
                        {category.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          color: "#7A90AB",
                          marginTop: 2,
                        }}
                      >
                        {path.join(" > ")}
                      </div>
                    </button>
                  ))
                )}
              </div>
              {flowType === "CATEGORY" && (
                <button
                  onClick={handleSkipParent}
                  style={{
                    alignSelf: "flex-start",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11.5,
                    color: "#64748B",
                    fontFamily: "inherit",
                    padding: "2px 0",
                  }}
                >
                  This is a top-level category (no parent)
                </button>
              )}
            </div>
          )}

          {/* Step: subtype */}
          {step === "subtype" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12.5, color: "#7A90AB", marginBottom: 2 }}>
                What exactly is missing?
              </p>
              <ChoiceCard
                icon={<Layers size={18} color="#D97706" />}
                iconBg="#FFFBEB"
                title="Attribute is missing"
                subtitle="This category has no field for what you need to specify"
                onClick={() => handleSubtypeSelect("ATTRIBUTE")}
              />
              <ChoiceCard
                icon={<ListPlus size={18} color="#0891B2" />}
                iconBg="#ECFEFF"
                title="A value/option is missing"
                subtitle="The attribute exists, but the option you need isn't listed"
                onClick={() => handleSubtypeSelect("ATTRIBUTE_VALUE")}
                disabled={categoryAttributes.length === 0}
                disabledHint={
                  categoryAttributes.length === 0
                    ? "This category has no attributes yet"
                    : undefined
                }
              />
            </div>
          )}

          {/* Step: pick attribute */}
          {step === "pickAttribute" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12.5, color: "#7A90AB", marginBottom: 2 }}>
                Which attribute is missing a value?
              </p>
              <div
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  border: "1px solid #E5EAF2",
                  borderRadius: 10,
                  background: "#fff",
                }}
              >
                {categoryAttributes.map((attr, i) => (
                  <button
                    key={attr.id}
                    onClick={() => handleAttributePick(attr.id!)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      borderBottom:
                        i < categoryAttributes.length - 1
                          ? "1px solid #F0F4FA"
                          : "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#EFF6FF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#0D1B2E",
                      }}
                    >
                      {attr.name}
                    </span>
                    <span style={{ fontSize: 10.5, color: "#94A3B8" }}>
                      {attr.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: description (final) */}
          {step === "description" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Summary chip trail */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <SummaryChip
                  color="#7C3AED"
                  bg="#F5F3FF"
                  label={
                    flowType === "CATEGORY"
                      ? "New category"
                      : attrSubType === "ATTRIBUTE_VALUE"
                        ? "New value"
                        : "New attribute"
                  }
                />
                {attrSubType === "ATTRIBUTE_VALUE" && selectedAttributeId && (
                  <SummaryChip
                    color="#0891B2"
                    bg="#ECFEFF"
                    label={
                      categoryAttributes.find(
                        (a) => a.id === selectedAttributeId,
                      )?.name || ""
                    }
                  />
                )}
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#3D5068",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {flowType === "CATEGORY"
                    ? "Category name"
                    : attrSubType === "ATTRIBUTE_VALUE"
                      ? "Value / option name"
                      : "Attribute name"}
                  <span style={{ color: "#DC2626", marginLeft: 3 }}>*</span>
                </label>
                <input
                  value={requestedName}
                  onChange={(e) => setRequestedName(e.target.value)}
                  placeholder={
                    flowType === "CATEGORY"
                      ? "e.g. Smart Home Sensors"
                      : attrSubType === "ATTRIBUTE_VALUE"
                        ? "e.g. Rose Gold"
                        : "e.g. Battery Capacity"
                  }
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: `1px solid ${error && !requestedName.trim() ? "#FCA5A5" : "#E2E8F0"}`,
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#3D5068",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Description{" "}
                  <span style={{ fontWeight: 500, color: "#9BAABB" }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any context that helps our team review this faster…"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11.5,
                    color: "#DC2626",
                  }}
                >
                  <AlertCircle size={12} /> {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                style={{
                  marginTop: 4,
                  padding: "10px 20px",
                  borderRadius: 9,
                  border: "none",
                  background: isLoading
                    ? "#CBD5E1"
                    : "linear-gradient(135deg,#1D4ED8,#0891B2)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Submit request
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Shared bits ──────────────────────────────────────────────────────────

function CategoryPathBanner({
  path,
  label,
}: {
  path: string[];
  label: string;
}) {
  return (
    <div
      style={{
        marginTop: 10,
        padding: "8px 12px",
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#7A90AB",
          textTransform: "uppercase",
          letterSpacing: 0.3,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
        }}
      >
        {path.map((seg, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={11} color="#93C5FD" />}
            <span
              style={{
                fontSize: 12,
                fontWeight: i === path.length - 1 ? 800 : 600,
                color: i === path.length - 1 ? "#1D4ED8" : "#3D5068",
              }}
            >
              {seg}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ChoiceCard({
  icon,
  iconBg,
  title,
  subtitle,
  onClick,
  disabled,
  disabledHint,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabledHint}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 12,
        border: "1.5px solid #E5EAF2",
        background: disabled ? "#F8FAFC" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        opacity: disabled ? 0.55 : 1,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = "#93C5FD";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = "#E5EAF2";
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2E" }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 1 }}>
          {subtitle}
        </div>
      </div>
      <Check size={0} />
    </button>
  );
}

function SummaryChip({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color,
        background: bg,
        border: `1px solid ${color}33`,
        borderRadius: 20,
        padding: "3px 10px",
      }}
    >
      {label}
    </span>
  );
}