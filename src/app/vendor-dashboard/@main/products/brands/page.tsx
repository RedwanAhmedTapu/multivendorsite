"use client";
import React, { useState, useRef, useCallback } from "react";
import {
  useGetMyBrandsQuery,
  useDeleteBrandMutation,
} from "@/features/brandApi";
import type { Brand, BrandStatus } from "@/types/brand";
import { StatusBadge } from "@/components/brand/BrandformShared";
import BrandForm from "@/components/brand/BrandForm";
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Loader2,
  Inbox,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS: { label: string; value: BrandStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function VendorBrandsPage() {
  const [statusTab, setStatusTab] = useState<BrandStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching, refetch } = useGetMyBrandsQuery({
    status: statusTab === "ALL" ? undefined : statusTab,
    search: search || undefined,
    page,
    limit: 10,
  });

  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();

  const brands = data?.brands ?? [];
  const pagination = data?.pagination;

  const scrollToForm = useCallback(() => {
    // Small delay so the DOM has rendered the form before scrolling
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 60);
  }, []);

  const openCreate = () => {
    setEditingBrand(null);
    setShowForm(true);
    scrollToForm();
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setShowForm(true);
    scrollToForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBrand(null);
  };

  const handleFormSuccess = () => {
    closeForm();
    refetch();
  };

  const handleDelete = (brand: Brand) => {
    toast.error(`Delete "${brand.name}"?`, {
      description: "This action cannot be undone.",
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteBrand(brand.id).unwrap();
            toast.success(`"${brand.name}" has been deleted`);
          } catch (err: any) {
            toast.error(
              err?.data?.message || err?.message || "Failed to delete brand"
            );
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 18px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: "#0D1B2E",
                margin: 0,
              }}
            >
              My Brands
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "#7A90AB",
                margin: "3px 0 0",
              }}
            >
              Register and manage the brands you sell under
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 9,
              border: "none",
              background: "linear-gradient(135deg,#1D4ED8,#0891B2)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus size={15} /> Register Brand
          </button>
        </div>

        {/* ── Inline Brand Form ── */}
        {showForm && (
          <div ref={formRef} style={{ marginBottom: 18, scrollMarginTop: 12 }}>
            <div
              style={{
                background: "#fff",
                border: "1.5px solid #E5EAF2",
                borderRadius: 14,
                padding: "20px 22px 22px",
                position: "relative",
                boxShadow: "0 4px 24px rgba(29,78,216,0.06)",
              }}
            >
              {/* Close button */}
              <button
                onClick={closeForm}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "1.5px solid #E5EAF2",
                  background: "#F8FAFC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748B",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#FEE2E2";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#FECACA";
                  (e.currentTarget as HTMLButtonElement).style.color = "#DC2626";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#F8FAFC";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#E5EAF2";
                  (e.currentTarget as HTMLButtonElement).style.color = "#64748B";
                }}
              >
                <X size={14} />
              </button>

              {/* Form title */}
              <div style={{ marginBottom: 16, paddingRight: 36 }}>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#0D1B2E",
                    margin: 0,
                  }}
                >
                  {editingBrand
                    ? `Edit "${editingBrand.name}"`
                    : "Register a New Brand"}
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "#7A90AB",
                    margin: "3px 0 0",
                  }}
                >
                  {editingBrand
                    ? "Update the brand details below and submit for re-review"
                    : "Fill in the details below to register your brand"}
                </p>
              </div>

              <BrandForm
                brand={editingBrand}
                onSuccess={handleFormSuccess}
                onCancel={closeForm}
              />
            </div>
          </div>
        )}

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
                  border: `1.5px solid ${
                    statusTab === tab.value ? "#1D4ED8" : "#E5EAF2"
                  }`,
                  background:
                    statusTab === tab.value ? "#EFF6FF" : "#fff",
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

          <div style={{ position: "relative", minWidth: 220 }}>
            <Search
              size={14}
              color="#94A3B8"
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search brands…"
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                fontSize: 12.5,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: 60,
            }}
          >
            <Loader2
              size={22}
              color="#1D4ED8"
              style={{ animation: "spin 1s linear infinite" }}
            />
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
            <Inbox
              size={30}
              color="#CBD5E1"
              style={{ margin: "0 auto 10px" }}
            />
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#3D5068",
                margin: 0,
              }}
            >
              {search || statusTab !== "ALL"
                ? "No brands match your filters"
                : "No brands yet"}
            </p>
            <p style={{ fontSize: 12, color: "#9BAABB", marginTop: 4 }}>
              {search || statusTab !== "ALL"
                ? "Try adjusting your search or filter criteria"
                : "Register your first brand to start listing branded products."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {brands.map((brand) => (
              <div
                key={brand.id}
                style={{
                  background: "#fff",
                  border: "1.5px solid #E5EAF2",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  transition: "box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 2px 12px rgba(29,78,216,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "#EEF3FB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={18} color="#1D4ED8" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "#0D1B2E",
                        }}
                      >
                        {brand.name}
                      </span>
                      <StatusBadge status={brand.status} />
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "#7A90AB",
                        marginTop: 2,
                      }}
                    >
                      {brand.relationship.replaceAll("_", " ")} · Valid from{" "}
                      {new Date(
                        brand.authorizationStart
                      ).toLocaleDateString()}
                      {brand.hasEndDate && brand.authorizationEnd
                        ? ` to ${new Date(
                            brand.authorizationEnd
                          ).toLocaleDateString()}`
                        : " · No end date"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(brand)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #E5EAF2",
                      background: "#fff",
                      color: "#3D5068",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.style.borderColor = "#1D4ED8";
                      btn.style.color = "#1D4ED8";
                      btn.style.background = "#EFF6FF";
                    }}
                    onMouseLeave={(e) => {
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.style.borderColor = "#E5EAF2";
                      btn.style.color = "#3D5068";
                      btn.style.background = "#fff";
                    }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brand)}
                    disabled={isDeleting}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #FECACA",
                      background: "#FEF2F2",
                      color: "#DC2626",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                      opacity: isDeleting ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (isDeleting) return;
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.style.background = "#FEE2E2";
                      btn.style.borderColor = "#F87171";
                    }}
                    onMouseLeave={(e) => {
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.style.background = "#FEF2F2";
                      btn.style.borderColor = "#FECACA";
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 18,
            }}
          >
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
            <span
              style={{
                fontSize: 12,
                color: "#64748B",
                alignSelf: "center",
              }}
            >
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

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}