"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle, Lock, Check } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierType,
} from "@/features/supplierApi";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useGetSuppliersQuery,
} from "@/features/supplierApi";

/* ══════════════════════════════════
   TYPES
══════════════════════════════════ */
interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  editSupplier?: Supplier | null;
  entityType: "ADMIN" | "VENDOR";
  entityId?: string;
  onSuccess?: (supplier: Supplier) => void;
}

/* ══════════════════════════════════
   CONSTANTS
══════════════════════════════════ */
const SUPPLIER_TYPES = [
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "WHOLESALER", label: "Wholesaler" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "IMPORTER", label: "Importer" },
  { value: "LOCAL_VENDOR", label: "Local Vendor" },
];

/* ══════════════════════════════════
   SECTION CARD (matches product form)
══════════════════════════════════ */
function SectionCard({
  icon,
  iconColor,
  title,
  subtitle,
  badge,
  children,
  error,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
  badge?: "required" | "optional";
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${error ? "#FCA5A5" : "#E5EAF2"}`,
        borderRadius: 14,
        boxShadow: error
          ? "0 0 0 3px rgba(239,68,68,0.08)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.3s, border-color 0.3s",
        marginBottom: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 18px",
          borderBottom: "1px solid #F0F4FA",
          background: "#FAFBFD",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: error ? "#FEF2F2" : "#EEF3FB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#0D1B2E",
                letterSpacing: "-0.2px",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 1 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 9px",
              borderRadius: 20,
              background: badge === "required" ? "#FEF2F2" : "#F0F9F0",
              color: badge === "required" ? "#DC2626" : "#16A34A",
              border: `1px solid ${
                badge === "required" ? "#FECACA" : "#BBF7D0"
              }`,
            }}
          >
            {badge === "required" ? "Required" : "Optional"}
          </span>
        )}
      </div>
      <div style={{ padding: "18px" }}>{children}</div>
    </div>
  );
}

/* ══════════════════════════════════
   FIELD LABEL (matches product form)
══════════════════════════════════ */
function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
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
        {required && (
          <span style={{ color: "#DC2626", fontWeight: 800 }}>*</span>
        )}
      </label>
      {hint && (
        <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 2 }}>{hint}</p>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   INPUT (matches product form)
══════════════════════════════════ */
function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
  hasError,
}: {
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  hasError?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className="w-full text-[13px] bg-white border rounded-[9px] px-3 py-2.5 text-[#0D1B2E] outline-none placeholder:text-[#9BAABB] transition-all duration-150 focus:ring-2 focus:ring-[#1D4ED8]/10"
      style={{
        borderColor: hasError ? "#FCA5A5" : "#E5EAF2",
        background: readOnly ? "#F8FAFC" : "#fff",
        color: readOnly ? "#7A90AB" : "#0D1B2E",
        cursor: readOnly ? "default" : "text",
        fontFamily: "inherit",
      }}
      onFocus={(e) => {
        if (!hasError) e.target.style.borderColor = "#1D4ED8";
      }}
      onBlur={(e) => {
        if (!hasError) e.target.style.borderColor = "#E5EAF2";
      }}
    />
  );
}

/* ══════════════════════════════════
   TEXTAREA
══════════════════════════════════ */
function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full text-[13px] bg-white border border-[#E5EAF2] rounded-[9px] px-3 py-2.5 text-[#0D1B2E] outline-none placeholder:text-[#9BAABB] resize-y min-h-[80px] transition-all duration-150 focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10"
      style={{ fontFamily: "inherit" }}
    />
  );
}

/* ══════════════════════════════════
   FIELD ERROR
══════════════════════════════════ */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 5,
        fontSize: 11.5,
        color: "#DC2626",
      }}
    >
      <AlertTriangle size={12} />
      {message}
    </div>
  );
}

/* ══════════════════════════════════
   INITIAL FORM STATE
══════════════════════════════════ */
const EMPTY_FORM = {
  name: "",
  supplierType: "MANUFACTURER" as SupplierType,
  contactName: "",
  phone: "",
  phone2: "",
  email: "",
  country: "Bangladesh",
  city: "",
  zipCode: "",
  fullAddress: "",
  paymentTerms: "",
  creditLimit: "",
  bankAccountName: "",
  bankAccountNo: "",
  bankName: "",
  bankBranch: "",
  routingNo: "",
  notes: "",
  active: true,
};

/* ══════════════════════════════════
   COMPONENT
══════════════════════════════════ */
export function SupplierModal({
  open,
  onClose,
  editSupplier,
  entityType,
  entityId,
  onSuccess,
}: SupplierModalProps) {
  const isEdit = !!editSupplier;

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [bankNameManual, setBankNameManual] = useState(false);
  const [dupWarning, setDupWarning] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: suppliersData } = useGetSuppliersQuery({
    entityType,
    entityId,
  });
  const [createSupplier, { isLoading: creating }] =
    useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] =
    useUpdateSupplierMutation();

  const isLoading = creating || updating;
  const overlayRef = useRef<HTMLDivElement>(null);

  /* ── Populate form on edit ── */
  useEffect(() => {
    if (editSupplier) {
      setForm({
        name: editSupplier.name || "",
        supplierType: editSupplier.supplierType || "MANUFACTURER",
        contactName: editSupplier.contactName || "",
        phone: editSupplier.phone || "",
        phone2: editSupplier.phone2 || "",
        email: editSupplier.email || "",
        country: editSupplier.country || "Bangladesh",
        city: editSupplier.city || "",
        zipCode: editSupplier.zipCode || "",
        fullAddress: editSupplier.fullAddress || "",
        paymentTerms: editSupplier.paymentTerms || "",
        creditLimit: editSupplier.creditLimit
          ? String(editSupplier.creditLimit)
          : "",
        bankAccountName: editSupplier.bankAccountName || "",
        bankAccountNo: editSupplier.bankAccountNo || "",
        bankName: editSupplier.bankName || "",
        bankBranch: editSupplier.bankBranch || "",
        routingNo: editSupplier.routingNo || "",
        notes: editSupplier.notes || "",
        active: editSupplier.status === "ACTIVE",
      });
      setBankNameManual(true);
      setDupWarning(null);
    } else {
      setForm({ ...EMPTY_FORM });
      setBankNameManual(false);
      setDupWarning(null);
    }
    setErrors({});
  }, [editSupplier, open]);

  /* ── Close on overlay click ── */
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  /* ── Keyboard close ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* ── Auto bank name ── */
  const handleNameChange = (value: string) => {
    set("name", value);
    if (!bankNameManual) set("bankAccountName", value);
    checkDuplicate(value);
  };

  /* ── Duplicate check ── */
  const checkDuplicate = (val: string) => {
    if (!val.trim() || isEdit) {
      setDupWarning(null);
      return;
    }
    const suppliers = suppliersData?.data || [];
    const match = suppliers.find(
      (s) =>
        s.name.toLowerCase().includes(val.toLowerCase()) ||
        val.toLowerCase().includes(s.name.toLowerCase())
    );
    if (match)
      setDupWarning(
        `A supplier "${match.name}" already exists. Please verify.`
      );
    else setDupWarning(null);
  };

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ── Validate ── */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Supplier name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email format";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (isEdit && editSupplier) {
        const payload: UpdateSupplierRequest = {
          supplierType: form.supplierType,
          contactName: form.contactName || undefined,
          phone: form.phone,
          phone2: form.phone2 || undefined,
          email: form.email,
          country: form.country || undefined,
          city: form.city || undefined,
          zipCode: form.zipCode || undefined,
          fullAddress: form.fullAddress || undefined,
          paymentTerms: form.paymentTerms || undefined,
          creditLimit: form.creditLimit
            ? Number(form.creditLimit)
            : undefined,
          bankAccountName: form.bankAccountName || undefined,
          bankAccountNo: form.bankAccountNo || undefined,
          bankName: form.bankName || undefined,
          bankBranch: form.bankBranch || undefined,
          routingNo: form.routingNo || undefined,
          notes: form.notes || undefined,
          status: form.active ? "ACTIVE" : "INACTIVE",
        };
        const res = await updateSupplier({
          id: editSupplier.id,
          data: payload,
        }).unwrap();
        onSuccess?.(res.data as Supplier);
      } else {
        const payload: CreateSupplierRequest = {
          name: form.name.trim(),
          supplierType: form.supplierType,
          phone: form.phone,
          email: form.email,
          entityType,
          entityId,
          contactName: form.contactName || undefined,
          phone2: form.phone2 || undefined,
          country: form.country || undefined,
          city: form.city || undefined,
          zipCode: form.zipCode || undefined,
          fullAddress: form.fullAddress || undefined,
          paymentTerms: form.paymentTerms || undefined,
          creditLimit: form.creditLimit
            ? Number(form.creditLimit)
            : undefined,
          bankAccountName: form.bankAccountName || undefined,
          bankAccountNo: form.bankAccountNo || undefined,
          bankName: form.bankName || undefined,
          bankBranch: form.bankBranch || undefined,
          routingNo: form.routingNo || undefined,
          notes: form.notes || undefined,
        };
        const res = await createSupplier(payload).unwrap();
        onSuccess?.(res.data as Supplier);
      }
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      alert(apiErr?.data?.message || "An error occurred. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F0F4FA] rounded-[18px] shadow-[0_25px_60px_rgba(0,0,0,0.18)] w-[920px] max-w-full max-h-[90vh] flex flex-col overflow-hidden"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* ── Header ── */}
        <div
          className="px-6 py-4 border-b border-[#E5EAF2] flex items-center justify-between flex-shrink-0"
          style={{ background: "#FAFBFD" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] bg-[#EEF3FB] flex items-center justify-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0D1B2E] tracking-[-0.2px]">
                {isEdit ? "Edit Supplier" : "Add New Supplier"}
              </div>
              <div className="text-[11px] text-[#7A90AB] mt-0.5">
                {isEdit
                  ? "Update supplier information and bank details"
                  : "Register a new supplier in the system"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0F4FA] text-[#7A90AB] hover:text-[#0D1B2E] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Duplicate warning */}
          {dupWarning && (
            <div className="flex items-center gap-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] px-4 py-3 text-[12px] text-[#92400E] font-medium">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span>{dupWarning}</span>
            </div>
          )}

          {/* ── 1. Basic Information ── */}
          <SectionCard
            icon={
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke={errors.name ? "#DC2626" : "#1D4ED8"}
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
            }
            iconColor={errors.name ? "#DC2626" : "#1D4ED8"}
            title="Basic Information"
            subtitle="Supplier name, type and status"
            badge="required"
            error={!!errors.name}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FieldLabel required>Supplier Name</FieldLabel>
                <Input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Global Logistics Corp"
                  readOnly={isEdit}
                  hasError={!!errors.name}
                />
                {isEdit && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#7A90AB] mt-1.5">
                    <Lock size={10} />
                    Name cannot be changed after creation
                  </div>
                )}
                <FieldError message={errors.name} />
              </div>
              <div>
                <FieldLabel required>Type</FieldLabel>
                <SearchableSelect
                  options={SUPPLIER_TYPES}
                  value={form.supplierType}
                  onChange={(v) => set("supplierType", v)}
                />
              </div>
            </div>

            {/* Status toggle */}
            <div
              className="mt-4 pt-4 border-t border-dashed border-[#E5EAF2] flex items-center justify-between"
            >
              <div>
                <div className="text-[12px] font-bold text-[#3D5068]">
                  Active Status
                </div>
                <div className="text-[10.5px] text-[#9BAABB] mt-0.5">
                  Inactive suppliers won't appear in dropdowns
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => set("active", e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-10 h-[22px] rounded-full transition-colors duration-200"
                    style={{
                      background: form.active ? "#1D4ED8" : "#CBD5E1",
                    }}
                  >
                    <div
                      className="w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 mt-[2px]"
                      style={{
                        transform: form.active
                          ? "translateX(20px)"
                          : "translateX(2px)",
                      }}
                    />
                  </div>
                </div>
                <span
                  className="text-[12px] font-semibold"
                  style={{
                    color: form.active ? "#15803D" : "#7A90AB",
                  }}
                >
                  {form.active ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
          </SectionCard>

          {/* ── 2. Contact Information ── */}
          <SectionCard
            icon={
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07l-6.58-6.58a2 2 0 00-2.83 0L4.52 15.7a2 2 0 01-2.18-2V10.6a2 2 0 012.18-2 19.79 19.79 0 018.63-3.07l6.58-6.58a2 2 0 002.83 0L19.48 8.3a2 2 0 012.18 2V16.92z" />
              </svg>
            }
            iconColor="#7C3AED"
            title="Contact Information"
            subtitle="Phone, email and address details"
            badge="required"
            error={!!(errors.phone || errors.email)}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldLabel required>Contact Person</FieldLabel>
              <FieldLabel required>Phone</FieldLabel>
              <FieldLabel>Secondary Phone</FieldLabel>
              <Input
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder="e.g. John Doe"
              />
              <div>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+880 1700-000000"
                  hasError={!!errors.phone}
                />
                <FieldError message={errors.phone} />
              </div>
              <Input
                value={form.phone2}
                onChange={(e) => set("phone2", e.target.value)}
                placeholder="+880 1800-000000"
              />

              <div className="md:col-span-2">
                <FieldLabel required>Email</FieldLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="contact@supplier.com"
                  hasError={!!errors.email}
                />
                <FieldError message={errors.email} />
              </div>
              <div /> {/* spacer */}
            </div>

            {/* Address sub-section */}
            <div className="mt-5 pt-5 border-t border-dashed border-[#E5EAF2]">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#9BAABB] mb-3">
                Address
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FieldLabel>Country</FieldLabel>
                <FieldLabel>City</FieldLabel>
                <FieldLabel>ZIP Code</FieldLabel>
                <div /> {/* spacer for alignment */}
                <Input
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder="Bangladesh"
                />
                <Input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Dhaka"
                />
                <Input
                  value={form.zipCode}
                  onChange={(e) => set("zipCode", e.target.value)}
                  placeholder="1200"
                />
                <div className="md:col-span-4">
                  <FieldLabel>Full Address</FieldLabel>
                  <Input
                    value={form.fullAddress}
                    onChange={(e) => set("fullAddress", e.target.value)}
                    placeholder="123 Industrial Area, Motijheel..."
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── 4. Bank Information ── */}
          <SectionCard
            icon={
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D97706"
                strokeWidth="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            }
            iconColor="#D97706"
            title="Bank Information"
            subtitle="Payment receiving account details"
            badge="optional"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldLabel hint="Auto-filled from supplier name">
                Account Name
              </FieldLabel>
              <FieldLabel>Account Number</FieldLabel>
              <Input
                value={form.bankAccountName}
                onChange={(e) => {
                  setBankNameManual(true);
                  set("bankAccountName", e.target.value);
                }}
                placeholder="Auto-filled from name"
              />
              <Input
                value={form.bankAccountNo}
                onChange={(e) => set("bankAccountNo", e.target.value)}
                placeholder="0000 0000 0000"
              />

              <FieldLabel>Bank Name</FieldLabel>
              <FieldLabel>Branch</FieldLabel>
              <Input
                value={form.bankName}
                onChange={(e) => set("bankName", e.target.value)}
                placeholder="Dutch-Bangla Bank Ltd."
              />
              <Input
                value={form.bankBranch}
                onChange={(e) => set("bankBranch", e.target.value)}
                placeholder="Motijheel Branch"
              />

              <div className="md:col-span-2">
                <FieldLabel>Routing / SWIFT Code</FieldLabel>
                <Input
                  value={form.routingNo}
                  onChange={(e) => set("routingNo", e.target.value)}
                  placeholder="DBBLBDHX"
                />
              </div>
            </div>
          </SectionCard>

          {/* ── 5. Notes ── */}
          <SectionCard
            icon={
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748B"
                strokeWidth="2"
              >
                <line x1="17" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </svg>
            }
            iconColor="#64748B"
            title="Internal Notes"
            subtitle="Only visible to your team"
            badge="optional"
          >
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Internal notes about this supplier..."
              rows={3}
            />
          </SectionCard>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4 border-t border-[#E5EAF2] flex items-center justify-between flex-shrink-0"
          style={{ background: "#FAFBFD" }}
        >
          <div className="text-[11px] text-[#9BAABB]">
            {isEdit ? "Changes will be saved immediately" : "A new COA entry will be created"}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold bg-white text-[#3D5068] border border-[#E5EAF2] hover:bg-[#F0F4FA] hover:border-[#CBD5E1] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[9px] text-[13px] font-bold text-white transition-all duration-150 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, #1D4ED8, #7C3AED)",
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving...
                </>
              ) : isEdit ? (
                "Update Supplier"
              ) : (
                "Create Supplier"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}