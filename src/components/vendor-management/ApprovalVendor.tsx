"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Search,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  PauseCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Store,
  Hash,
  Type,
} from "lucide-react";

import {
  useGetVendorsQuery,
  useUpdateVendorStatusMutation,
  useExportVendorsMutation,
} from "@/features/vendorManageApi";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type VendorStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
type SortField = "totalSales" | "createdAt" | null;
type SortOrder = "asc" | "desc";

interface Vendor {
  id: string;
  storeName: string;
  avatar?: string;
  status: VendorStatus;
  currentCommissionRate?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    isVerified: boolean;
  };
  performance?: {
    totalSales: number;
    totalOrders: number;
    fulfillmentRatePct: number;
    avgRating: number;
  };
  _count?: {
    products: number;
    orders: number;
    flags: number;
  };
}

/* ─── Design tokens (shared with AddProductForm) ────────────────────────── */

const PAGE_BG = "#F0F4FA";
const CARD_BORDER = "#E5EAF2";
const HEADER_BG = "#FAFBFD";
const TITLE = "#0D1B2E";
const SUBTLE = "#7A90AB";
const MUTED = "#9BAABB";
const BLUE = "#1D4ED8";
const PURPLE = "#7C3AED";

const STATUS_STYLE: Record<
  VendorStatus,
  { bg: string; border: string; fg: string; icon: React.ReactNode; label: string }
