"use client";

import { Sparkles, Store, User, Phone, MapPin, Info, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { StoreFormValues, AutoFilledField } from "@/types/courier-store";
import type { ValidationErrors } from "@/lib/validation/store-validation";

// -------- Auto-filled badge --------
export function AutoFilledBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full cursor-default select-none leading-none">
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

// -------- Field wrapper with auto-fill highlight + validation error --------
interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  isAutoFilled?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, optional, isAutoFilled, error, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-bold text-[#3D5068] uppercase tracking-wide">
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
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-red-600">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// -------- Helper to get input class based on auto-fill / error state --------
export function inputCls(isAutoFilled: boolean, hasError = false, extra = "") {
  return `${extra} transition-colors ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
      : isAutoFilled
      ? "border-indigo-300 bg-indigo-50/50 focus:border-indigo-500 focus:ring-indigo-200"
      : "border-[#E5EAF2]"
  }`;
}

// -------- Main store detail fields --------
interface StoreFormFieldsProps {
  form: StoreFormValues;
  autoFilledFields: Set<AutoFilledField>;
  isPathao: boolean;
  errors?: ValidationErrors;
  /** Only render error text once the user has attempted submit / touched the form. */
  showErrors?: boolean;
  onChange: (field: keyof StoreFormValues, value: string) => void;
}

export function StoreFormFields({
  form,
  autoFilledFields,
  isPathao,
  errors = {},
  showErrors = false,
  onChange,
}: StoreFormFieldsProps) {
  const err = (field: keyof ValidationErrors) => (showErrors ? errors[field] : undefined);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Store Name */}
        <FormField
          label="Store Name"
          required
          isAutoFilled={autoFilledFields.has("storeName")}
          error={err("storeName")}
        >
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <Input
              className={inputCls(autoFilledFields.has("storeName"), Boolean(err("storeName")), "pl-9 h-9 text-sm")}
              placeholder="e.g. Dhaka Central Warehouse"
              value={form.storeName}
              onChange={(e) => onChange("storeName", e.target.value)}
            />
          </div>
        </FormField>

        {/* Contact Phone */}
        <FormField
          label="Contact Phone"
          required
          isAutoFilled={autoFilledFields.has("contactPhone")}
          error={err("contactPhone")}
        >
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <Input
              className={inputCls(autoFilledFields.has("contactPhone"), Boolean(err("contactPhone")), "pl-9 h-9 text-sm")}
              placeholder="01XXXXXXXXX"
              value={form.contactPhone}
              onChange={(e) => onChange("contactPhone", e.target.value)}
            />
          </div>
        </FormField>

        {/* Contact Name — Pathao only */}
        {isPathao && (
          <FormField
            label="Contact Person"
            required
            isAutoFilled={autoFilledFields.has("contactName")}
            error={err("contactName")}
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                className={inputCls(autoFilledFields.has("contactName"), Boolean(err("contactName")), "pl-9 h-9 text-sm")}
                placeholder="Full name"
                value={form.contactName}
                onChange={(e) => onChange("contactName", e.target.value)}
              />
            </div>
          </FormField>
        )}

        {/* Secondary Phone — Pathao only */}
        {isPathao && (
          <FormField label="Secondary Phone" optional error={err("secondaryPhone")}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                className={inputCls(false, Boolean(err("secondaryPhone")), "pl-9 h-9 text-sm")}
                placeholder="01XXXXXXXXX"
                value={form.secondaryPhone}
                onChange={(e) => onChange("secondaryPhone", e.target.value)}
              />
            </div>
          </FormField>
        )}
      </div>

      {/* Address — full width */}
      <FormField
        label="Pickup Address"
        required
        isAutoFilled={autoFilledFields.has("address")}
        error={err("address")}
      >
        <div className="relative">
          <MapPin className="absolute left-3 top-[11px] w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <textarea
            rows={2}
            className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none ${
              err("address")
                ? "border-red-300 focus:ring-red-200"
                : autoFilledFields.has("address")
                ? "border-indigo-300 bg-indigo-50/50 focus:ring-indigo-200"
                : "border-[#E5EAF2]"
            }`}
            placeholder="Full street address..."
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </div>
      </FormField>

      {/* Location-level error (city/zone/area or RedX area) */}
      {err("location") && (
        <div className="flex items-start gap-2 px-2.5 py-2 bg-red-50 rounded-lg border border-red-200 text-[11px] text-red-700">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{errors.location}</span>
        </div>
      )}

      {/* Auto-fill hint */}
      {autoFilledFields.size > 0 && (
        <div className="flex items-start gap-2 px-2.5 py-2 bg-indigo-50 rounded-lg border border-indigo-200 text-[11px] text-indigo-700">
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