"use client";

import { Sparkles, Store, User, Phone, MapPin, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { StoreFormValues, AutoFilledField } from "@/types/courier-store";

// -------- Auto-filled badge --------
export function AutoFilledBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full cursor-default select-none leading-none">
            <Sparkles className="w-2.5 h-2.5" />
            Auto-filled
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Pre-filled from warehouse data — edit freely.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// -------- Field wrapper with auto-fill highlight --------
interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  isAutoFilled?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, required, optional, isAutoFilled, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {optional && (
            <span className="text-slate-400 font-normal normal-case tracking-normal ml-1 text-xs">
              (optional)
            </span>
          )}
        </Label>
        {isAutoFilled && <AutoFilledBadge />}
      </div>
      {children}
    </div>
  );
}

// -------- Helper to get input class based on auto-fill state --------
export function inputCls(isAutoFilled: boolean, extra = "") {
  return `${extra} transition-colors ${
    isAutoFilled
      ? "border-teal-300 bg-teal-50/50 focus:border-teal-500 focus:ring-teal-200"
      : ""
  }`;
}

// -------- Main store detail fields --------
interface StoreFormFieldsProps {
  form: StoreFormValues;
  autoFilledFields: Set<AutoFilledField>;
  isPathao: boolean;
  onChange: (field: keyof StoreFormValues, value: string) => void;
}

export function StoreFormFields({
  form,
  autoFilledFields,
  isPathao,
  onChange,
}: StoreFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Store Name */}
        <FormField label="Store Name" required isAutoFilled={autoFilledFields.has("storeName")}>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <Input
              className={inputCls(autoFilledFields.has("storeName"), "pl-9 h-9 text-sm")}
              placeholder="e.g. Dhaka Central Warehouse"
              value={form.storeName}
              onChange={(e) => onChange("storeName", e.target.value)}
            />
          </div>
        </FormField>

        {/* Contact Phone */}
        <FormField label="Contact Phone" required isAutoFilled={autoFilledFields.has("contactPhone")}>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <Input
              className={inputCls(autoFilledFields.has("contactPhone"), "pl-9 h-9 text-sm")}
              placeholder="01XXXXXXXXX"
              value={form.contactPhone}
              onChange={(e) => onChange("contactPhone", e.target.value)}
            />
          </div>
        </FormField>

        {/* Contact Name — Pathao only */}
        {isPathao && (
          <FormField label="Contact Person" required isAutoFilled={autoFilledFields.has("contactName")}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                className={inputCls(autoFilledFields.has("contactName"), "pl-9 h-9 text-sm")}
                placeholder="Full name"
                value={form.contactName}
                onChange={(e) => onChange("contactName", e.target.value)}
              />
            </div>
          </FormField>
        )}

        {/* Secondary Phone — Pathao only */}
        {isPathao && (
          <FormField label="Secondary Phone" optional>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                className="pl-9 h-9 text-sm"
                placeholder="01XXXXXXXXX"
                value={form.secondaryPhone}
                onChange={(e) => onChange("secondaryPhone", e.target.value)}
              />
            </div>
          </FormField>
        )}
      </div>

      {/* Address — full width */}
      <FormField label="Pickup Address" required isAutoFilled={autoFilledFields.has("address")}>
        <div className="relative">
          <MapPin className="absolute left-3 top-[11px] w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <textarea
            rows={2}
            className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none ${
              autoFilledFields.has("address")
                ? "border-teal-300 bg-teal-50/50 focus:ring-teal-200"
                : "border-input"
            }`}
            placeholder="Full street address..."
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </div>
      </FormField>

      {/* Auto-fill hint */}
      {autoFilledFields.size > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-200 text-[11px] text-teal-700">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            {autoFilledFields.size} field{autoFilledFields.size > 1 ? "s" : ""} pre-filled from
            warehouse — changes here won't affect your warehouse data.
          </span>
        </div>
      )}
    </div>
  );
}