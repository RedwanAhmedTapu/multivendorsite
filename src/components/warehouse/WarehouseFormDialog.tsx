"use client";
// Shared warehouse create / edit dialog — the ONE warehouse form used by
// Settings, the product form and Purchase Receive.
//
// Edit mode reads the backend's derived lifecycle state
// (GET /warehouse/warehouses/:id/usage) and disables locked fields with the
// reason the backend gives. The backend enforces the same locks, so the UI is
// a convenience, never the source of truth.
//
// Creating a warehouse never creates Pathao/RedX/Steadfast stores — courier
// pickup setup is a separate workflow.
import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Lock, MapPin, RefreshCw, Wand2, Warehouse as WarehouseIcon, X } from "lucide-react";
import {
  useCreateWarehouseMutation,
  useGetWarehouseUsageQuery,
  useUpdateWarehouseMutation,
  Warehouse,
  WarehouseType,
  UpdateWarehouseRequest,
} from "@/features/warehouseApi";
import { LocationPickerDialog, PickedLocation } from "@/components/locationpickerdialog/LocationPickerDialog";

export interface CreatedWarehouseSummary {
  id: string;
  name: string | null;
  code: string | null;
  type: WarehouseType;
}

export interface WarehouseFormDialogProps {
  vendorId: string;
  open: boolean;
  onClose: () => void;
  /** Omit (or pass null) to create; pass a warehouse to edit it. */
  warehouse?: Warehouse | null;
  /** Initial type for a new warehouse. */
  defaultType?: WarehouseType;
  /** Called with the created warehouse — callers auto-select it. */
  onCreated?: (warehouse: CreatedWarehouseSummary, full: Warehouse) => void;
  /** Called after a successful edit. */
  onUpdated?: (warehouse: Warehouse) => void;
}

type FormState = {
  name: string;
  code: string;
  locationId: string;
  locationName: string;
  address: string;
  email: string;
  phone: string;
  type: WarehouseType;
  isDefault: boolean;
};

const emptyForm = (type: WarehouseType = WarehouseType.PICKUP): FormState => ({
  name: "",
  code: "",
  locationId: "",
  locationName: "",
  address: "",
  email: "",
  phone: "",
  type,
  isDefault: false,
});

const formFromWarehouse = (w: Warehouse): FormState => ({
  name: w.name ?? "",
  code: w.code ?? "",
  locationId: w.locationId,
  locationName: w.location?.name ?? w.locationId,
  address: w.address ?? "",
  email: w.email ?? "",
  phone: w.phone ?? "",
  type: w.type,
  isDefault: w.isDefault,
});

