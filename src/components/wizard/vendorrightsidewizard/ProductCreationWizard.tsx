import React, { useEffect } from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useRightSidebar } from "@/app/vendor-dashboard/rightbar/RightSidebar";

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

export const ProductCreationWizard: React.FC<ProductCreationWizardProps> = ({
  formData,
}) => {
  const { wizardSteps, updateAllSteps } = useRightSidebar();

  // Update completion status based on form data
  useEffect(() => {
    const completionStatus: Partial<Record<string, boolean>> = {};

    // 1. Basic Info - name and leaf category selected
    completionStatus["basic-info"] = !!(
      formData.name.trim() &&
      formData.categoryId &&
      formData.isLeafCategory
    );

    // 2. Media - at least one image
    completionStatus["media"] = formData.images.length > 0;

    // 3. Attributes - FIXED: Only complete if leaf category selected AND all required attributes filled
    if (formData.isLeafCategory && formData.categoryId) {
      // If there are required attributes, check if they're all filled
      if (formData.requiredAttributes.length > 0) {
        const requiredAttrsFilled = formData.requiredAttributes.every((reqAttr) =>
          formData.attributes.some((attr) => attr.attributeId === reqAttr.id)
        );
        completionStatus["attributes"] = requiredAttrsFilled;
      } else {
        // No required attributes, but still need leaf category
        completionStatus["attributes"] = true;
      }
    } else {
      // Not a leaf category yet, can't be complete
      completionStatus["attributes"] = false;
    }

    // 4. Variants - at least one variant with valid data
    const hasValidVariant = formData.variants.some(
      (v) => v.sku && v.price && v.price > 0
    );
    completionStatus["variants"] = hasValidVariant;

    // 5. Description - optional, mark as complete only if has actual content
    completionStatus["description"] = formData.description.trim().length > 0;

    // 6. Shipping & Warranty - optional, mark as complete if either field is filled
    // If both fields are empty, still consider it complete since it's optional
    const hasShippingWarrantyData = 
      formData.shippingWarranty?.warrantyType || 
      formData.shippingWarranty?.warrantyDetails;
    completionStatus["shipping-warranty"] = true; // Always complete since it's optional

    // 7. Review - all required steps completed
    // Note: shipping-warranty is not required, so don't include it in required steps check
    const allRequiredComplete = 
      completionStatus["basic-info"] &&
      completionStatus["media"] &&
      completionStatus["attributes"] &&
      completionStatus["variants"];
    completionStatus["review"] = allRequiredComplete;

    updateAllSteps(completionStatus);
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

  return (
    <div className="space-y-3">
      {wizardSteps.map((step, index) => {
        const isCompleted = step.completed;
        const isRequired = step.required;

        return (
          <div
            key={step.id}
            className={`p-3 rounded-lg border-2 transition-all ${
              isCompleted
                ? "bg-green-50 border-green-200"
                : isRequired
                ? "bg-white border-gray-200 hover:border-blue-200"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : isRequired ? (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${
                      isCompleted ? "text-green-900" : "text-gray-900"
                    }`}>
                      {step.title}
                    </h4>
                    {isRequired && !isCompleted && (
                      <p className="text-xs text-amber-600 mt-0.5">Required</p>
                    )}
                    {!isRequired && (
                      <p className="text-xs text-gray-500 mt-0.5">Optional</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-400">
                    {index + 1}/{wizardSteps.length}
                  </span>
                </div>

                {/* Step-specific details */}
                {step.id === "basic-info" && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p className={formData.name ? "text-green-600" : ""}>
                      • Product name {formData.name ? "✓" : ""}
                    </p>
                    <p className={formData.categoryId && formData.isLeafCategory ? "text-green-600" : ""}>
                      • Leaf category {formData.categoryId && formData.isLeafCategory ? "✓" : ""}
                    </p>
                  </div>
                )}

                {step.id === "media" && (
                  <div className="mt-2 text-xs text-gray-600">
                    <p className={formData.images.length > 0 ? "text-green-600" : ""}>
                      • Images: {formData.images.length}/10 {formData.images.length > 0 ? "✓" : ""}
                    </p>
                  </div>
                )}

                {step.id === "attributes" && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    {!formData.isLeafCategory ? (
                      <p className="text-amber-600">• Select a leaf category first</p>
                    ) : formData.requiredAttributes.length === 0 ? (
                      <p className="text-green-600">• No required attributes ✓</p>
                    ) : (
                      <p className={
                        formData.attributes.filter(a => 
                          formData.requiredAttributes.some(r => r.id === a.attributeId)
                        ).length === formData.requiredAttributes.length ? "text-green-600" : ""
                      }>
                        • Required: {formData.attributes.filter(a => 
                          formData.requiredAttributes.some(r => r.id === a.attributeId)
                        ).length}/{formData.requiredAttributes.length}
                        {formData.attributes.filter(a => 
                          formData.requiredAttributes.some(r => r.id === a.attributeId)
                        ).length === formData.requiredAttributes.length ? " ✓" : ""}
                      </p>
                    )}
                  </div>
                )}

                {step.id === "variants" && (
                  <div className="mt-2 text-xs text-gray-600">
                    <p className={formData.variants.length > 0 ? "text-green-600" : ""}>
                      • Variants: {formData.variants.length} {formData.variants.length > 0 ? "✓" : ""}
                    </p>
                  </div>
                )}

                {step.id === "description" && (
                  <div className="mt-2 text-xs text-gray-600">
                    <p className={formData.description ? "text-green-600" : "text-gray-500"}>
                      • {formData.description ? `${formData.description.length} characters ✓` : "Not added yet"}
                    </p>
                  </div>
                )}

                {step.id === "shipping-warranty" && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p className={formData.shippingWarranty?.warrantyType ? "text-green-600" : "text-gray-500"}>
                      • Warranty type {formData.shippingWarranty?.warrantyType ? "✓" : "(Optional)"}
                    </p>
                    <p className={formData.shippingWarranty?.warrantyDetails ? "text-green-600" : "text-gray-500"}>
                      • Warranty details {formData.shippingWarranty?.warrantyDetails ? "✓" : "(Optional)"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};