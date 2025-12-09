"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CheckCircle, AlertCircle, Image, Package, Settings, Tag, FileText, Truck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRightSidebar, WizardStep } from "@/app/vendor-dashboard/rightbar/RightSidebar";

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

export const ProductCreationWizard: React.FC<ProductCreationWizardProps> = ({ formData }) => {
  const { updateStepCompletion, setCurrentStep } = useRightSidebar();
  const [allRequiredFields, setAllRequiredFields] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const steps = useMemo<WizardStep[]>(() => [
    { id: "basic-info", title: "Basic Information", description: "Product name, category, and basic details", icon: <Tag className="w-4 h-4" />, completed: false, required: true },
    { id: "media", title: "Media Upload", description: "Product images and video", icon: <Image className="w-4 h-4" />, completed: false, required: true },
    { id: "attributes", title: "Attributes & Specifications", description: "Product specifications and features", icon: <Settings className="w-4 h-4" />, completed: false, required: true },
    { id: "variants", title: "Product Variants", description: "Manage different product variations", icon: <Package className="w-4 h-4" />, completed: false, required: true },
    { id: "description", title: "Description & Details", description: "Product description and additional info", icon: <FileText className="w-4 h-4" />, completed: false, required: false },
    { id: "shipping-warranty", title: "Shipping & Warranty", description: "Shipping details and warranty information", icon: <Truck className="w-4 h-4" />, completed: false, required: true },
    { id: "review", title: "Review & Submit", description: "Final review before submission", icon: <CheckCircle className="w-4 h-4" />, completed: false, required: true },
  ], []);

  const calculateCompletionStatus = useCallback(() => {
    const requiredFields: string[] = [];
    const newCompletedSteps: Record<string, boolean> = {};

    // Step 1: Basic Info
    const basicInfoCompleted = Boolean(formData.name && formData.categoryId && formData.isLeafCategory);
    if (!formData.name) requiredFields.push("productName");
    if (!formData.categoryId || !formData.isLeafCategory) requiredFields.push("categorySelector");
    newCompletedSteps["basic-info"] = basicInfoCompleted;

    // Step 2: Media
    const mediaCompleted = formData.images.length > 0;
    if (!mediaCompleted) requiredFields.push("productImages");
    newCompletedSteps["media"] = mediaCompleted;

    // ✅ Step 3: Attributes (FIXED)
    const attributesCompleted = formData.requiredAttributes.every(attr => {
      const filled = formData.attributes.find(a => a.attributeId === attr.id);
      return filled && (
        filled.valueString?.trim() !== "" ||
        filled.valueNumber !== undefined ||
        filled.valueBoolean !== undefined ||
        !!filled.attributeValueId
      );
    });

    formData.requiredAttributes.forEach(attr => {
      const filled = formData.attributes.find(a => a.attributeId === attr.id);
      const hasValue = filled && (
        filled.valueString?.trim() !== "" ||
        filled.valueNumber !== undefined ||
        filled.valueBoolean !== undefined ||
        !!filled.attributeValueId
      );
      if (!hasValue) requiredFields.push(`attribute-${attr.id}`);
    });

    newCompletedSteps["attributes"] = attributesCompleted;

    // Step 4: Variants
    const variantsCompleted = formData.variants.length > 0 &&
      formData.variants.every(v => v.sku && v.price && v.price > 0);

    if (!variantsCompleted) requiredFields.push("variantsSection");

    newCompletedSteps["variants"] = variantsCompleted;

    // Step 5: Description (optional)
    newCompletedSteps["description"] = true;

    // Step 6: Shipping & Warranty
    const shippingCompleted = Boolean(
      formData.shippingWarranty?.packageWeightValue &&
      formData.shippingWarranty?.warrantyType &&
      formData.shippingWarranty?.warrantyDetails
    );

    if (!formData.shippingWarranty?.packageWeightValue) requiredFields.push("packageWeight");
    if (!formData.shippingWarranty?.warrantyType) requiredFields.push("warrantyType");
    if (!formData.shippingWarranty?.warrantyDetails) requiredFields.push("warrantyDetails");

    newCompletedSteps["shipping-warranty"] = shippingCompleted;

    // Step 7: Review
    newCompletedSteps["review"] =
      basicInfoCompleted &&
      mediaCompleted &&
      attributesCompleted &&
      variantsCompleted &&
      shippingCompleted;

    return { requiredFields, completedSteps: newCompletedSteps };
  }, [formData]);

  useEffect(() => {
    const { requiredFields, completedSteps: newCompletedSteps } = calculateCompletionStatus();
    setAllRequiredFields(requiredFields);
    setCompletedSteps(newCompletedSteps);

    Object.entries(newCompletedSteps).forEach(([stepId, completed]) => {
      updateStepCompletion(stepId, completed);
    });
  }, [calculateCompletionStatus, updateStepCompletion]);

  const completionPercentage = useMemo(() => {
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completedCount / steps.length) * 100);
  }, [completedSteps, steps.length]);

  const scrollToField = useCallback((fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("border-red-500", "ring-2", "ring-red-200");
    setTimeout(() => {
      el.classList.remove("border-red-500", "ring-2", "ring-red-200");
    }, 3000);
  }, []);

  return (
    <div className="space-y-6">

      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-gray-900">Product Creation Wizard</h3>
          <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`p-3 rounded-lg border ${completedSteps[step.id] ? "border-green-200 bg-green-50" : "border-gray-200"}`}
            onClick={() => setCurrentStep(index)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${completedSteps[step.id] ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                {completedSteps[step.id] ? <CheckCircle className="w-5 h-5" /> : step.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Required Field Summary */}
      {allRequiredFields.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">
            {allRequiredFields.length} Required Fields Missing
          </h4>

          <div className="space-y-2 text-sm text-red-700">
            {!formData.name && <button onClick={() => scrollToField("productName")}>• Product Name</button>}
            {!formData.categoryId && <button onClick={() => scrollToField("categorySelector")}>• Category</button>}
            {formData.images.length === 0 && <button onClick={() => scrollToField("productImages")}>• Images</button>}
          </div>
        </div>
      )}

    </div>
  );
};
