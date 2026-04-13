"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPin, Plus, MoreVertical, Pencil, Trash2,
  CheckCircle2, Phone, Home, Briefcase, Tag, X, Check,
  Loader2, ChevronDown,
} from "lucide-react";
import {
  useGetAddressesQuery,
  useGetAddressCountQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useToggleDefaultAddressMutation,
  UserAddress,
  AddressType,
} from "@/features/userAddressApi";
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetThanasQuery,
  Location,
} from "@/features/locationApi";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const TYPE_ICON: Record<string, React.ReactNode> = {
  HOME:  <Home      className="w-3.5 h-3.5" />,
  WORK:  <Briefcase className="w-3.5 h-3.5" />,
  OTHER: <Tag       className="w-3.5 h-3.5" />,
};

const EMPTY_FORM = {
  fullName:     "",
  phone:        "",
  addressLine1: "",
  addressLine2: "",
  landmark:     "",
  addressType:  "HOME" as AddressType,
  isDefault:    false,
};

const EMPTY_LOC = {
  divisionId:  "",
  districtId:  "",
  thanaId:     "",
};

/* ─────────────────────────────────────────────
   Toast
───────────────────────────────────────────── */
function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] bg-slate-800 text-white
        text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all duration-300
        whitespace-nowrap pointer-events-none
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
    >
      {msg}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Toggle Switch
