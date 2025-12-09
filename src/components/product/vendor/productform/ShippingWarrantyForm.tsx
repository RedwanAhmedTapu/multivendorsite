"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import { ProductShippingWarrantyInput } from "@/types/product";

interface Props {
  value: ProductShippingWarrantyInput | null;
  onChange: (val: ProductShippingWarrantyInput) => void;
  validationErrors: Record<string, boolean>;
}

export default function ShippingWarrantyForm({ value, onChange, validationErrors }: Props) {
  const [form, setForm] = useState<ProductShippingWarrantyInput>(
    value || {
      packageWeightValue: 0,
      packageWeightUnit: "kg",
      packageLength: 0,
      packageWidth: 0,
      packageHeight: 0,
      dangerousGoods: "none",
      warrantyType: "",
      warrantyPeriodValue: 6,
      warrantyPeriodUnit: "months",
      warrantyDetails: "",
    }
  );

  useEffect(() => {
    if (value) {
      setForm(value);
    }
  }, [value]);

  const updateField = (field: keyof ProductShippingWarrantyInput, val: any) => {
    const updated = { ...form, [field]: val };
    setForm(updated);
    onChange(updated);
  };

  const isFieldError = (fieldName: string) => {
    return validationErrors[fieldName];
  };

  return (
    <Card className="w-full mt-6 shadow-none border-none">
      <CardHeader>
        <CardTitle>Shipping & Warranty <span className="text-red-500">*</span></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Package Weight */}
        <div id="packageWeight" className={isFieldError("packageWeight") ? 'border-l-4 border-red-500 pl-4' : ''}>
          <label className="block font-medium mb-2">Package Weight <span className="text-red-500">*</span></label>
          <div className="w-1/3 flex space-x-2">
            <Input
              type="number"
              min={0.001}
              max={300000}
              value={form.packageWeightValue}
              onChange={(e) => updateField("packageWeightValue", Number(e.target.value))}
              placeholder="Enter weight"
              className={isFieldError("packageWeight") ? "border-red-500" : ""}
            />
            <Select
              value={form.packageWeightUnit}
              onValueChange={(val) => updateField("packageWeightUnit", val as ProductShippingWarrantyInput["packageWeightUnit"])}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="g">g</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isFieldError("packageWeight") && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Package weight is required
            </p>
          )}
        </div>

        {/* Package Dimensions */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block font-medium mb-2">Length (cm) <span className="text-red-500">*</span></label>
            <Input
              type="number"
              min={0.01}
              max={300}
              value={form.packageLength}
              onChange={(e) => updateField("packageLength", Number(e.target.value))}
              placeholder="0.01 ~ 300"
            />
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-2">Width (cm) <span className="text-red-500">*</span></label>
            <Input
              type="number"
              min={0.01}
              max={300}
              value={form.packageWidth}
              onChange={(e) => updateField("packageWidth", Number(e.target.value))}
              placeholder="0.01 ~ 300"
            />
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-2">Height (cm) <span className="text-red-500">*</span></label>
            <Input
              type="number"
              min={0.01}
              max={300}
              value={form.packageHeight}
              onChange={(e) => updateField("packageHeight", Number(e.target.value))}
              placeholder="0.01 ~ 300"
            />
          </div>
        </div>

        {/* Dangerous Goods */}
        <div>
          <label className="block font-medium mb-2">Dangerous Goods</label>
          <RadioGroup
            value={form.dangerousGoods}
            onValueChange={(val) => updateField("dangerousGoods", val)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="none" />
              <span>None</span>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="contains" />
              <span>Contains battery / flammables / liquid</span>
            </div>
          </RadioGroup>
        </div>

        {/* Warranty Type */}
        <div id="warrantyType" className={isFieldError("warrantyType") ? 'border-l-4 border-red-500 pl-4' : ''}>
          <label className="block font-medium mb-2">Warranty Type <span className="text-red-500">*</span></label>
          <Select
            value={form.warrantyType}
            onValueChange={(val) => updateField("warrantyType", val)}
          >
            <SelectTrigger className={isFieldError("warrantyType") ? "border-red-500" : ""}>
              <SelectValue placeholder="Select warranty type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manufacturer">Manufacturer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
          {isFieldError("warrantyType") && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Warranty type is required
            </p>
          )}
        </div>

        {/* Warranty Period */}
        <div>
          <label className="block font-medium mb-2">Warranty Period <span className="text-red-500">*</span></label>
          <div className="md:w-1/3 flex space-x-2">
            <Input
              type="number"
              min={0}
              value={form.warrantyPeriodValue}
              onChange={(e) => updateField("warrantyPeriodValue", Number(e.target.value))}
              placeholder="e.g., 6"
            />
            <Select
              value={form.warrantyPeriodUnit}
              onValueChange={(val) => updateField("warrantyPeriodUnit", val as ProductShippingWarrantyInput["warrantyPeriodUnit"])}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="months">Months</SelectItem>
                <SelectItem value="years">Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Warranty Details */}
        <div id="warrantyDetails" className={isFieldError("warrantyDetails") ? 'border-l-4 border-red-500 pl-4' : ''}>
          <label className="block font-medium mb-2">Warranty Details <span className="text-red-500">*</span></label>
          <Input
            value={form.warrantyDetails || ""}
            onChange={(e) => updateField("warrantyDetails", e.target.value)}
            placeholder="Provide warranty terms and conditions"
            className={`md:w-2/3 md:h-16 ${isFieldError("warrantyDetails") ? "border-red-500" : ""}`}
          />
          {isFieldError("warrantyDetails") && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Warranty details are required
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}