> = {
  PENDING: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    fg: "#92400E",
    icon: <AlertCircle size={12} />,
    label: "Pending",
  },
  ACTIVE: {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    fg: "#15803D",
    icon: <CheckCircle size={12} />,
    label: "Active",
  },
  SUSPENDED: {
    bg: "#FEF2F2",
    border: "#FECACA",
    fg: "#DC2626",
    icon: <PauseCircle size={12} />,
    label: "Suspended",
  },
  DEACTIVATED: {
    bg: "#F1F5F9",
    border: "#E2E8F0",
    fg: "#475569",
    icon: <XCircle size={12} />,
    label: "Deactivated",
  },
};
function StatusBadge({ status }: { status: VendorStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.DEACTIVATED;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

/* ─── Date formatter: "13 Sep, 2026" ────────────────────────────────────── */

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
}

/* ─── Table header cell — supports optional sorting ─────────────────────── */

function ColumnHeader({
  icon,
  name,
  type,
  width,
  sortable,
  active,
  order,
  onSort,
}: {
  icon: React.ReactNode;
  name: string;
  type: string;
  width?: string;
  sortable?: boolean;
  active?: boolean;
  order?: SortOrder;
  onSort?: () => void;
}) {
  return (
    <th
      onClick={sortable ? onSort : undefined}
      style={{
        textAlign: "left",
        padding: "10px 16px",
        borderBottom: `1.5px solid ${CARD_BORDER}`,
        borderRight: `1px solid #F0F4FA`,
        background: active ? "#EEF2FF" : HEADER_BG,
        width,
        userSelect: "none",
        cursor: sortable ? "pointer" : "default",
        transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: active ? BLUE : SUBTLE, display: "flex" }}>{icon}</span>
        <div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: active ? BLUE : TITLE,
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{type}</div>
        </div>
        {sortable ? (
          active ? (
            order === "asc" ? (
              <ChevronUp size={13} color={BLUE} style={{ marginLeft: "auto" }} />
            ) : (
              <ChevronDown size={13} color={BLUE} style={{ marginLeft: "auto" }} />
            )
          ) : (
            <ChevronsUpDown size={13} color="#C7D2E0" style={{ marginLeft: "auto" }} />
          )
        ) : (
          <ChevronDown size={13} color="#C7D2E0" style={{ marginLeft: "auto" }} />
        )}
      </div>
    </th>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

const ApprovalVendor: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const {
    data,
    isLoading: vendorsLoading,
    refetch,
  } = useGetVendorsQuery({
    search: searchTerm,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit: 10,
  });

  const [exportVendors, { isLoading: exporting }] = useExportVendorsMutation();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedVendors = useMemo(() => {
    const rows = data?.data ? [...data.data] : [];
    if (!sortField) return rows;

    rows.sort((a: Vendor, b: Vendor) => {
      let aVal: number;
      let bVal: number;

      if (sortField === "totalSales") {
        aVal = a.performance?.totalSales ?? 0;
        bVal = b.performance?.totalSales ?? 0;
      } else {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return rows;
  }, [data, sortField, sortOrder]);

  const handleExport = async () => {
    try {
      const result = await exportVendors({
        filters: {
          search: searchTerm,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
        fields: [
          "storeName",
          "email",
          "phone",
          "status",
          "totalSales",
          "createdAt",
        ],
      }).unwrap();

      // API response shape may vary — normalize to an array of rows
      const rawRows: any[] = Array.isArray(result)
        ? result
        : (result as any)?.data ?? [];

      const worksheetRows = rawRows.map((row: any) => ({
        "Store Name": row.storeName ?? "",
        "Email": row.email ?? row.user?.email ?? "",
        "Phone": row.phone ?? row.user?.phone ?? "",
        "Status": row.status ?? "",
        "Total Sales (৳)": row.totalSales ?? row.performance?.totalSales ?? 0,
        "Joined": row.createdAt ? formatDate(row.createdAt) : "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");

      // Auto width columns (rough estimate)
      worksheet["!cols"] = [
        { wch: 22 },
        { wch: 26 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
      ];

      XLSX.writeFile(
        workbook,
        `vendors-export-${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Failed to export vendors:", error);
    }
  };

  const goToVendorDetail = (vendorId: string) => {
    router.push(`/admin-dashboard/vendormanage/vendor-approval/${vendorId}`);
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: PAGE_BG,
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* ══════════════ FILTER CARD (top) ══════════════ */}
        <div
          style={{
            background: "#fff",
            border: `1.5px solid ${CARD_BORDER}`,
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "16px 20px",
              borderBottom: `1px solid #F0F4FA`,
              background: HEADER_BG,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: "#EEF3FB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Store size={16} color={BLUE} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: TITLE }}>
                  Vendor Management
                </div>
                <div style={{ fontSize: 11.5, color: SUBTLE, marginTop: 1 }}>
                  Review vendors, verify documents, and manage account status
                </div>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={vendorsLoading || exporting}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#1D4ED8,#7C3AED)",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: vendorsLoading || exporting ? "not-allowed" : "pointer",
                opacity: vendorsLoading || exporting ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(124,58,237,0.25)",
              }}
            >
              <Download size={13} />
              {exporting ? "Exporting…" : "Export to Excel"}
            </button>
          </div>

          {/* Filters row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              padding: "14px 20px",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 260px" }}>
              <Search
                size={14}
                color="#94A3B8"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="search"
                placeholder="Search by store name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  fontSize: 13,
                  borderRadius: 9,
                  border: `1.5px solid ${CARD_BORDER}`,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as VendorStatus | "all")
                }
                style={{
                  appearance: "none",
                  padding: "9px 32px 9px 34px",
                  fontSize: 13,
                  borderRadius: 9,
                  border: `1.5px solid ${CARD_BORDER}`,
                  background: "#fff",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  color: TITLE,
                }}
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
              <Filter
                size={14}
                color="#94A3B8"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>

            <button
              onClick={() => refetch()}
              style={{
                padding: "9px 16px",
                borderRadius: 9,
                border: `1.5px solid ${CARD_BORDER}`,
                background: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#475569",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
            >
              <RefreshCw
                size={13}
                className={vendorsLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ══════════════ TABLE CARD (bottom) ══════════════ */}
        <div
          style={{
            background: "#fff",
            border: `1.5px solid ${CARD_BORDER}`,
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {vendorsLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 220,
                color: SUBTLE,
                gap: 8,
              }}
            >
              <RefreshCw size={18} className="animate-spin" />
              Loading vendors…
            </div>
          ) : data?.data.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                color: SUBTLE,
              }}
            >
              No vendors found matching your criteria.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <ColumnHeader
                      icon={<Store size={13} />}
                      name="Store"
                      type="text"
                    />
                    <ColumnHeader
                      icon={<Mail size={13} />}
                      name="Contact"
                      type="email · phone"
                    />
                    <ColumnHeader
                      icon={<Hash size={13} />}
                      name="Status"
                      type="enum"
                      width="130"
                    />
                    <ColumnHeader
                      icon={<span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}>৳</span>}
                      name="Sales"
                      type="number"
                      width="140"
                      sortable
                      active={sortField === "totalSales"}
                      order={sortOrder}
                      onSort={() => handleSort("totalSales")}
                    />
                    <ColumnHeader
                      icon={<Calendar size={13} />}
                      name="Joined"
                      type="date"
                      width="150"
                      sortable
                      active={sortField === "createdAt"}
                      order={sortOrder}
                      onSort={() => handleSort("createdAt")}
                    />
                    <ColumnHeader
                      icon={<Type size={13} />}
                      name="Action"
                      type="—"
                      width="100"
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedVendors.map((vendor: Vendor, i: number) => (
                    <tr
                      key={vendor.id}
                      style={{
                        background: i % 2 === 0 ? "#fff" : "#FCFDFE",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F5F8FF")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          i % 2 === 0 ? "#fff" : "#FCFDFE")
                      }
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid #F0F4FA`,
                          borderRight: `1px solid #F7F9FC`,
                          fontSize: 13,
                          fontWeight: 600,
                          color: TITLE,
                        }}
                      >
                        {vendor.storeName}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid #F0F4FA`,
                          borderRight: `1px solid #F7F9FC`,
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ color: "#334155" }}>
                          {vendor.user?.email || "—"}
                        </div>
                        <div
                          style={{ color: MUTED, fontSize: 11, marginTop: 1 }}
                        >
                          {vendor.user?.phone || "—"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid #F0F4FA`,
                          borderRight: `1px solid #F7F9FC`,
                        }}
                      >
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid #F0F4FA`,
                          borderRight: `1px solid #F7F9FC`,
                          fontSize: 13,
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        ৳{vendor.performance?.totalSales?.toLocaleString() || 0}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid #F0F4FA`,
                          borderRight: `1px solid #F7F9FC`,
                          fontSize: 12.5,
                          color: "#475569",
                        }}
                      >
                        {formatDate(vendor.createdAt)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid #F0F4FA`,
                        }}
                      >
                        <button
                          onClick={() => goToVendorDetail(vendor.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: `1.5px solid #C7D2FE`,
                            background: "#EEF2FF",
                            color: BLUE,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <Eye size={13} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.pages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderTop: `1px solid #F0F4FA`,
              }}
            >
              <div style={{ fontSize: 12, color: SUBTLE }}>
                Showing {data.data.length} of {data.pagination.total} vendors
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${CARD_BORDER}`,
                    background: "#fff",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: page === 1 ? MUTED : "#334155",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Previous
                </button>
                <button
                  disabled={page >= data.pagination.pages}
                  onClick={() =>
                    setPage((p) => Math.min(data.pagination.pages, p + 1))
                  }
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${CARD_BORDER}`,
                    background: "#fff",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: page >= data.pagination.pages ? MUTED : "#334155",
                    cursor:
                      page >= data.pagination.pages ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .animate-spin { animation: fm-spin 1s linear infinite; }
        @keyframes fm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ApprovalVendor;