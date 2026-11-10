// src/app/admin-dashboard/@main/settings/banks/[bankId]/page.tsx
"use client";
import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetBranchesByBankQuery, useGetBanksQuery } from "@/features/bankApi";
import {
  ArrowLeft,
  Landmark,
  Loader2,
  Search,
  CreditCard,
  Building2,
  CalendarDays,
} from "lucide-react";

/* ─── Compact stat chip ──────────────────────────────────────────────────── */
function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        padding: "6px 12px",
        borderRadius: 8,
        background: "rgba(255,255,255,0.12)",
      }}
    >
      <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function BankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: banksResponse, isLoading: isBankLoading } = useGetBanksQuery();
  const bank = banksResponse?.data?.find((b) => b.id === bankId);

  const { data: branchesResponse, isLoading: isBranchesLoading } =
    useGetBranchesByBankQuery(bankId, { skip: !bankId });
  const branches = branchesResponse?.data ?? [];

  const filteredBranches = useMemo(() => {
    if (!search.trim()) return branches;
    const q = search.trim().toLowerCase();
    return branches.filter(
      (b) =>
        b.branchName.toLowerCase().includes(q) ||
        (b.routingNumber ?? "").toLowerCase().includes(q)
    );
  }, [branches, search]);

  const isLoading = isBankLoading || isBranchesLoading;
  const activeCount = branches.filter((b) => b.isActive).length;
  const withRoutingCount = branches.filter((b) => !!b.routingNumber).length;

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
        padding: "18px 20px",
      }}
    >
      <div style={{ width: "100%" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: "none",
            background: "none",
            color: "#1D4ED8",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
            padding: 0,
          }}
        >
          <ArrowLeft size={14} />
          Back to list
        </button>

        {isLoading && !bank ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 40,
              textAlign: "center",
              border: "1px solid #E5EAF2",
            }}
          >
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : !bank ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 40,
              textAlign: "center",
              color: "#9BAABB",
              border: "1px solid #E5EAF2",
            }}
          >
            Bank not found
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              border: "1px solid #E5EAF2",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {/* ── Compact bank header ── */}
            <div
              style={{
                padding: "14px 18px",
                background: "linear-gradient(135deg,#1D4ED8,#7C3AED)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Landmark size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.2 }}>{bank.name}</div>
                  <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 1 }}>
                    {bank.code ? `Code: ${bank.code}` : "No bank code"}
                    {bank.swiftCode ? ` · SWIFT: ${bank.swiftCode}` : ""}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <StatChip label="Total Branches" value={branches.length} />
                <StatChip label="Active" value={activeCount} />
                <StatChip label="With Routing No." value={withRoutingCount} />
              </div>
            </div>

            {/* ── Search within branches ── */}
            <div
              style={{
                padding: "10px 18px",
                borderBottom: "1px solid #E5EAF2",
                background: "#FAFBFD",
              }}
            >
              <div style={{ position: "relative", maxWidth: 320 }}>
                <Search
                  size={13}
                  color="#94A3B8"
                  style={{
                    position: "absolute",
                    left: 9,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search branch name or routing no…"
                  style={{
                    width: "100%",
                    padding: "6px 10px 6px 28px",
                    borderRadius: 7,
                    border: "1.5px solid #E2E8F0",
                    fontSize: 12,
                    fontFamily: "inherit",
                    outline: "none",
                    background: "#fff",
                  }}
                />
              </div>
            </div>

            {/* ── Compact full-width branch table ── */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: "#FAFBFD", borderBottom: "1px solid #E5EAF2" }}>
                    <th style={thStyle}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Building2 size={11} /> Branch
                      </span>
                    </th>
                    <th style={thStyle}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <CreditCard size={11} /> Routing No.
                      </span>
                    </th>
                    <th style={thStyle}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <CalendarDays size={11} /> Created
                      </span>
                    </th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isBranchesLoading ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 28, textAlign: "center" }}>
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      </td>
                    </tr>
                  ) : filteredBranches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: 28,
                          textAlign: "center",
                          color: "#9BAABB",
                          fontSize: 12.5,
                        }}
                      >
                        {search ? "No branches match your search" : "No branches added for this bank yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((b) => (
                      <tr
                        key={b.id}
                        style={{
                          borderBottom: "1px solid #F0F4FA",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFD")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#0D1B2E" }}>
                          {b.branchName}
                        </td>
                        <td style={tdStyle}>{b.routingNumber || "—"}</td>
                        <td style={{ ...tdStyle, color: "#64748B" }}>{formatDate(b.createdAt)}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: b.isActive ? "#F0F9F0" : "#FEF2F2",
                              color: b.isActive ? "#16A34A" : "#DC2626",
                              border: `1px solid ${b.isActive ? "#BBF7D0" : "#FECACA"}`,
                            }}
                          >
                            {b.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Footer count ── */}
            {filteredBranches.length > 0 && (
              <div
                style={{
                  padding: "8px 18px",
                  borderTop: "1px solid #E5EAF2",
                  fontSize: 11,
                  color: "#9BAABB",
                }}
              >
                Showing {filteredBranches.length} of {branches.length} branch
                {branches.length === 1 ? "" : "es"}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 14px",
  fontWeight: 700,
  color: "#64748B",
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 14px",
  whiteSpace: "nowrap",
};