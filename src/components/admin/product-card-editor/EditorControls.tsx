"use client";

// components/admin/product-card-editor/EditorControls.tsx
//
// One control per field of the product card schema that the shared card
// actually renders (lib/product-card/config.ts → lib/product-card/style.ts /
// SharedProductCard). Bounds and choices are the schema's own; nothing here
// can produce a value the backend would not accept, and there is no free-form
// CSS / class / HTML input (the button label is bounded plain text, rendered
// as React text). Not exposed: `preset` (label only, no preset definitions),
// `schemaVersion`, `title.lines` (titles are always one line). The optional `grid` block is added / removed with the
// "Custom grid" switch; without it the listing pages keep their built-in grid.
import type { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import type { ProductCardConfig } from "@/lib/product-card/config";
import { getIn, type Breakpoint, type FieldErrors } from "@/lib/product-card/editor";
import { ADD_TO_CART_LABEL_MAX } from "@/lib/product-card/config";
import { DEFAULT_ADD_TO_CART_LABEL } from "@/lib/product-card/cart";
import { defaultListingGrid, renderedColumnRange } from "@/lib/product-card/grid";

type Change = (path: string, value: unknown) => void;

interface ControlsProps {
  config: ProductCardConfig;
  breakpoint: Breakpoint;
  fieldErrors: FieldErrors;
  disabled?: boolean;
  onChange: Change;
}

const BP_LABEL: Record<Breakpoint, string> = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };

// ── primitives ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600" role="alert">{message}</p> : null;
}

function Row({ label, hint, children, error }: { label: string; hint?: ReactNode; children: ReactNode; error?: string }) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-700">{label}</span>
        {children}
      </div>
      {hint ? <p className="mt-0.5 text-xs text-gray-400">{hint}</p> : null}
      <FieldError message={error} />
    </div>
  );
}

function NumberField(props: {
  label: string;
  path: string;
  min: number;
  max: number;
  unit?: string;
  responsive?: Breakpoint;
  hint?: ReactNode;
  config: ProductCardConfig;
  fieldErrors: FieldErrors;
  disabled?: boolean;
  onChange: Change;
}) {
  const { label, min, max, unit = "px", responsive, hint, config, fieldErrors, disabled, onChange } = props;
  const path = responsive ? `${props.path}.${responsive}` : props.path;
  const value = getIn(config, path) as number;
  const id = `pce-${path.replace(/\./g, "-")}`;
  const set = (raw: string) => {
    const n = Number(raw);
    // Keep the raw (possibly out-of-range) number so validation can flag it;
    // the slider itself can only produce in-range integers.
    if (raw !== "" && Number.isFinite(n)) onChange(path, n);
  };
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm text-gray-700">
          {label}
          {responsive ? <span className="ml-1.5 rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">{BP_LABEL[responsive]}</span> : null}
        </label>
        <div className="flex items-center gap-1">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={1}
            value={value}
            disabled={disabled}
            aria-invalid={fieldErrors[path] ? true : undefined}
            onChange={(e) => set(e.target.value)}
            className="w-16 rounded-md border border-gray-200 px-2 py-1 text-right text-sm disabled:bg-gray-50 aria-invalid:border-red-400"
          />
          <span className="w-5 text-xs text-gray-400">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        aria-label={`${label}${responsive ? ` (${BP_LABEL[responsive]})` : ""}`}
        min={min}
        max={max}
        step={1}
        value={Math.min(max, Math.max(min, value))}
        disabled={disabled}
        onChange={(e) => onChange(path, Number(e.target.value))}
        className="mt-1 w-full accent-teal-600"
      />
      {hint ? <p className="text-xs text-gray-400">{hint}</p> : null}
      <FieldError message={fieldErrors[path]} />
    </div>
  );
}

function Toggle({ label, path, hint, config, fieldErrors, disabled, onChange }: { label: string; path: string; hint?: ReactNode } & Omit<ControlsProps, "breakpoint">) {
  const checked = getIn(config, path) === true;
  return (
    <Row label={label} hint={hint} error={fieldErrors[path]}>
      <Switch checked={checked} disabled={disabled} aria-label={label} onCheckedChange={(v) => onChange(path, v === true)} />
    </Row>
  );
}

