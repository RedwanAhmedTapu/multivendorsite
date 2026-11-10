"use client";
import React, { useEffect, useMemo } from "react";
import { useRightSidebar } from "@/app/vendor-dashboard/rightbar/RightSidebar";

/* ─── Color system ──────────────────────────────────────────────────────── */

interface StepTheme {
  accent: string;
  glow: string;
  bg: string;
  bgStrong: string;
  gradient: string;
}

const STEP_THEME: Record<string, StepTheme> = {
  "basic-info": {
    accent: "#1D4ED8",
    glow: "#93C5FD",
    bg: "#EFF6FF",
    bgStrong: "#DBEAFE",
    gradient: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  },
  media: {
    accent: "#0F766E",
    glow: "#5EEAD4",
    bg: "#F0FDFA",
    bgStrong: "#CCFBF1",
    gradient: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
  },
  attributes: {
    accent: "#7C3AED",
    glow: "#C4B5FD",
    bg: "#F5F3FF",
    bgStrong: "#EDE9FE",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  },
  variants: {
    accent: "#15803D",
    glow: "#86EFAC",
    bg: "#F0FDF4",
    bgStrong: "#DCFCE7",
    gradient: "linear-gradient(135deg, #15803D 0%, #22C55E 100%)",
  },
  description: {
    accent: "#6D28D9",
    glow: "#C4B5FD",
    bg: "#F5F3FF",
    bgStrong: "#EDE9FE",
    gradient: "linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)",
  },
  "shipping-warranty": {
    accent: "#0369A1",
    glow: "#7DD3FC",
    bg: "#F0F9FF",
    bgStrong: "#BAE6FD",
    gradient: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
  },
  review: {
    accent: "#9D174D",
    glow: "#F9A8D4",
    bg: "#FDF2F8",
    bgStrong: "#FCE7F3",
    gradient: "linear-gradient(135deg, #9D174D 0%, #EC4899 100%)",
  },
};

const DEFAULT_THEME: StepTheme = STEP_THEME["basic-info"];

/* ─── Animated Check SVG ────────────────────────────────────────────────── */

function AnimatedCheck({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ display: "block" }}
    >
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 16,
          strokeDashoffset: 0,
          animation: "wiz-check-draw 0.4s ease forwards",
        }}
      />
    </svg>
  );
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface ProductCreationWizardProps {
  formData: {
    name: string;
    nameBn: string;
    categoryId: string;
    isLeafCategory: boolean;
    brandId: string;
    images: string[];
    videoUrl: string | null;
    description: string;
    attributes: any[];
    variants: any[];
    shippingWarranty: any;
    requiredAttributes: any[];
  };
}

/* ─── Shipping & warranty completion check ───────────────────────────────
   Previously this step was hardcoded to `true`, so the sidebar showed
   "Done" even when the vendor hadn't touched any shipping/warranty
   fields. This checks the same fields ShippingWarrantyForm treats as
   required (package weight, all three dimensions, warranty type, and
   warranty details) so "Done" only shows once they're actually filled. */
