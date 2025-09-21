"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductShippingWarrantyInput } from "@/types/product";

interface Props {
  value: ProductShippingWarrantyInput | null;
  onChange: (val: ProductShippingWarrantyInput) => void;
}

export default function ShippingWarrantyForm({ value, onChange }: Props) {
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

  const updateField = (field: keyof ProductShippingWarrantyInput, val: any) => {
    const updated = { ...form, [field]: val };
    setForm(updated);
    onChange(updated);
  };

  return (
    <Card className="w-full mt-6 shadow-none border-none">
      <CardHeader>
        <CardTitle>Shipping & Warranty</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Package Weight */}
        <div>
          <label className="block font-medium mb-2">Package Weight *</label>
          <div className="w-1/3 flex space-x-2">
            <Input
              type="number"
              min={0.001}
              max={300000} // adjust max according to unit
              value={form.packageWeightValue}
              onChange={(e) => updateField("packageWeightValue", Number(e.target.value))}
              placeholder="Enter weight"
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
        </div>

        {/* Package Dimensions */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block font-medium mb-2">Length (cm) *</label>
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
            <label className="block font-medium mb-2">Width (cm) *</label>
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
            <label className="block font-medium mb-2">Height (cm) *</label>
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
        <div>
          <label className="block font-medium mb-2">Warranty Type *</label>
          <Select
            value={form.warrantyType}
            onValueChange={(val) => updateField("warrantyType", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manufacturer">Manufacturer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Warranty Period */}
        <div>
          <label className="block font-medium mb-2">Warranty Period *</label>
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
        <div>
          <label className="block font-medium mb-2">Warranty Details *</label>
          <Input
            value={form.warrantyDetails}
            onChange={(e) => updateField("warrantyDetails", e.target.value)}
            placeholder="Provide warranty terms"
            className="md:w-2/3 md:h-16"
          />
        </div>

      </CardContent>
    </Card>
  );
}