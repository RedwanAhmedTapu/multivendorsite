// src/components/hrm/HrmPlaceholder.tsx
//
// Placeholder body for /hrm sections that arrive in later phases. Uses the
// HRM workspace card language (white card, #E5EAF2 border, soft shadow) and
// never shows invented data.

"use client";

import { Construction } from "lucide-react";

export function HrmPlaceholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="hrm-page-title">{title}</h1>
      <p className="hrm-page-subtitle">{subtitle}</p>
      <div className="hrm-card" style={{ padding: 48, textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Construction size={24} style={{ color: "#059669" }} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0D1B2E", margin: 0 }}>
          Coming in the next phase
        </p>
        <p style={{ fontSize: 12.5, color: "#7A90AB", marginTop: 6 }}>
          This section is part of the approved HRM roadmap and will reuse the
          existing FinixMart HR APIs — nothing is hardcoded here.
        </p>
      </div>
    </div>
  );
}