function Choice<T extends string | number>(props: {
  label: string;
  path: string;
  options: readonly { value: T; label: string }[];
  hint?: ReactNode;
  config: ProductCardConfig;
  fieldErrors: FieldErrors;
  disabled?: boolean;
  onChange: Change;
}) {
  const { label, path, options, hint, config, fieldErrors, disabled, onChange } = props;
  const value = getIn(config, path) as T;
  return (
    <div className="py-2">
      <span className="text-sm text-gray-700" id={`pce-${path.replace(/\./g, "-")}-label`}>{label}</span>
      <div role="radiogroup" aria-labelledby={`pce-${path.replace(/\./g, "-")}-label`} className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={disabled}
            onClick={() => onChange(path, o.value)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              value === o.value ? "border-teal-600 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
      <FieldError message={fieldErrors[path]} />
    </div>
  );
}

function ColorField({ label, path, config, fieldErrors, disabled, onChange }: { label: string; path: string } & Omit<ControlsProps, "breakpoint">) {
  const value = getIn(config, path) as string | null | undefined;
  const isDefault = !value;
  return (
    <Row label={label} error={fieldErrors[path]}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || isDefault}
          onClick={() => onChange(path, null)}
          className="text-xs text-gray-500 underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
        >
          {isDefault ? "Default" : "Use default"}
        </button>
        <input
          type="color"
          aria-label={label}
          value={value ?? "#ffffff"}
          disabled={disabled}
          onChange={(e) => onChange(path, e.target.value.toLowerCase())}
          className={`h-7 w-9 cursor-pointer rounded border border-gray-200 bg-white p-0.5 ${isDefault ? "opacity-40" : ""}`}
        />
      </div>
    </Row>
  );
}

function Section({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-gray-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800">
        {title}
        <span className="text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
      </summary>
      <div className="divide-y divide-gray-100 border-t border-gray-100 px-4 pb-2">{children}</div>
    </details>
  );
}

function TextField({ label, path, placeholder, maxLength, hint, config, fieldErrors, disabled, onChange }: {
  label: string;
  path: string;
  placeholder: string;
  maxLength: number;
  hint?: ReactNode;
} & Omit<ControlsProps, "breakpoint">) {
  const value = (getIn(config, path) as string | undefined) ?? "";
  const id = `pce-${path.replace(/\./g, "-")}`;
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm text-gray-700">{label}</label>
        <button
          type="button"
          disabled={disabled || value === ""}
          onClick={() => onChange(path, undefined)}
          className="text-xs text-gray-500 underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
        >
          {value === "" ? "Default" : "Use default"}
        </button>
      </div>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength + 8 /* lets over-long input show the validation message */}
        disabled={disabled}
        aria-invalid={fieldErrors[path] ? true : undefined}
        // Empty input = default label (the optional field is removed).
        onChange={(e) => onChange(path, e.target.value === "" ? undefined : e.target.value)}
        className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm disabled:bg-gray-50 aria-invalid:border-red-400"
      />
      {hint ? <p className="mt-0.5 text-xs text-gray-400">{hint}</p> : null}
      <FieldError message={fieldErrors[path]} />
    </div>
  );
}

// ── option lists (schema enums) ─────────────────────────────────────────────

const WEIGHTS = [
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "semibold", label: "Semibold" },
  { value: "bold", label: "Bold" },
] as const;
const SHADOWS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;

// ── the panel ───────────────────────────────────────────────────────────────

