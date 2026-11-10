// src/othersfeatures/hrm/components/employee360/EmployeeStatusBadge.tsx
//
// Employee status pill using the ProductForm badge language (soft
// background / strong text / matching border) — same tokens as the
// Required/Optional pills in ui/section-card.tsx.

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: "#F0F9F0", text: "#16A34A", border: "#BBF7D0" },
  PROBATION: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  ON_LEAVE: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  SUSPENDED: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  RESIGNED: { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" },
  TERMINATED: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  RETIRED: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  INACTIVE: { bg: "#F8FAFC", text: "#94A3B8", border: "#E2E8F0" },
};

export function EmployeeStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 9px",
        borderRadius: 20,
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
