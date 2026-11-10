"use client";

import { useState, useMemo, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Eye,
  Pencil,
  Power,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Users,
  ArrowUpDown,
} from "lucide-react";
import type { Supplier, SupplierWithDue } from "@/features/supplierApi";
import {
  useGetSuppliersQuery,
  useToggleSupplierStatusMutation,
} from "@/features/supplierApi";
import { SupplierModal } from "../_components/supplier/SupplierModal";

/* ══════════════════════════════════
   TYPES
══════════════════════════════════ */
type SortKey =
  | "name"
  | "supplierType"
  | "contactName"
  | "email"
  | "phone"
  | "creditLimit"
  | "paymentTerms"
  | "totalDue"
  | "status";
type SortDir = "asc" | "desc";

interface SortState {
  key: SortKey;
  dir: SortDir;
}

/* ══════════════════════════════════
   SORT ICON
══════════════════════════════════ */
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return <ChevronsUpDown size={12} color="#9BAABB" style={{ opacity: 0.5 }} />;
  return dir === "asc" ? (
    <ChevronUp size={12} color="#1D4ED8" strokeWidth={2.5} />
  ) : (
    <ChevronDown size={12} color="#1D4ED8" strokeWidth={2.5} />
  );
}

/* ══════════════════════════════════
   ACTION MENU
══════════════════════════════════ */
function ActionMenu({
  supplier,
  onEdit,
  onView,
  onToggleStatus,
}: {
  supplier: SupplierWithDue;
  onEdit: () => void;
  onView: () => void;
  onToggleStatus: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 180;
      // default: open below button, right-aligned to button
      let left = rect.right - menuWidth;
      let top = rect.bottom + 4;

      // keep inside viewport horizontally
      if (left < 8) left = rect.left;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }

      // if not enough space below, open upward
      const estimatedMenuHeight = 190; // rough height incl. pay-dues row
      if (top + estimatedMenuHeight > window.innerHeight - 8) {
        top = rect.top - estimatedMenuHeight - 4;
      }

      setCoords({ top, left });
    }
    setOpen((p) => !p);
  };

  // reposition on scroll/resize while open
  useLayoutEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 180;
      let left = rect.right - menuWidth;
      let top = rect.bottom + 4;
      if (left < 8) left = rect.left;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      const estimatedMenuHeight = 190;
      if (top + estimatedMenuHeight > window.innerHeight - 8) {
        top = rect.top - estimatedMenuHeight - 4;
      }
      setCoords({ top, left });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          toggleOpen();
        }}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E5EAF2] bg-white text-[#7A90AB] hover:bg-[#F0F4FA] hover:text-[#0D1B2E] transition-all duration-150"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[1000]"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed bg-white border border-[#E5EAF2] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-[1001] min-w-[180px] overflow-hidden py-1"
              style={{ top: coords.top, left: coords.left }}
            >
              <button
                onClick={() => {
                  onView();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-[#0D1B2E] hover:bg-[#F0F4FA] transition-colors"
              >
                <Eye size={13.5} color="#1D4ED8" />
                View Details
              </button>
              <button
                onClick={() => {
                  onEdit();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-[#0D1B2E] hover:bg-[#F0F4FA] transition-colors"
              >
                <Pencil size={13.5} color="#7C3AED" />
                Edit Supplier
              </button>
              {(supplier.totalDue ?? 0) > 0 && (
                <>
                  <div className="mx-3 my-1 h-px bg-[#E5EAF2]" />
                  <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-[#92400E] hover:bg-[#FFFBEB] transition-colors">
                    Pay Dues (৳{Number(supplier.totalDue || 0).toFixed(2)})
                  </button>
                </>
              )}
              <div className="mx-3 my-1 h-px bg-[#E5EAF2]" />
              <button
                onClick={() => {
                  onToggleStatus();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] transition-colors ${
                  supplier.status === "ACTIVE"
                    ? "text-[#DC2626] hover:bg-[#FEF2F2]"
                    : "text-[#15803D] hover:bg-[#F0FDF4]"
                }`}
              >
                <Power size={13.5} />
                {supplier.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );}

/* ══════════════════════════════════
   VIEW MODAL
══════════════════════════════════ */
function ViewSupplierModal({
  supplier,
  onClose,
}: {
  supplier: SupplierWithDue;
  onClose: () => void;
}) {
  const sections = [
    {
      title: "Basic Information",
      rows: [
        ["Supplier Name", supplier.name],
        ["Type", supplier.supplierType],
        ["Status", supplier.status],
        ["Payment Terms", supplier.paymentTerms || "—"],
        ["Credit Limit", `৳${Number(supplier.creditLimit || 0).toLocaleString()}`],
        ["Outstanding Due", `৳${Number(supplier.totalDue || 0).toFixed(2)}`],
      ],
    },
    {
      title: "Contact Information",
      rows: [
        ["Contact Person", supplier.contactName || "—"],
        ["Phone", supplier.phone || "—"],
        ["Secondary Phone", supplier.phone2 || "—"],
        ["Email", supplier.email || "—"],
      ],
    },
    {
      title: "Address",
      rows: [
        ["Country", supplier.country || "—"],
        ["City", supplier.city || "—"],
        ["ZIP Code", supplier.zipCode || "—"],
        ["Full Address", supplier.fullAddress || "—"],
      ],
    },
    {
      title: "Bank Information",
      rows: [
        ["Account Name", supplier.bankAccountName || "—"],
        ["Account Number", supplier.bankAccountNo || "—"],
        ["Bank Name", supplier.bankName || "—"],
        ["Branch", supplier.bankBranch || "—"],
        ["Routing / SWIFT", supplier.routingNo || "—"],
      ],
    },
    {
      title: "Notes",
      rows: [["Notes", supplier.notes || "—"]],
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[16px] shadow-[0_25px_60px_rgba(0,0,0,0.18)] w-[720px] max-w-full max-h-[88vh] flex flex-col"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F0F4FA] bg-[#FAFBFD] rounded-t-[16px] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] bg-[#EEF3FB] flex items-center justify-center"
            >
              <Users size={16} color="#1D4ED8" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0D1B2E] tracking-[-0.2px]">
                {supplier.name}
              </div>
              <div className="text-[11px] text-[#7A90AB] mt-0.5">
                Supplier Details
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0F4FA] text-[#7A90AB] hover:text-[#0D1B2E] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#9BAABB] mb-2.5">
                {section.title}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                {section.rows.map(([label, val]) => (
                  <div
                    key={label}
                    className="py-2.5 border-b border-[#F0F4FA] last:border-0"
                  >
                    <div className="text-[11px] font-semibold text-[#7A90AB] uppercase tracking-[0.04em]">
                      {label}
                    </div>
                    <div
                      className="mt-1 text-[13.5px] text-[#0D1B2E] font-medium"
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#F0F4FA] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-[9px] text-[13px] font-semibold bg-white text-[#3D5068] border border-[#E5EAF2] hover:bg-[#F0F4FA] hover:border-[#CBD5E1] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   MAIN PAGE
══════════════════════════════════ */
export default function SuppliersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] =
    useState<SupplierWithDue | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sort, setSort] = useState<SortState>({
    key: "name",
    dir: "asc",
  });

  const entityType = "ADMIN" as const;
  const entityId = undefined;

  const { data, isLoading, refetch } = useGetSuppliersQuery({
    entityType,
    entityId,
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });
  const [toggleStatus] = useToggleSupplierStatusMutation();

  const suppliers: SupplierWithDue[] = data?.data || [];

  /* ── Sorting ─────────────────────────────────────────────────────────── */

  const handleSort = (key: SortKey) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const sorted = useMemo(() => {
    const arr = [...suppliers];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      let va: any = a[key] ?? "";
      let vb: any = b[key] ?? "";
      if (key === "creditLimit" || key === "totalDue") {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [suppliers, sort]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setModalOpen(true);
  };
  const handleEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setModalOpen(true);
  };
  const handleToggleStatus = async (id: string) => {
    await toggleStatus(id);
    refetch();
  };
  const handleSuccess = () => {
    refetch();
  };

  /* ── Stats ────────────────────────────────────────────────────────────── */

  const totalDue = suppliers.reduce(
    (s, sup) => s + (Number(sup.totalDue) || 0),
    0
  );
  const activeCount = suppliers.filter((s) => s.status === "ACTIVE").length;
  const dueCount = suppliers.filter((s) => (s.totalDue ?? 0) > 0).length;

  /* ── Column Def ───────────────────────────────────────────────────────── */

  type Col = {
    key: SortKey;
    label: string;
    width?: string;
    hideMobile?: boolean;
  };

  const columns: Col[] = [
    { key: "name", label: "Supplier Name" },
    { key: "supplierType", label: "Type", hideMobile: true },
    { key: "contactName", label: "Contact", hideMobile: true },
    { key: "phone", label: "Phone" },
    { key: "creditLimit", label: "Credit Limit", hideMobile: true },
    { key: "paymentTerms", label: "Terms", hideMobile: true },
    { key: "totalDue", label: "Outstanding" },
    { key: "status", label: "Status" },
  ];

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <div className="text-[20px] font-extrabold text-[#0D1B2E] tracking-[-0.4px]">
              Suppliers
            </div>
            <div className="text-[12px] text-[#7A90AB] mt-0.5">
              Manage your supplier directory and payment obligations
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[9px] text-[13px] font-bold text-white transition-all duration-150 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            New Supplier
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: "Total Suppliers",
              value: suppliers.length,
              color: "#1D4ED8",
              bg: "#EEF3FB",
            },
            {
              label: "Active",
              value: activeCount,
              color: "#15803D",
              bg: "#F0FDF4",
            },
            {
              label: "With Dues",
              value: dueCount,
              color: "#D97706",
              bg: "#FFFBEB",
            },
            {
              label: "Total Outstanding",
              value: `৳${totalDue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              color: "#DC2626",
              bg: "#FEF2F2",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-[#E5EAF2] rounded-[12px] px-4 py-3"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#7A90AB]">
                {s.label}
              </div>
              <div
                className="text-[18px] font-extrabold mt-1 tracking-[-0.3px]"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters Bar ── */}
        <div
          className="bg-white border border-[#E5EAF2] rounded-[14px] px-4 py-3 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              color="#9BAABB"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers by name, phone, email..."
              className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-[#F8FAFC] border border-[#E5EAF2] rounded-[9px] text-[#0D1B2E] placeholder:text-[#9BAABB] outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-[8px] text-[11.5px] font-bold transition-all duration-150 ${
                  statusFilter === s
                    ? s === "ALL"
                      ? "bg-[#0D1B2E] text-white shadow-sm"
                      : s === "ACTIVE"
                      ? "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]"
                      : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                    : "bg-[#F8FAFC] text-[#7A90AB] border border-[#E5EAF2] hover:bg-[#F0F4FA]"
                }`}
              >
                {s === "ALL" ? "All" : s === "ACTIVE" ? "● Active" : "● Inactive"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table Card ── */}
        <div
          className="bg-white border border-[#E5EAF2] rounded-[14px] overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-[10.5px] font-bold text-[#7A90AB] uppercase tracking-[0.07em] px-4 py-3 text-left border-b border-[#F0F4FA] bg-[#FAFBFD] whitespace-nowrap cursor-pointer select-none hover:text-[#0D1B2E] transition-colors ${
                        col.hideMobile ? "hidden lg:table-cell" : ""
                      }`}
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1.5">
                        {col.label}
                        <SortIcon
                          active={sort.key === col.key}
                          dir={sort.dir}
                        />
                      </div>
                    </th>
                  ))}
                  <th className="text-[10.5px] font-bold text-[#7A90AB] uppercase tracking-[0.07em] px-4 py-3 text-right border-b border-[#F0F4FA] bg-[#FAFBFD] w-[60px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="text-center py-14 text-[13px] text-[#7A90AB]"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="animate-spin"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#9BAABB"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="#9BAABB"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Loading suppliers...
                      </div>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="text-center py-14"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Users
                          size={32}
                          color="#CBD5E1"
                          strokeWidth={1.5}
                        />
                        <div className="text-[13px] font-medium text-[#7A90AB]">
                          No suppliers found
                        </div>
                        <button
                          onClick={handleOpenAdd}
                          className="text-[12px] font-semibold text-[#1D4ED8] hover:underline"
                        >
                          Add your first supplier
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="group hover:bg-[#F8FAFC] transition-colors"
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5 border-b border-[#F0F4FA]">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                            style={{
                              background:
                                idx % 3 === 0
                                  ? "#EEF3FB"
                                  : idx % 3 === 1
                                  ? "#F0FDF4"
                                  : "#FFFBEB",
                              color:
                                idx % 3 === 0
                                  ? "#1D4ED8"
                                  : idx % 3 === 1
                                  ? "#15803D"
                                  : "#D97706",
                            }}
                          >
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#0D1B2E] truncate">
                              {s.name}
                            </div>
                            <div className="text-[11px] text-[#9BAABB] truncate lg:hidden">
                              {s.phone || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td
                        className={`px-4 py-3.5 border-b border-[#F0F4FA] hidden lg:table-cell`}
                      >
                        <span
                          className="inline-flex px-2.5 py-1 rounded-[7px] text-[11px] font-bold bg-[#EEF3FB] text-[#7C3AED]"
                        >
                          {s.supplierType}
                        </span>
                      </td>

                      {/* Contact */}
                      <td
                        className={`px-4 py-3.5 border-b border-[#F0F4FA] text-[12.5px] text-[#3D5068] hidden lg:table-cell`}
                      >
                        {s.contactName || "—"}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 border-b border-[#F0F4FA]">
                        <span className="text-[12.5px] text-[#0D1B2E] font-medium">
                          {s.phone || "—"}
                        </span>
                      </td>

                      {/* Credit Limit */}
                      <td
                        className={`px-4 py-3.5 border-b border-[#F0F4FA] hidden lg:table-cell`}
                      >
                        <span
                          className="text-[12.5px] font-semibold text-[#3D5068]"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          ৳{(s.creditLimit || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Terms */}
                      <td
                        className={`px-4 py-3.5 border-b border-[#F0F4FA] text-[12px] text-[#7A90AB] hidden lg:table-cell`}
                      >
                        {s.paymentTerms || "—"}
                      </td>

                      {/* Outstanding */}
                      <td className="px-4 py-3.5 border-b border-[#F0F4FA]">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] text-[12.5px] font-bold ${
                            (s.totalDue ?? 0) > 0
                              ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                              : "bg-[#F8FAFC] text-[#9BAABB]"
                          }`}
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          ৳{Number(s.totalDue || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 border-b border-[#F0F4FA]">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[20px] text-[11px] font-bold ${
                            s.status === "ACTIVE"
                              ? "bg-[#F0FDF4] text-[#15803D]"
                              : "bg-[#FEF2F2] text-[#DC2626]"
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background:
                                s.status === "ACTIVE"
                                  ? "#22C55E"
                                  : "#EF4444",
                            }}
                          />
                          {s.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 border-b border-[#F0F4FA] text-right">
                        <ActionMenu
                          supplier={s}
                          onEdit={() => handleEdit(s)}
                          onView={() => setViewingSupplier(s)}
                          onToggleStatus={() => handleToggleStatus(s.id)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {suppliers.length > 0 && (
            <div className="px-4 py-3 border-t border-[#F0F4FA] bg-[#FAFBFD] flex items-center justify-between">
              <span className="text-[11.5px] text-[#7A90AB]">
                {sorted.length} supplier{sorted.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-[#9BAABB] px-2 py-1 rounded-md bg-[#F0F4FA] font-semibold">
                  Page 1
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      <SupplierModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSupplier(null);
        }}
        editSupplier={editingSupplier}
        entityType={entityType}
        entityId={entityId}
        onSuccess={handleSuccess}
      />

      {/* ── View Modal ── */}
      {viewingSupplier && (
        <ViewSupplierModal
          supplier={viewingSupplier}
          onClose={() => setViewingSupplier(null)}
        />
      )}
    </div>
  );
}