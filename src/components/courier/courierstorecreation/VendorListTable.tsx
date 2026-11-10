"use client";

import { useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  Ban,
  XCircle,
} from "lucide-react";
import type { Vendor } from "@/features/vendorManageApi";
import type { VendorRow } from "@/types/courier-store";

/* ─── shared small bits (same visual language as Bank page) ─────────────── */

function FilterInput({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 260 }}>
      <div
        style={{
          position: "absolute",
          left: 9,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#94A3B8",
          display: "flex",
        }}
      >
        {icon}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "7px 10px 7px 30px",
          borderRadius: 8,
          border: "1.5px solid #E2E8F0",
          fontSize: 12.5,
          fontFamily: "inherit",
          outline: "none",
          background: "#fff",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

const STATUS_BADGE: Record<
  string,
  { label: string; bg: string; color: string; border: string; icon: React.ReactNode }
> = {
  ACTIVE: {
    label: "Active",
    bg: "#F0F9F0",
    color: "#16A34A",
    border: "#BBF7D0",
    icon: <CheckCircle2 size={11} />,
  },
  PENDING: {
    label: "Pending",
    bg: "#FFFBEB",
    color: "#B45309",
    border: "#FDE68A",
    icon: <Clock size={11} />,
  },
  SUSPENDED: {
    label: "Suspended",
    bg: "#FEF2F2",
    color: "#DC2626",
    border: "#FECACA",
    icon: <Ban size={11} />,
  },
  DEACTIVATED: {
    label: "Deactivated",
    bg: "#F1F5F9",
    color: "#64748B",
    border: "#E2E8F0",
    icon: <XCircle size={11} />,
  },
};

/* ─── main component ─────────────────────────────────────────────────────── */

interface Props {
  vendors: Vendor[];
  isLoading: boolean;
  onCreateStore: (vendor: VendorRow) => void;
}

export function VendorListTable({ vendors, isLoading, onCreateStore }: Props) {
  const [search, setSearch] = useState("");

  const filtered = vendors.filter(
    (v) =>
      v.storeName.toLowerCase().includes(search.toLowerCase()) ||
      v.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.user?.phone?.includes(search)
  );

  return (
    <div style={{ padding: 14 }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#0D1B2E",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Users size={15} color="#1D4ED8" />
            Vendors
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 20,
                background: "#EEF3FB",
                color: "#1D4ED8",
              }}
            >
              {vendors.length}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 2 }}>
            Tap "Create Store" on any vendor to register a pickup location
          </div>
        </div>

        <FilterInput
          icon={<Search size={13} />}
          placeholder="Search vendors…"
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5EAF2",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "#FAFBFD", borderBottom: "1px solid #E5EAF2" }}>
                {["Vendor", "Contact", "Status", "Orders", ""].map((h, i) => (
                  <th
                    key={`${h}-${i}`}
                    style={{
                      textAlign: i === 4 ? "right" : "left",
                      padding: "9px 12px",
                      fontWeight: 700,
                      color: "#64748B",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: "center" }}>
                    <RefreshCw
                      size={16}
                      color="#94A3B8"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 28,
                      textAlign: "center",
                      color: "#9BAABB",
                      fontSize: 12.5,
                    }}
                  >
                    {search ? `No vendors matching "${search}"` : "No vendors found."}
                  </td>
                </tr>
              ) : (
                filtered.map((vendor) => {
                  const statusInfo = STATUS_BADGE[vendor.status] || STATUS_BADGE.PENDING;
                  return (
                    <tr
                      key={vendor.id}
                      style={{ borderBottom: "1px solid #F0F4FA", transition: "background 0.12s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFD")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Vendor */}
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              background: "#EEF3FB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#1D4ED8",
                            }}
                          >
                            {vendor.storeName?.[0]?.toUpperCase() || "V"}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "#0D1B2E",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 180,
                              }}
                            >
                              {vendor.storeName}
                            </div>
                            <div style={{ fontSize: 10.5, color: "#9BAABB" }}>
                              #{vendor.id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: "9px 12px", color: "#334155" }}>
                        {vendor.user?.email && (
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 170,
                            }}
                          >
                            {vendor.user.email}
                          </div>
                        )}
                        {vendor.user?.phone && (
                          <div style={{ color: "#94A3B8", fontSize: 11.5 }}>
                            {vendor.user.phone}
                          </div>
                        )}
                        {!vendor.user?.email && !vendor.user?.phone && "—"}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "9px 12px" }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.border}`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Orders */}
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: "#334155" }}>
                        {vendor._count?.orders ?? 0}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "9px 12px", textAlign: "right" }}>
                        <button
                          onClick={() =>
                            onCreateStore({
                              id: vendor.id,
                              storeName: vendor.storeName,
                              email: vendor.user?.email,
                              phone: vendor.user?.phone,
                              status: vendor.status,
                            })
                          }
                          style={{
                            border: "1.5px solid #DBEAFE",
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "4px 9px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            whiteSpace: "nowrap",
                            fontFamily: "inherit",
                          }}
                        >
                          <Plus size={11} /> Create Store
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}