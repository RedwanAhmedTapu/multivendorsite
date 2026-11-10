"use client";
import React, { useState } from "react";
import { X, ShieldCheck, Store, CalendarDays, FileText, Check, XCircle } from "lucide-react";
import type { Brand } from "@/types/brand";
import { StatusBadge } from "./BrandformShared";
import {
  useApproveBrandMutation,
  useRejectBrandMutation,
} from "@/features/brandApi";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#9BAABB", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "#0D1B2E", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function BrandDetailsModal({
  open,
  brand,
  onClose,
  onActioned,
}: {
  open: boolean;
  brand: Brand | null;
  onClose: () => void;
  onActioned: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const [approveBrand, { isLoading: isApproving }] = useApproveBrandMutation();
  const [rejectBrand, { isLoading: isRejecting }] = useRejectBrandMutation();

  if (!open || !brand) return null;

  const handleApprove = async () => {
    try {
      await approveBrand(brand.id).unwrap();
      onActioned();
    } catch (err: any) {
      alert(`❌ ${err?.data?.message || "Failed to approve brand"}`);
    }
  };

  const handleReject = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    try {
      await rejectBrand({ id: brand.id, reason: rejectReason || undefined }).unwrap();
      onActioned();
    } catch (err: any) {
      alert(`❌ ${err?.data?.message || "Failed to reject brand"}`);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,27,46,0.45)",
        backdropFilter: "blur(2px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "4vh 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#F0F4FA",
          borderRadius: 16,
          width: "100%",
          maxWidth: 640,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(13,27,46,0.25)",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "#fff",
            borderBottom: "1px solid #E5EAF2",
            borderRadius: "16px 16px 0 0",
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
              <ShieldCheck size={17} color="#1D4ED8" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0D1B2E" }}>{brand.name}</div>
              <div style={{ marginTop: 2 }}>
                <StatusBadge status={brand.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #E5EAF2",
              background: "#FAFBFD",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Close"
          >
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Vendor */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #E5EAF2",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Store size={14} color="#0891B2" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>Vendor</span>
            </div>
            <DetailRow
              label="Store Name"
              value={brand.vendor?.storeName ?? "—"}
            />
          </div>

          {/* Registration details */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #E5EAF2",
              borderRadius: 12,
              padding: "14px 16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <DetailRow label="Relationship" value={brand.relationship.replaceAll("_", " ")} />
            <DetailRow
              label="Categories"
              value={brand.categories?.map((c) => c.category?.name).filter(Boolean).join(", ") || "—"}
            />
            <DetailRow
              label="Authorization Start"
              value={new Date(brand.authorizationStart).toLocaleDateString()}
            />
            <DetailRow
              label="Authorization End"
              value={
                brand.hasEndDate && brand.authorizationEnd
                  ? new Date(brand.authorizationEnd).toLocaleDateString()
                  : "No expiry"
              }
            />
          </div>

          {/* Authentication document */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #E5EAF2",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <FileText size={14} color="#16A34A" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>
                Authentication Document
              </span>
            </div>
            {brand.authenticationDoc ? (
              <a
                href={brand.authenticationDoc}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12.5, color: "#1D4ED8", fontWeight: 600 }}
              >
                View uploaded document →
              </a>
            ) : (
              <span style={{ fontSize: 12.5, color: "#9BAABB" }}>No document uploaded</span>
            )}
          </div>

          {/* Timestamps */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9BAABB" }}>
            <CalendarDays size={12} />
            Submitted {new Date(brand.createdAt).toLocaleString()}
          </div>

          {/* Reject reason input */}
          {showRejectInput && brand.status === "PENDING" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>
                Rejection reason (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Let the vendor know what needs fixing…"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  fontSize: 12.5,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
          )}

          {/* Actions */}
          {brand.status === "PENDING" && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={handleReject}
                disabled={isRejecting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 18px",
                  borderRadius: 9,
                  border: "1.5px solid #FECACA",
                  background: "#FEF2F2",
                  color: "#DC2626",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isRejecting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                <XCircle size={14} />
                {showRejectInput ? "Confirm Reject" : "Reject"}
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 20px",
                  borderRadius: 9,
                  border: "none",
                  background: isApproving ? "#CBD5E1" : "linear-gradient(135deg,#16A34A,#0891B2)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isApproving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Check size={14} /> Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}