function isShippingWarrantyComplete(sw: any): boolean {
  if (!sw) return false;
  return !!(
    sw.packageWeightValue > 0 &&
    sw.packageLength > 0 &&
    sw.packageWidth > 0 &&
    sw.packageHeight > 0 &&
    sw.warrantyType &&
    String(sw.warrantyType).trim().length > 0 &&
    sw.warrantyDetails &&
    String(sw.warrantyDetails).trim().length > 0
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

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
      formData.isLeafCategory &&
      formData.brandId
    );

    s["media"] = formData.images.length > 0;

    if (formData.isLeafCategory && formData.categoryId) {
      s["attributes"] =
        formData.requiredAttributes.length === 0
          ? true
          : formData.requiredAttributes.every((r: any) =>
              formData.attributes.some(
                (a: any) => a.attributeId === r.id
              )
            );
    } else {
      s["attributes"] = false;
    }

    s["variants"] = formData.variants.some(
      (v: any) => v.sku && v.price && v.price > 0
    );
    s["description"] = formData.description.trim().length > 0;
    s["shipping-warranty"] = isShippingWarrantyComplete(
      formData.shippingWarranty
    );
    s["review"] = !!(
      s["basic-info"] &&
      s["media"] &&
      s["attributes"] &&
      s["variants"]
    );

    updateAllSteps(s);
  }, [
    formData.name,
    formData.categoryId,
    formData.isLeafCategory,
    formData.brandId,
    formData.images,
    formData.attributes,
    formData.variants,
    formData.description,
    formData.shippingWarranty,
    formData.requiredAttributes,
    updateAllSteps,
  ]);

  /* ── Progress calculation ── */
  const completedCount = useMemo(
    () => wizardSteps.filter((s) => s.completed).length,
    [wizardSteps]
  );
  const progressPct = Math.round(
    (completedCount / wizardSteps.length) * 100
  );
  const isAllDone = completedCount === wizardSteps.length;

  /* ── Step detail lines ── */
  const getDetails = (
    stepId: string
  ): { text: string; ok: boolean }[] => {
    switch (stepId) {
      case "basic-info":
        return [
          {
            text: formData.name
              ? `"${formData.name.slice(0, 22)}${formData.name.length > 22 ? "…" : ""}"`
              : "Product name",
            ok: !!formData.name,
          },
          {
            text: formData.brandId
              ? "Brand selected"
              : "Brand required",
            ok: !!formData.brandId,
          },
          {
            text:
              formData.categoryId && formData.isLeafCategory
                ? "Leaf category selected"
                : "Leaf category required",
            ok: !!(
              formData.categoryId && formData.isLeafCategory
            ),
          },
        ];
      case "media":
        return [
          {
            text: `${formData.images.length}/10 images uploaded`,
            ok: formData.images.length > 0,
          },
          {
            text: formData.videoUrl
              ? "Video added"
              : "No video (optional)",
            ok: !!formData.videoUrl,
          },
        ];
      case "attributes":
        if (!formData.isLeafCategory)
          return [
            { text: "Select a leaf category first", ok: false },
          ];
        if (formData.requiredAttributes.length === 0)
          return [
            { text: "No required attributes", ok: true },
          ];
        {
          const filled = formData.attributes.filter((a: any) =>
            formData.requiredAttributes.some(
              (r: any) => r.id === a.attributeId
            )
          ).length;
          return [
            {
              text: `${filled}/${formData.requiredAttributes.length} required filled`,
              ok:
                filled === formData.requiredAttributes.length,
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
              : "Not added yet",
            ok: !!formData.description,
          },
        ];
      case "shipping-warranty": {
        const sw = formData.shippingWarranty;
        const hasWeight = !!sw && sw.packageWeightValue > 0;
        const hasDims =
          !!sw &&
          sw.packageLength > 0 &&
          sw.packageWidth > 0 &&
          sw.packageHeight > 0;
        const hasWarrantyType =
          !!sw && !!sw.warrantyType && String(sw.warrantyType).trim().length > 0;
        const hasWarrantyDetails =
          !!sw &&
          !!sw.warrantyDetails &&
          String(sw.warrantyDetails).trim().length > 0;

        return [
          {
            text: hasWeight ? "Package weight set" : "Package weight required",
            ok: hasWeight,
          },
          {
            text: hasDims ? "Dimensions (L×W×H) set" : "Dimensions required",
            ok: hasDims,
          },
          {
            text: hasWarrantyType ? "Warranty type selected" : "Warranty type required",
            ok: hasWarrantyType,
          },
          {
            text: hasWarrantyDetails ? "Warranty details added" : "Warranty details required",
            ok: hasWarrantyDetails,
          },
        ];
      }
      case "review": {
        const allReq = wizardSteps
          .filter((s) => s.required && s.id !== "review")
          .every((s) => s.completed);
        return [
          {
            text: allReq
              ? "All required steps done"
              : "Complete required steps",
            ok: allReq,
          },
        ];
      }
      default:
        return [];
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* ── Progress bar ── */}
      <div
        style={{
          background: "#F1F5F9",
          borderRadius: 20,
          height: 8,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: isAllDone
              ? "linear-gradient(90deg, #10B981, #34D399)"
              : "linear-gradient(90deg, #1D4ED8, #7C3AED)",
            borderRadius: 20,
            transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
            position: "relative",
          }}
        >
          {progressPct > 5 && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 20,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.3))",
                borderRadius: "0 20px 20px 0",
              }}
            />
          )}
        </div>
      </div>

      {/* ── Progress text ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2px",
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: isAllDone ? "#059669" : "#64748B",
            letterSpacing: "0.02em",
          }}
        >
          {isAllDone ? "✦ Ready to submit" : "Progress"}
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: isAllDone ? "#059669" : "#94A3B8",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {completedCount}/{wizardSteps.length}
        </span>
      </div>

      {/* ── Step cards ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginTop: 4,
        }}
      >
        {wizardSteps.map((step, idx) => {
          const done = step.completed;
          const theme =
            STEP_THEME[step.id] || DEFAULT_THEME;
          const details = getDetails(step.id);
          const isLast = idx === wizardSteps.length - 1;

          return (
            <div key={step.id}>
              <div
                style={{
                  position: "relative",
                  background: done ? theme.bg : "#F8FAFC",
                  border: `1px solid ${done ? theme.glow : "#E2E8F0"}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                  transition:
                    "all 0.35s cubic-bezier(.4,0,.2,1)",
                  cursor: "default",
                  overflow: "hidden",
                }}
              >
                {/* Left accent bar */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: done
                      ? theme.gradient
                      : "#CBD5E1",
                    borderRadius: "12px 0 0 12px",
                    transition: "background 0.35s",
                  }}
                />

                {/* Done shimmer overlay */}
                {done && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 1,
                      background: `linear-gradient(90deg, transparent, ${theme.glow}, transparent)`,
                      opacity: 0.7,
                    }}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    paddingLeft: 4,
                  }}
                >
                  {/* Icon bubble */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background: done
                        ? theme.gradient
                        : "#F1F5F9",
                      border: `0.5px solid ${done ? "transparent" : "#CBD5E1"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.35s",
                      boxShadow: done
                        ? `0 2px 8px ${theme.glow}40`
                        : "none",
                    }}
                  >
                    {done ? (
                      <AnimatedCheck color="#FFFFFF" />
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#94A3B8",
                          fontVariantNumeric:
                            "tabular-nums",
                        }}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* Title row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: 6,
                        marginBottom: details.length > 0 ? 5 : 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: done
                            ? 700
                            : 500,
                          color: done
                            ? theme.accent
                            : "#64748B",
                          letterSpacing: "-0.1px",
                          transition:
                            "color 0.35s",
                          lineHeight: 1.3,
                        }}
                      >
                        {step.title}
                      </span>

                      {/* Status pill */}
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform:
                            "uppercase" as const,
                          padding: "2px 7px",
                          borderRadius: 20,
                          color: done
                            ? "#059669"
                            : step.required
                              ? "#B45309"
                              : "#94A3B8",
                          background: done
                            ? "#D1FAE5"
                            : step.required
                              ? "#FEF3C7"
                              : "#F1F5F9",
                          border: done
                            ? "0.5px solid #6EE7B7"
                            : step.required
                              ? "0.5px solid #FCD34D"
                              : "0.5px solid #E2E8F0",
                          transition: "all 0.35s",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {done
                          ? "Done"
                          : step.required
                            ? "Req"
                            : "Opt"}
                      </span>
                    </div>

                    {/* Detail lines */}
                    {details.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {details.map((d, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: 5,
                              fontSize: 10,
                              color: d.ok
                                ? theme.accent
                                : "#94A3B8",
                              opacity: d.ok
                                ? 0.9
                                : 0.6,
                              transition:
                                "all 0.35s",
                            }}
                          >
                            <span
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius:
                                  "50%",
                                background: d.ok
                                  ? theme.accent
                                  : "#CBD5E1",
                                flexShrink: 0,
                                transition:
                                  "background 0.35s",
                              }}
                            />
                            {d.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    width: 1,
                    height: 6,
                    background: done
                      ? theme.glow
                      : "#E2E8F0",
                    margin: "0 auto",
                    borderRadius: 1,
                    transition:
                      "background 0.35s",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes wiz-check-draw {
          from { stroke-dashoffset: 16; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};