export function EditorControls(props: ControlsProps) {
  const { config, breakpoint: bp } = props;
  const common = { config, fieldErrors: props.fieldErrors, disabled: props.disabled, onChange: props.onChange };
  const fixedImage = config.image.sizing === "fixed";

  return (
    <div className="space-y-3">
      <Section title="Visibility" defaultOpen>
        <Toggle label="Image" path="show.image" {...common} />
        <Toggle label="Title" path="show.title" {...common} />
        <Toggle label="Price" path="show.price" {...common} />
        <Toggle label="Original price (when discounted)" path="show.originalPrice" {...common} />
        <Toggle label="Discount badge" path="show.discountBadge" hint="Shown only for a real discount (special price below price)." {...common} />
        <Toggle label="Rating stars" path="show.rating" hint="Shown only for products that have reviews." {...common} />
        <Toggle label="Review count" path="show.reviewCount" hint="Number next to the stars." {...common} />
        <Toggle label="Store name" path="show.storeName" hint="Always hidden on a vendor's own storefront." {...common} />
        <Toggle label="Verified badge" path="show.verifiedBadge" hint="Verified vendors only; hidden on a vendor's own storefront." {...common} />
        <Toggle label="Stock label" path="show.stockLabel" {...common} />
        <Toggle
          label="Free shipping badge"
          path="show.freeShippingBadge"
          hint="Listings don't include offer data yet, so this badge currently appears only in this preview."
          {...common}
        />
      </Section>

      <Section title="Card" defaultOpen>
        <NumberField label="Corner radius" path="card.radius" min={0} max={24} {...common} />
        <NumberField label="Border width" path="card.borderWidth" min={0} max={2} {...common} />
        <Choice label="Shadow" path="card.shadow" options={SHADOWS} {...common} />
        <Choice label="Hover shadow" path="card.hoverShadow" options={SHADOWS} {...common} />
        <Choice label="Text alignment" path="card.align" options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }] as const} {...common} />
        <ColorField label="Background" path="card.background" {...common} />
        <ColorField label="Border color" path="card.borderColor" {...common} />
      </Section>

      <Section title="Spacing">
        <NumberField label="Image to text gap" path="card.imageGap" min={0} max={24} responsive={bp} {...common} />
        <NumberField label="Side padding" path="card.contentPaddingX" min={0} max={24} responsive={bp} {...common} />
        <NumberField label="Top & bottom padding" path="card.contentPaddingY" min={0} max={16} {...common} />
      </Section>

      <Section title="Image">
        <Choice
          label="Image area"
          path="image.sizing"
          options={[
            { value: "fixed", label: "Fixed height" },
            { value: "1:1", label: "1:1" },
            { value: "4:5", label: "4:5" },
            { value: "3:4", label: "3:4" },
            { value: "4:3", label: "4:3" },
          ] as const}
          {...common}
        />
        <NumberField
          label="Image height"
          path="image.height"
          min={80}
          max={320}
          responsive={bp}
          hint={fixedImage ? undefined : "Used only with “Fixed height”."}
          {...common}
          disabled={common.disabled || !fixedImage}
        />
        <Choice label="Image fit" path="image.fit" options={[{ value: "contain", label: "Contain" }, { value: "cover", label: "Cover" }] as const} {...common} />
        <NumberField label="Image inset" path="image.padding" min={0} max={24} {...common} />
        <ColorField label="Image background" path="image.background" {...common} />
      </Section>

      <Section title="Title">
        <NumberField label="Font size" path="title.size" min={10} max={20} responsive={bp} {...common} />
        <Choice label="Font weight" path="title.weight" options={WEIGHTS} {...common} />
        <ColorField label="Color" path="title.color" {...common} />
      </Section>

      <Section title="Price">
        <NumberField label="Price size" path="price.size" min={10} max={28} responsive={bp} {...common} />
        <Choice label="Price weight" path="price.weight" options={WEIGHTS} {...common} />
        <ColorField label="Price color" path="price.color" {...common} />
        <NumberField label="Original price size" path="price.originalSize" min={9} max={20} responsive={bp} {...common} />
        <ColorField label="Original price color" path="price.originalColor" {...common} />
      </Section>

      <Section title="Add to Cart button">
        <Toggle
          label="Show Add to Cart"
          path="show.addToCart"
          hint="Adds the variant the card shows (the price on the card) with the real cart; shoppers must be signed in. If that variant is sold out the button is disabled; cards without variant data open the product page."
          {...common}
        />
        <TextField
          label="Button label"
          path="addToCart.label"
          placeholder={DEFAULT_ADD_TO_CART_LABEL}
          maxLength={ADD_TO_CART_LABEL_MAX}
          hint={`Up to ${ADD_TO_CART_LABEL_MAX} characters: letters, numbers, spaces and . , ' & ! + -`}
          {...common}
        />
        <Choice label="Style" path="addToCart.variant" options={[{ value: "filled", label: "Filled" }, { value: "outline", label: "Outline" }] as const} {...common} />
        <Choice label="Size" path="addToCart.size" options={[{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }] as const} {...common} />
        <NumberField label="Corner radius" path="addToCart.radius" min={0} max={16} {...common} />
        <ColorField label="Button color" path="addToCart.background" {...common} />
        <ColorField label="Text color" path="addToCart.text" {...common} />
      </Section>

      <GridSection {...props} />

      <Section title="Discount badge">
        <Choice
          label="Position"
          path="discountBadge.position"
          options={[
            { value: "besidePrice", label: "Beside price" },
            { value: "imageTopLeft", label: "Image top left" },
            { value: "imageTopRight", label: "Image top right" },
          ] as const}
          {...common}
        />
        <NumberField label="Corner radius" path="discountBadge.radius" min={0} max={12} {...common} />
        <ColorField label="Background" path="discountBadge.background" {...common} />
        <ColorField label="Text color" path="discountBadge.text" {...common} />
      </Section>
    </div>
  );
}

