// components/offers/shared/offer-form-fields.tsx
//
// Small form building blocks for the offer dialogs: a labelled field with an
// inline error, a grouped section, and a date picker that keeps ISO strings.

"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function OfferField({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id?: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-semibold text-[#3D5068]">
        {label}
        {required && <span className="ml-0.5 text-rose-500" aria-hidden>*</span>}
      </Label>
      {children}
      {error ? (
        <p id={id ? `${id}-error` : undefined} role="alert" className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#7A90AB]">{hint}</p>
      ) : null}
    </div>
  );
}

export function OfferFormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-[#EEF2F7] bg-[#FAFBFD]/60 p-3.5">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden>
        <p className="text-sm font-semibold text-[#0D1B2E]">{title}</p>
        {description && <p className="text-xs text-[#7A90AB]">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export const offerInputClass = "h-9 rounded-lg border-[#E5EAF2] bg-white focus-visible:border-indigo-300 focus-visible:ring-indigo-100";

export function OfferDateField({
  value,
  onChange,
  placeholder = "Pick a date",
  clearable,
  invalid,
  id,
  disabledBefore,
}: {
  value?: string | Date | null;
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
  clearable?: boolean;
  invalid?: boolean;
  id?: string;
  disabledBefore?: Date;
}) {
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value) : undefined;
  const valid = date && Number.isFinite(date.getTime());
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={invalid || undefined}
          className={cn("h-9 w-full justify-start rounded-lg border-[#E5EAF2] bg-white text-left font-normal", !valid && "text-[#9AABC1]", invalid && "border-rose-300")}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
          {valid ? format(date, "dd MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-xl p-0" align="start">
        <Calendar
          mode="single"
          selected={valid ? date : undefined}
          onSelect={(d) => { onChange(d ? d.toISOString() : undefined); setOpen(false); }}
          disabled={disabledBefore ? { before: disabledBefore } : undefined}
          initialFocus
        />
        {clearable && valid && (
          <div className="border-t border-[#EEF2F7] p-2">
            <Button type="button" variant="ghost" size="sm" className="w-full text-[#3D5068]" onClick={() => { onChange(undefined); setOpen(false); }}>
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Number input value → number | undefined (never NaN). */
export function parseNumberInput(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