export function generateWarehouseCode(name: string) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 4) || "WH";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WH-${initials}-${suffix}`;
}

function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#3D5068",
          letterSpacing: "0.01em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {children}
        {required && <span style={{ color: "#DC2626", fontWeight: 800 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11.5, color: "#DC2626" }}>
      <AlertCircle size={12} />
      {message}
    </div>
  );
}

/** "🔒 <reason>" under a locked field. */
function LockedNote({ reason }: { reason?: string | null }) {
  if (!reason) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginTop: 5, fontSize: 11, color: "#92400E" }}>
      <Lock size={11} style={{ marginTop: 2, flexShrink: 0 }} />
      <span>{reason}</span>
    </div>
  );
}

export function WarehouseFormDialog({
  vendorId,
  open,
  onClose,
  warehouse,
  defaultType,
  onCreated,
  onUpdated,
}: WarehouseFormDialogProps) {
  const isEdit = !!warehouse;
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [form, setForm] = useState<FormState>(() => (warehouse ? formFromWarehouse(warehouse) : emptyForm(defaultType)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation();
  const { data: usageRes, isFetching: usageLoading } = useGetWarehouseUsageQuery(
    { id: warehouse?.id ?? "" },
    { skip: !isEdit || !open, refetchOnMountOrArgChange: true },
  );
  const locks = usageRes?.data?.locks ?? { locationId: null, type: null, address: null };
  const isLoading = isCreating || isUpdating;

  // Mount when opening (re-seeding the form); animate out, then unmount when closing.
  useEffect(() => {
    if (open) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setForm(warehouse ? formFromWarehouse(warehouse) : emptyForm(defaultType));
      setErrors({});
      setSubmitError("");
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      closeTimer.current = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 220);
    }
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, warehouse?.id]);

  // Close on Escape (the nested location picker handles its own Escape first)
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showLocationPicker) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, onClose, showLocationPicker]);

  if (!visible) return null;

  const setField = (key: keyof FormState, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const handleGenerateCode = () => {
    if (!form.name.trim()) {
      setErrors((e) => ({ ...e, code: "Enter a warehouse name first" }));
      return;
    }
    setErrors((e) => ({ ...e, code: "" }));
    setField("code", generateWarehouseCode(form.name));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Warehouse name is required";
    if (!form.locationId.trim()) next.locationId = "Please choose a location";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError("");
    if (!validate()) return;
    try {
      if (isEdit && warehouse) {
        // Only changed, allow-listed fields are sent (never vendorId).
        const original = formFromWarehouse(warehouse);
        const data: UpdateWarehouseRequest = {};
        const text = (k: "name" | "code" | "address" | "email" | "phone") => {
          if (form[k].trim() !== original[k].trim()) (data as any)[k] = form[k].trim();
        };
        (["name", "code", "address", "email", "phone"] as const).forEach(text);
        if (form.locationId !== original.locationId) data.locationId = form.locationId;
        if (form.type !== original.type) data.type = form.type;
        if (Object.keys(data).length === 0) {
          onClose();
          return;
        }
        const result = await updateWarehouse({ id: warehouse.id, data }).unwrap();
        onUpdated?.(result.data);
        onClose();
        return;
      }

      const result = await createWarehouse({
        vendorId,
        locationId: form.locationId.trim(),
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        address: form.address.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        type: form.type,
        isDefault: form.isDefault,
      }).unwrap();

      onCreated?.(
        { id: result.data.id, name: result.data.name, code: result.data.code, type: result.data.type },
        result.data,
      );
      onClose();
    } catch (err: any) {
      // The caller's own form state is untouched on failure — only this
      // dialog shows the error.
      setSubmitError(err?.data?.message || (isEdit ? "Failed to update warehouse" : "Failed to create warehouse"));
    }
  };

  const inputStyle = (hasError?: boolean, disabled?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "8px 11px",
    borderRadius: 8,
    border: `1px solid ${hasError ? "#FCA5A5" : "#CBD5E1"}`,
    fontSize: 12.5,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    background: disabled ? "#F1F5F9" : "#fff",
    color: disabled ? "#64748B" : "#1E293B",
    cursor: disabled ? "not-allowed" : undefined,
  });

  const locationLocked = isEdit && !!locks.locationId;
  const typeLocked = isEdit && !!locks.type;
  const addressLocked = isEdit && !!locks.address;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(2px)",
          animation: `${closing ? "wh-overlay-out" : "wh-overlay-in"} 0.2s ease forwards`,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit warehouse" : "Create warehouse"}
        className="wh-create-modal"
        style={{
          position: "relative",
          width: "70vw",
          maxWidth: 900,
          minWidth: 320,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
          border: "1px solid #E2E8F0",
          animation: `${closing ? "wh-modal-out" : "wh-modal-in"} 0.22s cubic-bezier(0.16,1,0.3,1) forwards`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "0.5px solid #E2E8F0",
            position: "sticky",
            top: 0,
            background: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: "#EFF6FF",
                border: "0.5px solid #BFDBFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WarehouseIcon size={15} color="#1D4ED8" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", margin: 0 }}>
                {isEdit ? "Edit warehouse" : "Create warehouse"}
              </p>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                {isEdit
                  ? usageLoading
                    ? "Checking which fields can be changed…"
                    : usageRes?.data?.operational
                      ? "This warehouse is in use — some fields are locked"
                      : "Not used in operations yet — all fields can be changed"
                  : "Add a new pickup or return location"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="wh-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel required>Name</FieldLabel>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Dhaka Central Warehouse"
                style={inputStyle(!!errors.name)}
              />
              <FieldError message={errors.name} />
            </div>

            <div>
              <FieldLabel hint={isEdit ? "Must stay unique per vendor and type" : "Auto-generated from the name — click the wand to reroll"}>
                Code
              </FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={form.code}
                  onChange={(e) => setField("code", e.target.value)}
                  placeholder="e.g. WH-DCW-4Q7Z"
                  style={{ ...inputStyle(!!errors.code), flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  aria-label="Generate code"
                  title="Generate code from name"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    borderRadius: 8,
                    border: "1px solid #BFDBFE",
                    background: "#EFF6FF",
                    color: "#1D4ED8",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Wand2 size={14} />
                </button>
              </div>
              <FieldError message={errors.code} />
            </div>
          </div>

          <div className="wh-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel required hint="The leaf location (area / thana) this warehouse belongs to">
                Location
              </FieldLabel>
              <button
                type="button"
                disabled={locationLocked}
                onClick={() => !locationLocked && setShowLocationPicker(true)}
                style={{
                  ...inputStyle(!!errors.locationId, locationLocked),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  cursor: locationLocked ? "not-allowed" : "pointer",
                }}
              >
                <span
                  style={{
                    color: form.locationName ? (locationLocked ? "#64748B" : "#1E293B") : "#94A3B8",
                    fontWeight: form.locationName ? 600 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {form.locationName || "Choose location"}
                </span>
                {locationLocked ? (
                  <Lock size={13} color="#94A3B8" style={{ flexShrink: 0, marginLeft: 8 }} />
                ) : (
                  <MapPin size={13} color="#94A3B8" style={{ flexShrink: 0, marginLeft: 8 }} />
                )}
              </button>
              <FieldError message={errors.locationId} />
              <LockedNote reason={isEdit ? locks.locationId : null} />
            </div>

            <div>
              <FieldLabel required hint="Choose whether this warehouse is for pickup or return.">
                Type
              </FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                {[WarehouseType.PICKUP, WarehouseType.RETURN].map((t) => {
                  const active = form.type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={typeLocked}
                      onClick={() => !typeLocked && setField("type", t)}
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1.5px solid ${active ? "#1D4ED8" : "#CBD5E1"}`,
                        background: active ? "#EFF6FF" : typeLocked ? "#F1F5F9" : "#fff",
                        color: active ? "#1D4ED8" : "#64748B",
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: typeLocked ? "not-allowed" : "pointer",
                        opacity: typeLocked && !active ? 0.6 : 1,
                        fontFamily: "inherit",
                      }}
                    >
                      {t === WarehouseType.PICKUP ? "Pickup" : "Return"}
                    </button>
                  );
                })}
              </div>
              <LockedNote reason={isEdit ? locks.type : null} />
            </div>
          </div>

          <div>
            <FieldLabel hint="Street address shown on pickup/return labels">Address</FieldLabel>
            <div style={{ position: "relative" }}>
              {addressLocked ? (
                <Lock size={13} color="#94A3B8" style={{ position: "absolute", left: 10, top: 10 }} />
              ) : (
                <MapPin size={13} color="#94A3B8" style={{ position: "absolute", left: 10, top: 10 }} />
              )}
              <input
                value={form.address}
                disabled={addressLocked}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="House, road, area, city"
                style={{ ...inputStyle(false, addressLocked), paddingLeft: 30 }}
              />
            </div>
            <LockedNote reason={isEdit ? locks.address : null} />
          </div>

          <div className="wh-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel>Email</FieldLabel>
              <input
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="warehouse@company.com"
                style={inputStyle(!!errors.email)}
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+8801XXXXXXXXX"
                style={inputStyle()}
              />
            </div>
          </div>

          {!isEdit && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#3D5068",
                fontWeight: 600,
                cursor: "pointer",
                marginTop: 2,
              }}
            >
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setField("isDefault", e.target.checked)}
                style={{ width: 15, height: 15, cursor: "pointer" }}
              />
              Set as default warehouse for this vendor
            </label>
          )}

          {submitError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 11px",
                background: "#FEF2F2",
                border: "0.5px solid #FCA5A5",
                borderRadius: 8,
                fontSize: 11.5,
                color: "#DC2626",
              }}
            >
              <AlertCircle size={12} />
              {submitError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "14px 20px",
            borderTop: "0.5px solid #E2E8F0",
            position: "sticky",
            bottom: 0,
            background: "#fff",
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#fff",
              color: "#475569",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || (isEdit && usageLoading)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: isLoading || (isEdit && usageLoading) ? "#94A3B8" : "linear-gradient(135deg,#1D4ED8,#2563EB)",
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {isLoading ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
            {isLoading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create warehouse"}
          </button>
        </div>
      </div>

      <LocationPickerDialog
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        selectedId={form.locationId}
        title="Choose warehouse location"
        description="Only leaf-level areas are shown"
        accent="#1D4ED8"
        accentBg="#EFF6FF"
        accentBorder="#BFDBFE"
        onSelect={(loc: PickedLocation) => {
          setField("locationId", loc.id);
          setField("locationName", loc.name);
          setErrors((e) => ({ ...e, locationId: "" }));
        }}
      />

      <style>{`
        @keyframes wh-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wh-overlay-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes wh-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wh-modal-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.96) translateY(6px); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 720px) {
          .wh-create-modal { width: 92vw !important; }
          .wh-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default WarehouseFormDialog;
