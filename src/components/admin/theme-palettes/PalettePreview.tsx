"use client";

// components/admin/theme-palettes/PalettePreview.tsx
//
// Scoped live preview for the palette editor. The draft token map is mapped
// to CSS variables with the Part-1 pure mapper and applied INLINE on this
// container only ([data-palette-preview]) — never on :root — so editing a
// palette can never leak into the real admin UI or the live site. The sample
// widgets reference the variables directly, which mirrors exactly what a
// themed surface will see at runtime.
import { useMemo, type CSSProperties } from "react";
import type { PaletteTokens } from "@/lib/palette/tokens";
import { paletteToCssVars } from "@/lib/palette/css";
import { resolvedForDisplay } from "@/lib/palette/editor";

export function PalettePreview(props: { tokens: PaletteTokens; darkTokens?: PaletteTokens | null; mode: "light" | "dark" }) {
  // Missing or mid-edit invalid values fall back to the Neutral production
  // defaults so the preview stays well-formed (validation flags the gap).
  const style = useMemo(() => {
    const resolved = resolvedForDisplay(props.tokens, props.mode === "dark" ? props.darkTokens : null);
    return Object.fromEntries(paletteToCssVars(resolved)) as CSSProperties;
  }, [props.tokens, props.darkTokens, props.mode]);

  return (
    <div
      data-palette-preview=""
      data-mode={props.mode}
      style={style}
      className="overflow-hidden rounded-lg border border-gray-200"
      aria-label="Palette preview"
    >
      <div style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }} className="p-4">
        {/* app bar */}
        <div
          className="flex items-center justify-between rounded-md px-3 py-2"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <span className="text-sm font-semibold">FinixMart</span>
          <span className="text-xs opacity-80">Preview · {props.mode}</span>
        </div>

        {/* buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          <PreviewButton label="Primary" background="var(--primary)" color="var(--primary-foreground)" />
          <PreviewButton label="Hover" background="var(--primary-hover)" color="var(--primary-foreground)" />
          <PreviewButton label="Secondary" background="var(--secondary)" color="var(--secondary-foreground)" />
          <PreviewButton label="Accent" background="var(--accent)" color="var(--accent-foreground)" />
          <PreviewButton label="Outline" background="transparent" color="var(--foreground)" border="var(--border-strong)" />
        </div>

        {/* card */}
        <div
          className="mt-3 rounded-md p-3"
          style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Product card
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
            Secondary text on a raised card surface with the default border.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value="Form field"
              aria-label="Preview input"
              className="h-7 w-32 rounded border px-2 text-xs outline-none"
              style={{
                backgroundColor: "var(--input)",
                borderColor: "var(--border-strong)",
                color: "var(--foreground)",
              }}
            />
            <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary-dark)" }}>
              Primary tint
            </span>
          </div>
        </div>

        {/* status badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge label="Success" background="var(--success)" color="var(--success-foreground)" />
          <StatusBadge label="Warning" background="var(--warning)" color="var(--warning-foreground)" />
          <StatusBadge label="Danger" background="var(--destructive)" color="var(--destructive-foreground)" />
          <StatusBadge label="Info" background="var(--info)" color="var(--info-foreground)" />
        </div>

        {/* surfaces + charts */}
        <div className="mt-3 flex items-center gap-3">
          <div
            className="flex-1 rounded-md p-2 text-xs"
            style={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)" }}
          >
            Popover surface
          </div>
          <div className="flex items-end gap-1" aria-hidden="true">
            {["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"].map((color, i) => (
              <span key={i} className="w-3 rounded-sm" style={{ backgroundColor: color, height: `${10 + i * 6}px` }} />
            ))}
          </div>
        </div>

        {/* sidebar strip */}
        <div
          className="mt-3 flex items-center justify-between rounded-md px-3 py-2 text-xs"
          style={{ backgroundColor: "var(--sidebar)", color: "var(--sidebar-foreground)", border: "1px solid var(--sidebar-border)" }}
        >
          <span>Sidebar</span>
          <span className="rounded px-2 py-0.5" style={{ backgroundColor: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }}>
            Active item
          </span>
        </div>

        {/* focus ring */}
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span
            aria-hidden="true"
            className="inline-block h-5 w-5 rounded"
            style={{ backgroundColor: "var(--accent)", boxShadow: "0 0 0 3px var(--ring)" }}
          />
          Focus ring around an accent element
        </div>
      </div>
    </div>
  );
}

function PreviewButton(props: { label: string; background: string; color: string; border?: string }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="rounded-md px-3 py-1.5 text-xs font-medium"
      style={{
        backgroundColor: props.background,
        color: props.color,
        border: props.border ? `1px solid ${props.border}` : "none",
      }}
    >
      {props.label}
    </button>
  );
}

function StatusBadge(props: { label: string; background: string; color: string }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: props.background, color: props.color }}>
      {props.label}
    </span>
  );
}
