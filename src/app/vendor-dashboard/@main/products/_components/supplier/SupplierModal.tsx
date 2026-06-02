"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle, Lock } from "lucide-react";
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
  { value: "MANUFACTURER", label: "MANUFACTURER" },
  { value: "WHOLESALER", label: "WHOLESALER" },
  { value: "DISTRIBUTOR", label: "DISTRIBUTOR" },
  { value: "IMPORTER", label: "IMPORTER" },
  { value: "LOCAL_VENDOR", label: "LOCAL_VENDOR" },
];

const PAYMENT_TERMS = [
  { value: "", label: "— Select —" },
  { value: "Net 7", label: "Net 7" },
  { value: "Net 15", label: "Net 15" },
  { value: "Net 30", label: "Net 30" },
  { value: "Net 45", label: "Net 45" },
  { value: "Net 60", label: "Net 60" },
  { value: "COD", label: "COD" },
  { value: "Advance Payment", label: "Advance Payment" },
];

/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mt-3.5 mb-2.5">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#9B9890]">
        {children}
      </span>
      <div className="flex-1 h-px bg-[#E4E2DB]" />
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      <label className="text-[11.5px] font-medium text-[#5C5A54]">
        {label}
        {required && <span className="text-[#C0392B] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
  className = "",
}: {
  id?: string;
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`
        font-[inherit] text-[13px] bg-white border border-[#D0CEC6] rounded-lg
        px-[10px] py-[7px] text-[#1A1916] w-full outline-none
        transition-[border-color,box-shadow] duration-150
        focus:border-[#1D6B45] focus:ring-2 focus:ring-[#1D6B45]/10
        placeholder:text-[#9B9890]
        ${readOnly ? "bg-[#F9F8F5] text-[#5C5A54] cursor-default" : ""}
        ${className}
      `}
    />
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

  const { data: suppliersData } = useGetSuppliersQuery({ entityType, entityId });
  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation();

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
        creditLimit: editSupplier.creditLimit ? String(editSupplier.creditLimit) : "",
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
    if (!val.trim() || isEdit) { setDupWarning(null); return; }
    const suppliers = suppliersData?.data || [];
    const match = suppliers.find(
      (s) =>
        s.name.toLowerCase().includes(val.toLowerCase()) ||
        val.toLowerCase().includes(s.name.toLowerCase())
    );
    if (match) setDupWarning(`A supplier "${match.name}" already exists. Please verify.`);
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
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
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
          creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
          bankAccountName: form.bankAccountName || undefined,
          bankAccountNo: form.bankAccountNo || undefined,
          bankName: form.bankName || undefined,
          bankBranch: form.bankBranch || undefined,
          routingNo: form.routingNo || undefined,
          notes: form.notes || undefined,
          status: form.active ? "ACTIVE" : "INACTIVE",
        };
        const res = await updateSupplier({ id: editSupplier.id, data: payload }).unwrap();
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
          creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
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
      className="fixed inset-0 bg-black/38 z-[1000] flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-[820px] max-w-[96vw] max-h-[88vh] flex flex-col"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ── Header ── */}
        <div className="px-[18px] py-[14px] border-b border-[#E4E2DB] flex items-center justify-between flex-shrink-0">
          <span className="text-[14px] font-semibold text-[#1A1916]">
            {isEdit ? "Edit Supplier" : "Add New Supplier"}
          </span>
          <button
            onClick={onClose}
            className="p-[5px] w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F9F8F5] text-[#5C5A54] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-[18px] py-[14px] overflow-y-auto flex-1">
          {/* Duplicate warning */}
          {dupWarning && (
            <div className="flex items-center gap-1.5 bg-[#FEF6E7] border border-[#f0d08a] rounded-lg px-3 py-2 mb-3 text-[12px] text-[#92600A]">
              <AlertTriangle size={14} />
              <span>{dupWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-[1fr_210px] gap-[14px] items-start">
            {/* ── LEFT COLUMN ── */}
            <div>
              <SectionLabel>Basic Info</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Supplier Name" required>
                  <Input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Global Logistics Corp"
                    readOnly={isEdit}
                    className={errors.name ? "border-[#C0392B] bg-[#FDF0EE]" : ""}
                  />
                  {isEdit && (
                    <div className="flex items-center gap-1 text-[11px] text-[#9B9890] mt-0.5">
                      <Lock size={10} />
                      <span>Name cannot be changed after creation</span>
                    </div>
                  )}
                  {errors.name && <span className="text-[11px] text-[#C0392B]">{errors.name}</span>}
                </Field>
                <Field label="Type" required>
                  <SearchableSelect
                    options={SUPPLIER_TYPES}
                    value={form.supplierType}
                    onChange={(v) => set("supplierType", v)}
                  />
                </Field>
              </div>

              <SectionLabel>Contact</SectionLabel>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Contact Person">
                  <Input
                    value={form.contactName}
                    onChange={(e) => set("contactName", e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                </Field>
                <Field label="Phone" required>
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+880 1700-000000"
                    className={errors.phone ? "border-[#C0392B] bg-[#FDF0EE]" : ""}
                  />
                  {errors.phone && <span className="text-[11px] text-[#C0392B]">{errors.phone}</span>}
                </Field>
                <Field label="Secondary Phone">
                  <Input
                    value={form.phone2}
                    onChange={(e) => set("phone2", e.target.value)}
                    placeholder="+880 1800-000000"
                  />
                </Field>
              </div>
              <Field label="Email" required className="mt-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="contact@supplier.com"
                  className={errors.email ? "border-[#C0392B] bg-[#FDF0EE]" : ""}
                />
                {errors.email && <span className="text-[11px] text-[#C0392B]">{errors.email}</span>}
              </Field>

              <SectionLabel>Address</SectionLabel>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Country">
                  <Input
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    placeholder="Bangladesh"
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Dhaka"
                  />
                </Field>
                <Field label="ZIP">
                  <Input
                    value={form.zipCode}
                    onChange={(e) => set("zipCode", e.target.value)}
                    placeholder="1200"
                  />
                </Field>
              </div>
              <Field label="Full Address" className="mt-2">
                <Input
                  value={form.fullAddress}
                  onChange={(e) => set("fullAddress", e.target.value)}
                  placeholder="123 Industrial Way..."
                />
              </Field>

              <SectionLabel>Financial / Payment</SectionLabel>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Payment Terms">
                  <SearchableSelect
                    options={PAYMENT_TERMS}
                    value={form.paymentTerms}
                    onChange={(v) => set("paymentTerms", v)}
                  />
                </Field>
                <Field label="Credit Limit (USD)">
                  <Input
                    type="number"
                    value={form.creditLimit}
                    onChange={(e) => set("creditLimit", e.target.value)}
                    placeholder="50000"
                  />
                </Field>
              </div>

              <SectionLabel>Bank Information</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Account Name">
                  <input
                    type="text"
                    value={form.bankAccountName}
                    onChange={(e) => {
                      setBankNameManual(true);
                      set("bankAccountName", e.target.value);
                    }}
                    placeholder="Auto-filled"
                    className="font-[inherit] text-[13px] bg-white border border-[#D0CEC6] rounded-lg px-[10px] py-[7px] text-[#1A1916] w-full outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#1D6B45] focus:ring-2 focus:ring-[#1D6B45]/10 placeholder:text-[#9B9890]"
                  />
                </Field>
                <Field label="Account Number">
                  <Input
                    value={form.bankAccountNo}
                    onChange={(e) => set("bankAccountNo", e.target.value)}
                    placeholder="0000 0000 0000"
                  />
                </Field>
                <Field label="Bank Name">
                  <Input
                    value={form.bankName}
                    onChange={(e) => set("bankName", e.target.value)}
                    placeholder="Dutch-Bangla Bank Ltd."
                  />
                </Field>
                <Field label="Branch">
                  <Input
                    value={form.bankBranch}
                    onChange={(e) => set("bankBranch", e.target.value)}
                    placeholder="Motijheel Branch"
                  />
                </Field>
                <Field label="Routing / SWIFT No">
                  <Input
                    value={form.routingNo}
                    onChange={(e) => set("routingNo", e.target.value)}
                    placeholder="DBBLDHAXXXX"
                  />
                </Field>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div>
              <SectionLabel>Settings</SectionLabel>
              <div className="bg-[#F9F8F5] border border-[#E4E2DB] rounded-lg p-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#1A1916]">Status</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => set("active", e.target.checked)}
                      className="w-auto accent-[#1D6B45]"
                    />
                    <span className="text-[12px] text-[#5C5A54]">Active</span>
                  </label>
                </div>
              </div>

              <Field label="Notes" className="mt-3">
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Internal notes..."
                  rows={4}
                  className="font-[inherit] text-[13px] bg-white border border-[#D0CEC6] rounded-lg px-[10px] py-[7px] text-[#1A1916] w-full outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#1D6B45] focus:ring-2 focus:ring-[#1D6B45]/10 placeholder:text-[#9B9890] resize-y min-h-[80px]"
                />
              </Field>

              {/* COA Classification info box */}
              <div className="mt-2.5 bg-[#EBF4EF] border border-[#D1EAD9] rounded-lg p-[10px]">
                <div className="text-[10.5px] font-bold text-[#1D6B45] uppercase tracking-[0.04em]">
                  COA Classification
                </div>
                <div className="text-[11.5px] text-[#1D6B45] mt-0.5">
                  Mapped as <strong>Liability → Accounts Payable</strong>. Auto-COA created on save.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-[18px] py-[11px] border-t border-[#E4E2DB] flex gap-2 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-[14px] py-[7px] rounded-lg font-[inherit] text-[13px] font-medium cursor-pointer bg-white text-[#1A1916] border border-[#D0CEC6] hover:bg-[#F9F8F5] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-[14px] py-[7px] rounded-lg font-[inherit] text-[13px] font-medium cursor-pointer bg-[#1D6B45] text-white hover:bg-[#165a38] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : isEdit ? (
              "Update Supplier"
            ) : (
              "Save Supplier"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}