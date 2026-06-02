import React, { useEffect } from "react";
import { useRightSidebar } from "@/app/vendor-dashboard/rightbar/RightSidebar";

/* ─── Step icon map ──────────────────────────────────────────────────────── */
const STEP_ICONS: Record<string, string> = {
  "basic-info":        "✦",
  "media":             "◈",
  "attributes":        "⬡",
  "variants":          "⊞",
  "description":       "≡",
  "shipping-warranty": "⬆",
  "review":            "◎",
};

/*
 * accent  — text & icon color (dark shade of the ramp)
 * glow    — border color (mid shade)
 * bg      — card background (lightest tint)
 */
const STEP_COLORS: Record<string, { accent: string; glow: string; bg: string }> = {
  "basic-info":        { accent: "#1D4ED8", glow: "#93C5FD",  bg: "#EFF6FF" },
  "media":             { accent: "#0F766E", glow: "#5EEAD4",  bg: "#F0FDFA" },
  "attributes":        { accent: "#B45309", glow: "#FCD34D",  bg: "#FFFBEB" },
  "variants":          { accent: "#15803D", glow: "#86EFAC",  bg: "#F0FDF4" },
  "description":       { accent: "#6D28D9", glow: "#C4B5FD",  bg: "#F5F3FF" },
  "shipping-warranty": { accent: "#0369A1", glow: "#7DD3FC",  bg: "#F0F9FF" },
  "review":            { accent: "#9D174D", glow: "#F9A8D4",  bg: "#FDF2F8" },
};

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface ProductCreationWizardProps {
  formData: {
    name: string;
    nameBn: string;
    categoryId: string | null;
    isLeafCategory: boolean;
    images: string[];
    videoUrl: string | null;
    description: string;
    attributes: any[];
    variants: any[];
    shippingWarranty: any;
    requiredAttributes: any[];
  };
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export const ProductCreationWizard: React.FC<ProductCreationWizardProps> = ({
  formData,
}) => {
  const { wizardSteps, updateAllSteps } = useRightSidebar();

  /* ── Step completion logic ── */
  useEffect(() => {
    const s: Partial<Record<string, boolean>> = {};

    s["basic-info"] = !!(
      formData.name.trim() &&
      formData.categoryId &&
      formData.isLeafCategory
    );

    s["media"] = formData.images.length > 0;

    if (formData.isLeafCategory && formData.categoryId) {
      s["attributes"] =
        formData.requiredAttributes.length === 0
          ? true
          : formData.requiredAttributes.every((r) =>
              formData.attributes.some((a) => a.attributeId === r.id)
            );
    } else {
      s["attributes"] = false;
    }

    s["variants"]    = formData.variants.some((v) => v.sku && v.price && v.price > 0);
    s["description"] = formData.description.trim().length > 0;
    s["shipping-warranty"] = true;
    s["review"] = !!(s["basic-info"] && s["media"] && s["attributes"] && s["variants"]);

    updateAllSteps(s);
  }, [
    formData.name,
    formData.categoryId,
    formData.isLeafCategory,
    formData.images,
    formData.attributes,
    formData.variants,
    formData.description,
    formData.shippingWarranty,
    formData.requiredAttributes,
    updateAllSteps,
  ]);

  /* ── Step detail lines ── */
  const getDetails = (stepId: string): { text: string; ok: boolean }[] => {
    switch (stepId) {
      case "basic-info":
        return [
          {
            text: formData.name
              ? `"${formData.name.slice(0, 20)}${formData.name.length > 20 ? "…" : ""}"`
              : "Product name",
            ok: !!formData.name,
          },
          {
            text:
              formData.categoryId && formData.isLeafCategory
                ? "Leaf category selected"
                : "Leaf category required",
            ok: !!(formData.categoryId && formData.isLeafCategory),
          },
        ];
      case "media":
        return [
          {
            text: `${formData.images.length}/10 images uploaded`,
            ok: formData.images.length > 0,
          },
          {
            text: formData.videoUrl ? "Video added" : "No video (optional)",
            ok: !!formData.videoUrl,
          },
        ];
      case "attributes":
        if (!formData.isLeafCategory)
          return [{ text: "Select a leaf category first", ok: false }];
        if (formData.requiredAttributes.length === 0)
          return [{ text: "No required attributes", ok: true }];
        {
          const filled = formData.attributes.filter((a) =>
            formData.requiredAttributes.some((r) => r.id === a.attributeId)
          ).length;
          return [
            {
              text: `${filled}/${formData.requiredAttributes.length} required filled`,
              ok: filled === formData.requiredAttributes.length,
            },
          ];
        }
      case "variants":
        return [
          {
            text: `${formData.variants.length} variant${formData.variants.length !== 1 ? "s" : ""} added`,
            ok: formData.variants.length > 0,
          },
        ];
      case "description":
        return [
          {
            text: formData.description
              ? `${formData.description.length} characters`
              : "Not added yet (optional)",
            ok: !!formData.description,
          },
        ];
      case "shipping-warranty":
        return [
          {
            text: formData.shippingWarranty?.warrantyType
              ? `${formData.shippingWarranty.warrantyType}`
              : "Warranty (optional)",
            ok: !!formData.shippingWarranty?.warrantyType,
          },
        ];
      case "review": {
        const allReq = wizardSteps
          .filter((s) => s.required && s.id !== "review")
          .every((s) => s.completed);
        return [
          { text: allReq ? "All required steps done" : "Complete required steps", ok: allReq },
        ];
      }
      default:
        return [];
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {wizardSteps.map((step, idx) => {
        const done    = step.completed;
        const colors  = STEP_COLORS[step.id] || STEP_COLORS["basic-info"];
        const icon    = STEP_ICONS[step.id] || "◇";
        const details = getDetails(step.id);

        return (
          <div
            key={step.id}
            style={{
              background: done ? colors.bg : "#F8FAFC",
              border: done
                ? `0.5px solid ${colors.glow}`
                : "0.5px solid #E2E8F0",
              borderRadius: 12,
              padding: "10px 12px",
              transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
              cursor: "default",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Done top accent line */}
            {done && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)`,
                  opacity: 0.8,
                }}
              />
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {/* Icon bubble */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: done ? colors.bg : "#F1F5F9",
                  border: `0.5px solid ${done ? colors.glow : "#CBD5E1"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  color: done ? colors.accent : "#94A3B8",
                  transition: "all 0.3s",
                }}
              >
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path
                      d="M2 6.5L5.5 10L11 3"
                      stroke={colors.accent}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span style={{ fontSize: 11, opacity: 0.5 }}>{icon}</span>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: done ? 700 : 500,
                      color: done ? colors.accent : "#64748B",
                      letterSpacing: "-0.1px",
                      transition: "color 0.3s",
                      lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    {/* Step number badge */}
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: done ? colors.accent : "#94A3B8",
                        background: done ? colors.bg : "#F1F5F9",
                        border: `0.5px solid ${done ? colors.glow : "#CBD5E1"}`,
                        padding: "1px 6px",
                        borderRadius: 20,
                        letterSpacing: "0.04em",
                        transition: "all 0.3s",
                      }}
                    >
                      {idx + 1}/{wizardSteps.length}
                    </span>

                    {/* Required / Optional / Done pill */}
                    <span
                      style={{
                        fontSize: 8.5,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "1px 6px",
                        borderRadius: 20,
                        color: done
                          ? "#059669"
                          : step.required
                          ? "#B45309"
                          : "#64748B",
                        background: done
                          ? "#D1FAE5"
                          : step.required
                          ? "#FEF3C7"
                          : "#F1F5F9",
                        border: done
                          ? "0.5px solid #6EE7B7"
                          : step.required
                          ? "0.5px solid #FCD34D"
                          : "0.5px solid #CBD5E1",
                        transition: "all 0.3s",
                      }}
                    >
                      {done ? "Done" : step.required ? "Req" : "Opt"}
                    </span>
                  </div>
                </div>

                {/* Detail lines */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                  {details.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 10.5,
                        color: d.ok ? colors.accent : "#94A3B8",
                        opacity: d.ok ? 1 : 0.7,
                        transition: "all 0.3s",
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: d.ok ? colors.accent : "#CBD5E1",
                          flexShrink: 0,
                          transition: "background 0.3s",
                        }}
                      />
                      {d.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};