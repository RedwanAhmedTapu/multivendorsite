"use client";
import React, { useState } from "react";
import {
  useGetAllBrandsQuery,
  useApproveBrandMutation,
  useRejectBrandMutation,
} from "@/features/brandApi";
import type { Brand, BrandStatus } from "@/types/brand";
import { StatusBadge } from "@/components/brand/BrandformShared";
import BrandDetailsModal from "@/components/brand/BranddetailsModal";
import { Eye, Check, XCircle, Loader2, Inbox, Search, ShieldCheck } from "lucide-react";

const STATUS_TABS: { label: string; value: BrandStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function AdminBrandsPage() {
  const [statusTab, setStatusTab] = useState<BrandStatus | "ALL">("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetAllBrandsQuery({
    status: statusTab === "ALL" ? undefined : statusTab,
    search: search || undefined,
    page,
    limit: 15,
  });

  const [approveBrand, { isLoading: isApproving }] = useApproveBrandMutation();
  const [rejectBrand, { isLoading: isRejecting }] = useRejectBrandMutation();

  const brands = data?.brands ?? [];
  const pagination = data?.pagination;

  const quickApprove = async (brand: Brand) => {
    try {
      await approveBrand(brand.id).unwrap();
    } catch (err: any) {
      alert(`❌ ${err?.data?.message || "Failed to approve brand"}`);
    }
  };

  const quickReject = async (brand: Brand) => {
    const reason = prompt(`Reason for rejecting "${brand.name}" (optional):`) ?? undefined;
    try {
      await rejectBrand({ id: brand.id, reason }).unwrap();
    } catch (err: any) {
      alert(`❌ ${err?.data?.message || "Failed to reject brand"}`);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 18px" }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 19, fontWeight: 800, color: "#0D1B2E", margin: 0 }}>
            Brand Approvals
          </h1>
          <p style={{ fontSize: 12, color: "#7A90AB", margin: "3px 0 0" }}>
            Review brand registrations submitted by vendors
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusTab(tab.value);
                  setPage(1);
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${statusTab === tab.value ? "#1D4ED8" : "#E5EAF2"}`,
                  background: statusTab === tab.value ? "#EFF6FF" : "#fff",
                  color: statusTab === tab.value ? "#1D4ED8" : "#64748B",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", minWidth: 240 }}>
            <Search
              size={14}
              color="#94A3B8"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search brand name…"
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                fontSize: 12.5,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 size={22} color="#1D4ED8" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : brands.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #E5EAF2",
              borderRadius: 14,
              padding: "48px 20px",
              textAlign: "center",
            }}
          >
            <Inbox size={30} color="#CBD5E1" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: "#3D5068", margin: 0 }}>
              Nothing here
            </p>
            <p style={{ fontSize: 12, color: "#9BAABB", marginTop: 4 }}>
              No brands match this filter right now.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #E5EAF2",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {/* Desktop table header */}
            <div
              className="brand-table-header"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.3fr 1fr 1fr 1.2fr",
                gap: 10,
                padding: "10px 16px",
                background: "#FAFBFD",
                borderBottom: "1px solid #F0F4FA",
                fontSize: 10.5,
                fontWeight: 700,
                color: "#9BAABB",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <span>Brand</span>
              <span>Vendor</span>
              <span>Relationship</span>
              <span>Status</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {brands.map((brand) => (
              <div
                key={brand.id}
                className="brand-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.3fr 1fr 1fr 1.2fr",
                  gap: 10,
                  padding: "12px 16px",
                  borderBottom: "1px solid #F0F4FA",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "#EEF3FB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={14} color="#1D4ED8" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {brand.name}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#3D5068", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {brand.vendor?.storeName ?? "—"}
                </span>
                <span style={{ fontSize: 11.5, color: "#64748B" }}>
                  {brand.relationship.replaceAll("_", " ")}
                </span>
                <span>
                  <StatusBadge status={brand.status} />
                </span>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setSelectedBrand(brand)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 10px",
                      borderRadius: 7,
                      border: "1.5px solid #E5EAF2",
                      background: "#fff",
                      color: "#3D5068",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <Eye size={12} /> View
                  </button>
                  {brand.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => quickApprove(brand)}
                        disabled={isApproving}
                        title="Approve"
                        style={{
                          padding: "6px 8px",
                          borderRadius: 7,
                          border: "1.5px solid #BBF7D0",
                          background: "#F0FDF4",
                          color: "#16A34A",
                          cursor: "pointer",
                        }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => quickReject(brand)}
                        disabled={isRejecting}
                        title="Reject"
                        style={{
                          padding: "6px 8px",
                          borderRadius: 7,
                          border: "1.5px solid #FECACA",
                          background: "#FEF2F2",
                          color: "#DC2626",
                          cursor: "pointer",
                        }}
                      >
                        <XCircle size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 18 }}>
            <button
              disabled={!pagination.hasPrev || isFetching}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1.5px solid #E5EAF2",
                background: "#fff",
                fontSize: 12,
                fontWeight: 600,
                color: pagination.hasPrev ? "#3D5068" : "#CBD5E1",
                cursor: pagination.hasPrev ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: 12, color: "#64748B", alignSelf: "center" }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={!pagination.hasNext || isFetching}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1.5px solid #E5EAF2",
                background: "#fff",
                fontSize: 12,
                fontWeight: 600,
                color: pagination.hasNext ? "#3D5068" : "#CBD5E1",
                cursor: pagination.hasNext ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <BrandDetailsModal
        open={!!selectedBrand}
        brand={selectedBrand}
        onClose={() => setSelectedBrand(null)}
        onActioned={() => {
          setSelectedBrand(null);
          refetch();
        }}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 800px) {
          .brand-table-header { display: none !important; }
          .brand-row {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }
        }
      `}</style>
    </div>
  );
}