// ── Product Grid Layout ─────────────────────────────────────────────────────

const COLUMN_OPTIONS = {
  mobile: [{ value: 1, label: "1" }, { value: 2, label: "2" }],
  tablet: [{ value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }],
  desktop: [{ value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }, { value: 6, label: "6" }],
} as const;

function GridSection(props: ControlsProps) {
  const { config, breakpoint: bp } = props;
  const common = { config, fieldErrors: props.fieldErrors, disabled: props.disabled, onChange: props.onChange };
  const grid = config.grid;
  const rangeText = (b: "tablet" | "desktop") => {
    if (!grid) return null;
    const r = renderedColumnRange(grid, b);
    return r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`;
  };
  return (
    <Section title="Product Grid Layout">
      <p className="pt-2 text-xs text-gray-500">
        Cards per row on <b>category pages</b> and <b>All Products</b>. Homepage sections, vendor storefronts, campaigns and related products keep
        their own layouts.
      </p>
      <Row
        label="Custom grid"
        hint={grid ? "Turn off to go back to the built-in grid." : "Off: the built-in grid (2 → 3 → 4 → 5 → 6 cards per row as screens get wider)."}
      >
        <Switch
          checked={!!grid}
          disabled={props.disabled}
          aria-label="Custom grid"
          onCheckedChange={(on) => props.onChange("grid", on ? defaultListingGrid() : undefined)}
        />
      </Row>
      {grid && (
        <>
          <Choice label="Mobile — cards per row" path="grid.columns.mobile" options={COLUMN_OPTIONS.mobile} hint="Under 768px. Used exactly." {...common} />
          <Choice
            label="Tablet — up to cards per row"
            path="grid.columns.tablet"
            options={COLUMN_OPTIONS.tablet}
            hint={<>768–1023px. Shown: {rangeText("tablet")} per row (columns are dropped if cards would be under 130px).</>}
            {...common}
          />
          <Choice
            label="Desktop — up to cards per row"
            path="grid.columns.desktop"
            options={COLUMN_OPTIONS.desktop}
            hint={<>1024px and wider. Shown: {rangeText("desktop")} per row on 1024–1440px screens (more room → up to the maximum).</>}
            {...common}
          />
          <NumberField label="Horizontal gap" path="grid.gapX" min={0} max={24} responsive={bp} {...common} />
          <NumberField label="Vertical gap" path="grid.gapY" min={0} max={24} responsive={bp} {...common} />
        </>
      )}
    </Section>
  );
}