───────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0
        ${checked ? "bg-[#0052cc]" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200
          ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────
   Cascade Location Picker
───────────────────────────────────────────── */
interface LocationPickerProps {
  value: typeof EMPTY_LOC;
  onChange: (loc: typeof EMPTY_LOC) => void;
  error?: string;
}

function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: divisionsData, isLoading: loadingDivisions } = useGetDivisionsQuery();
  const { data: districtsData } = useGetDistrictsQuery(value.divisionId, {
    skip: !value.divisionId,
  });
  const { data: thanasData } = useGetThanasQuery(value.districtId, {
    skip: !value.districtId,
  });

  const divisions: Location[] = divisionsData?.data ?? [];
  const districts: Location[] = districtsData?.data ?? [];
  const thanas: Location[]    = thanasData?.data    ?? [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = (() => {
    const parts: string[] = [];
    if (value.thanaId)    { const t = thanas.find(x => x.id === value.thanaId);       if (t) parts.push(t.name); }
    if (value.districtId) { const d = districts.find(x => x.id === value.districtId); if (d) parts.push(d.name); }
    if (value.divisionId) { const d = divisions.find(x => x.id === value.divisionId); if (d) parts.push(d.name); }
    return parts.length ? parts.join(" / ") : "Select District, Zone, Area";
  })();

  const selectDivision = (id: string) => {
    if (value.divisionId === id) {
      onChange({ divisionId: "", districtId: "", thanaId: "" });
    } else {
      onChange({ divisionId: id, districtId: "", thanaId: "" });
    }
  };

  const selectDistrict = (id: string) => {
    if (value.districtId === id) {
      onChange({ ...value, districtId: "", thanaId: "" });
    } else {
      onChange({ ...value, districtId: id, thanaId: "" });
    }
  };

  const selectThana = (divId: string, distId: string, thanaId: string) => {
    onChange({ divisionId: divId, districtId: distId, thanaId });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-xl
          text-sm transition focus:outline-none focus:ring-2
          ${error
            ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
            : "border-slate-200 focus:border-[#0052cc] focus:ring-[#0052cc]/10"
          }
          bg-white`}
      >
        <span className={value.thanaId ? "text-slate-800" : "text-slate-300"}>
          {label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ml-2
            ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200
          rounded-xl shadow-xl max-h-72 overflow-y-auto">
          {loadingDivisions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#0052cc]" />
            </div>
          ) : (
            divisions.map((division) => (
              <div key={division.id}>
                {/* Division row */}
                <button
                  type="button"
                  onClick={() => selectDivision(division.id)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b border-slate-100
                    transition hover:bg-slate-50
                    ${value.divisionId === division.id ? "text-[#0052cc] bg-[#0052cc]/5" : "text-slate-700"}`}
                >
                  {division.name}
                </button>

                {/* Districts */}
                {value.divisionId === division.id && districts.map((district) => (
                  <div key={district.id}>
                    <button
                      type="button"
                      onClick={() => selectDistrict(district.id)}
                      className={`w-full text-left pl-8 pr-4 py-2 text-sm border-b border-slate-100
                        transition hover:bg-slate-50
                        ${value.districtId === district.id ? "text-[#0052cc] bg-[#0052cc]/5 font-medium" : "text-slate-600"}`}
                    >
                      {district.name}
                    </button>

                    {/* Thanas */}
                    {value.districtId === district.id && thanas.map((thana) => (
                      <button
                        key={thana.id}
                        type="button"
                        onClick={() => selectThana(division.id, district.id, thana.id)}
                        className={`w-full text-left pl-12 pr-4 py-2 text-sm border-b border-slate-100
                          transition hover:bg-[#0052cc]/5
                          ${value.thanaId === thana.id ? "text-[#0052cc] font-medium bg-[#0052cc]/5" : "text-slate-500"}`}
                      >
                        {thana.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Address Card
───────────────────────────────────────────── */
function AddressCard({
  address, onEdit, onDelete, onSetDefault, onToggleDefault, loadingId,
}: {
  address: UserAddress;
  onEdit: (a: UserAddress) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onToggleDefault: (id: string, v: boolean) => void;
  loadingId: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isBusy = loadingId === address.id;

  return (
    <div
      className={`relative rounded-2xl p-5 border transition-all duration-200
        ${isBusy ? "opacity-60 pointer-events-none" : ""}
        ${address.isDefault
          ? "border-[#0052cc]/40 bg-[#0052cc]/5"
          : "border-slate-200 bg-white hover:border-[#0052cc]/30"
        }`}
    >
      {isBusy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10">
          <Loader2 className="w-5 h-5 text-[#0052cc] animate-spin" />
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {address.isDefault && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#0052cc]/10 text-[#0052cc]">
              <CheckCircle2 className="w-3 h-3" /> Default
            </span>
          )}
          {address.addressType && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
              {TYPE_ICON[address.addressType] ?? <Tag className="w-3.5 h-3.5" />}
              {address.addressType}
            </span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[164px]">
                <button
                  onClick={() => { onEdit(address); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit address
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => { onSetDefault(address.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Set as default
                  </button>
                )}
                <div className="h-px bg-slate-100" />
                <button
                  onClick={() => { onDelete(address.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="font-semibold text-slate-800 text-[15px] leading-tight mb-1">
        {address.fullName}
      </p>
      <p className="text-sm text-slate-500 leading-relaxed">
        {address.addressLine1}
        {address.addressLine2 ? `, ${address.addressLine2}` : ""}
      </p>
      {address.landmark && (
        <p className="text-xs text-slate-400 mt-0.5">Near {address.landmark}</p>
      )}
      {address.locations && (
        <p className="text-sm text-slate-500 mt-0.5">
          {address.locations.city}, {address.locations.state} — {address.locations.postalCode}
        </p>
      )}
      <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-400">
        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
        {address.phone}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">Default address</span>
        <Toggle checked={address.isDefault} onChange={(v) => onToggleDefault(address.id, v)} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Add / Edit Modal
───────────────────────────────────────────── */
function AddressFormModal({
  open, editAddress, onClose, onSaved,
}: {
  open: boolean;
  editAddress: UserAddress | null;
  onClose: () => void;
  onSaved: (isEdit: boolean) => void;
}) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loc, setLoc]         = useState(EMPTY_LOC);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: updating }] = useUpdateAddressMutation();
  const saving = creating || updating;

  /* Sync form on open */
  useEffect(() => {
    if (!open) return;
    if (editAddress) {
      setForm({
        fullName:     editAddress.fullName,
        phone:        editAddress.phone,
        addressLine1: editAddress.addressLine1,
        // addressLine2: editAddress.addressLine2 ?? "",
        // landmark:     editAddress.landmark     ?? "",
        addressType:  (editAddress.addressType as AddressType) ?? "HOME",
        isDefault:    editAddress.isDefault,
      });
      // locationId is the thanaId; we can't reverse-hydrate division/district
      // without extra API calls, so pre-fill thanaId only and let user re-select if needed
      setLoc({ divisionId: "", districtId: "", thanaId: editAddress.locationId ?? "" });
    } else {
      setForm(EMPTY_FORM);
      setLoc(EMPTY_LOC);
    }
    setErrors({});
  }, [open, editAddress]);

  if (!open) return null;

  const set = (k: keyof typeof EMPTY_FORM, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const clearErr = (k: string) =>
    setErrors((p) => { const n = { ...p }; delete n[k]; return n; });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    set(name as keyof typeof EMPTY_FORM, type === "checkbox" ? (e.target as HTMLInputElement).checked : value);
    clearErr(name);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      e.fullName = "Name must be at least 2 characters";
    if (!form.phone.trim())
      e.phone = "Phone number is required";
    if (!/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(form.phone))
      e.phone = "Invalid phone number format";
    if (!form.addressLine1.trim() || form.addressLine1.trim().length < 5)
      e.addressLine1 = "Address must be at least 5 characters";
    if (!loc.thanaId)
      e.locationId = "Please select complete location (District / Zone / Area)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = {
        locationId:   loc.thanaId,
        fullName:     form.fullName,
        phone:        form.phone,
        addressLine1: form.addressLine1,
        // addressLine2: form.addressLine2 || undefined,
        // landmark:     form.landmark     || undefined,
        addressType:  form.addressType,
        isDefault:    form.isDefault,
      };
      if (editAddress) {
        await updateAddress({ id: editAddress.id, data: payload }).unwrap();
      } else {
        await createAddress(payload).unwrap();
      }
      onSaved(!!editAddress);
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.data?.message ?? "Failed to save address" });
    }
  };

  const fieldCls = (key: string) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition
     bg-white text-slate-800 placeholder:text-slate-300 focus:ring-2
     ${errors[key]
       ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
       : "border-slate-200 focus:border-[#0052cc] focus:ring-[#0052cc]/10"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {editAddress ? "Edit address" : "Add delivery address"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Full name */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Contact name <span className="text-red-400">*</span>
            </label>
            <input
              name="fullName"
              className={fieldCls("fullName")}
              placeholder="Enter full name"
              value={form.fullName}
              onChange={handleChange}
            />
            {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
          </div>

          {/* Phone — with +880 prefix */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Mobile number <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex items-center border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 text-sm text-slate-600 font-medium flex-shrink-0">
                +880
              </div>
              <div className="flex-1">
                <input
                  name="phone"
                  type="tel"
                  className={fieldCls("phone")}
                  placeholder="1234567890"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
          </div>

          {/* Location cascade */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Choose my location <span className="text-red-400">*</span>
            </label>
            <LocationPicker
              value={loc}
              onChange={(v) => { setLoc(v); clearErr("locationId"); }}
              error={errors.locationId}
            />
            {errors.locationId
              ? <p className="text-xs text-red-400 mt-1">{errors.locationId}</p>
              : <p className="text-xs text-slate-400 mt-1">
                  If above address is incomplete please enter house no, road name and area name
                </p>
            }
          </div>

          {/* Address line 1 — textarea */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Street, House / Apartment / Unit <span className="text-red-400">*</span>
            </label>
            <textarea
              name="addressLine1"
              rows={2}
              className={`${fieldCls("addressLine1")} resize-none`}
              placeholder="House no, Building name, Street name"
              value={form.addressLine1}
              onChange={handleChange}
            />
            {errors.addressLine1 && <p className="text-xs text-red-400 mt-1">{errors.addressLine1}</p>}
          </div>

         

          {/* Address type */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Address category
            </label>
            <div className="flex gap-2">
              {(["HOME", "WORK", "OTHER"] as AddressType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("addressType", t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                    text-xs font-medium border transition-all
                    ${form.addressType === t
                      ? "border-[#0052cc] bg-[#0052cc]/10 text-[#0052cc]"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                >
                  {TYPE_ICON[t]} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Default checkbox */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
            <label htmlFor="isDefault" className="text-sm text-slate-600 cursor-pointer select-none">
              Set as default delivery address
            </label>
            <Toggle
              checked={form.isDefault}
              onChange={(v) => set("isDefault", v)}
            />
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Footer inside form so submit works */}
          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium
                text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-2.5 rounded-xl bg-[#0052cc] text-white text-sm font-semibold
                hover:bg-[#0041a8] transition-colors disabled:opacity-70
                flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : editAddress ? "Update address" : "Save address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Skeleton Card
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 rounded-full bg-slate-100" />
        <div className="h-6 w-14 rounded-full bg-slate-100" />
      </div>
      <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
      <div className="h-3 w-48 bg-slate-100 rounded mb-1" />
      <div className="h-3 w-36 bg-slate-100 rounded mb-3" />
      <div className="h-3 w-28 bg-slate-100 rounded" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function AddressesPage() {
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<UserAddress | null>(null);
  const [loadingId,  setLoadingId]  = useState<string | null>(null);
  const [toast,      setToast]      = useState({ msg: "", show: false });

  const { data: addressesData, isLoading } = useGetAddressesQuery();
  const { data: countData }                = useGetAddressCountQuery();
  const [deleteAddress]                    = useDeleteAddressMutation();
  const [setDefaultAddress]               = useSetDefaultAddressMutation();
  const [toggleDefaultAddress]            = useToggleDefaultAddressMutation();

  const addresses  = addressesData?.data ?? [];
  const canAddMore = countData?.data.canAddMore ?? addresses.length < 5;
  const MAX        = countData?.data.maxAllowed ?? 5;

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 2500);
  };

  const openAdd  = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (a: UserAddress) => { setEditTarget(a); setModalOpen(true); };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      await deleteAddress({ id }).unwrap();
      showToast("Address deleted");
    } catch { showToast("Failed to delete"); }
    finally { setLoadingId(null); }
  };

  const handleSetDefault = async (id: string) => {
    setLoadingId(id);
    try {
      await setDefaultAddress({ id }).unwrap();
      showToast("Default address updated");
    } catch { showToast("Failed to update default"); }
    finally { setLoadingId(null); }
  };

  const handleToggleDefault = async (id: string, value: boolean) => {
    setLoadingId(id);
    try {
      await toggleDefaultAddress({ id }).unwrap();
      showToast(value ? "Set as default" : "Removed from default");
    } catch { showToast("Failed to update"); }
    finally { setLoadingId(null); }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-[#0052cc]" />
            <h1 className="text-xl font-semibold text-slate-800">My Addresses</h1>
          </div>
          <p className="text-sm text-slate-400 ml-7">Manage your saved delivery addresses</p>
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-[#0052cc]/10 text-[#0052cc]">
            {addresses.length} of {MAX} addresses
          </span>
          {canAddMore && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 bg-[#0052cc] text-white text-sm
                font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0041a8] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add address
            </button>
          )}
        </div>

        {/* Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonCard /><SkeletonCard />
          </div>
        )}

        {/* Empty */}
        {!isLoading && addresses.length === 0 && (
          <div className="flex flex-col items-center justify-center bg-white border-2
            border-dashed border-slate-200 rounded-2xl py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#0052cc]/10 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-[#0052cc]" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No addresses yet</p>
            <p className="text-sm text-slate-400 mb-5">Add a delivery address to get started</p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 bg-[#0052cc] text-white
                text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0041a8] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add your first address
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && addresses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <AddressCard
                key={a.id}
                address={a}
                onEdit={openEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                onToggleDefault={handleToggleDefault}
                loadingId={loadingId}
              />
            ))}
            {canAddMore && (
              <button
                onClick={openAdd}
                className="flex flex-col items-center justify-center gap-2 border-2
                  border-dashed border-slate-200 rounded-2xl p-6
                  hover:border-[#0052cc]/40 hover:bg-[#0052cc]/5
                  transition-all group min-h-[180px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-[#0052cc]/10
                  flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-[#0052cc] transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-[#0052cc] transition-colors">
                  Add new address
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <AddressFormModal
        open={modalOpen}
        editAddress={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSaved={(isEdit) => showToast(isEdit ? "Address updated" : "Address added")}
      />

      <Toast msg={toast.msg} show={toast.show} />
    </div>
  );
}