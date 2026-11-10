// src/othersfeatures/hrm/components/employee360/ProfileFieldGrid.tsx
//
// Read-only label/value grid used by the Overview / Personal / Employment
// tabs of the Employee 360 page. Responsive: 2 columns, collapses to 1
// under 640px (the grid is used inside ProductForm-style SectionCards).

export interface ProfileField {
  label: string;
  value?: string | number | null | undefined;
  /** Render raw ReactNode instead of the string value (e.g. a badge). */
  render?: React.ReactNode;
  /** Span both grid columns (long text like addresses). */
  wide?: boolean;
}

export function ProfileFieldGrid({ fields }: { fields: ProfileField[] }) {
  return (
    <div
      className="emp360-field-grid"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 24, rowGap: 12 }}
    >
      {fields.map((f) => (
        <div key={f.label} style={f.wide ? { gridColumn: "1 / -1" } : undefined}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#9BAABB" }}>
            {f.label}
          </div>
          <div style={{ fontSize: 13, color: "#0D1B2E", marginTop: 2 }}>
            {f.render ?? (f.value === null || f.value === undefined || f.value === "" ? "—" : f.value)}
          </div>
        </div>
      ))}
      <style>{`@media (max-width: 640px) { .emp360-field-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
