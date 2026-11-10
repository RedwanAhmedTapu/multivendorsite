"use client";

// components/admin/theme-palettes/TokenField.tsx
//
// One semantic-token row in the palette editor: swatch, text input (accepts
// hex / rgb(a) / hsl(a) / oklch — the values the Part-1 validator allows),
// a native color picker when the current value is a plain hex color, and an
// optional "inherit" reset for tokens that may fall back to their derived
// default (companions, or any dark-mode override).
import { Check, RotateCcw } from "lucide-react";
import { isValidColorValue, type SemanticToken } from "@/lib/palette/tokens";

const HEX_FULL = /^#[0-9a-fA-F]{6}$/;
const HEX_SHORT = /^#[0-9a-fA-F]{3}$/;
const HEX_ALPHA = /^#[0-9a-fA-F]{8}$/;

function toPickerHex(value: string): string | null {
  const trimmed = value.trim();
  if (HEX_FULL.test(trimmed)) return trimmed.toLowerCase();
  if (HEX_SHORT.test(trimmed)) {
    const [r, g, b] = [trimmed[1], trimmed[2], trimmed[3]];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null; // 8-digit hex carries alpha the picker cannot represent
}

export function TokenField(props: {
  token: SemanticToken;
  label: string;
  value: string;
  /** Shown dimmed inside the swatch area when the field is empty (derived default). */
  inheritedValue?: string;
  error?: string;
  disabled?: boolean;
  /** When provided, a reset control clears the value (inherit derived default). */
  onClear?: () => void;
  onChange: (token: SemanticToken, value: string) => void;
}) {
  const { token, value, error, disabled } = props;
  const trimmed = value.trim();
  const displayColor = trimmed !== "" && isValidColorValue(trimmed) ? trimmed : props.inheritedValue;
  const pickerHex = trimmed !== "" ? toPickerHex(trimmed) : null;
  const showInvalid = trimmed !== "" && !isValidColorValue(trimmed);
  const inputId = `token-${token}`;

  return (
    <div className="flex items-start gap-3 py-2">
      <span
        aria-hidden="true"
        className={`mt-0.5 h-8 w-8 shrink-0 rounded-md border border-gray-300 ${displayColor ? "" : "bg-gray-100"}`}
        style={displayColor ? { backgroundColor: displayColor } : undefined}
        title={displayColor ?? "Not set"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={inputId} className="text-xs font-medium text-gray-700">
            {props.label}
            <span className="ml-1.5 font-mono text-[10px] font-normal text-gray-400">{token}</span>
          </label>
          {props.onClear && trimmed !== "" && !disabled && (
            <button
              type="button"
              onClick={props.onClear}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600"
              title="Clear this override and inherit the derived default"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" /> Inherit
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <input
            id={inputId}
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => props.onChange(token, e.target.value)}
            placeholder={props.inheritedValue ?? "e.g. #4f46e5 or oklch(0.55 0.2 260)"}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={showInvalid || !!error}
            className={`h-8 w-full min-w-0 flex-1 rounded-md border bg-white px-2 font-mono text-xs text-gray-800 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
              showInvalid || error ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:border-indigo-400 focus:ring-indigo-100"
            }`}
          />
          {pickerHex !== null && !disabled && (
            <input
              type="color"
              value={pickerHex}
              onChange={(e) => props.onChange(token, e.target.value)}
              aria-label={`Pick ${props.label}`}
              className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-gray-300 bg-white p-0.5"
            />
          )}
        </div>
        {showInvalid && !error && (
          <p className="mt-1 text-[11px] text-red-600">Must be a CSS color (hex, rgb(a), hsl(a) or oklch).</p>
        )}
        {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
        {!error && !showInvalid && trimmed !== "" && isValidColorValue(trimmed) && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-teal-600">
            <Check className="h-3 w-3" aria-hidden="true" /> Valid color
          </p>
        )}
      </div>
    </div>
  );
}
