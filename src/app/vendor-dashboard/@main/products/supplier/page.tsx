"use client";

import { useState } from "react";
import { Plus, Eye, Pencil, DollarSign, Power } from "lucide-react";
import type { Supplier, SupplierWithDue } from "@/features/supplierApi";
import {
  useGetSuppliersQuery,
  useToggleSupplierStatusMutation,
} from "@/features/supplierApi";
import { SupplierModal } from "../_components/supplier/SupplierModal";

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

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className="bg-none border border-[#D0CEC6] rounded-md cursor-pointer p-1 text-[#5C5A54] flex items-center justify-center transition-all hover:bg-[#F9F8F5] hover:text-[#1A1916]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+4px)] bg-white border border-[#D0CEC6] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-20 min-w-[160px] overflow-hidden">
            <div
              onClick={() => { onView(); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-[12.5px] cursor-pointer transition-colors text-[#1A1916] hover:bg-[#F9F8F5] whitespace-nowrap"
            >
              <Eye size={13} /> View Details
            </div>
            <div
              onClick={() => { onEdit(); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-[12.5px] cursor-pointer transition-colors text-[#1A1916] hover:bg-[#F9F8F5] whitespace-nowrap"
            >
              <Pencil size={13} /> Edit
            </div>
            {(supplier.totalDue ?? 0) > 0 && (
              <>
                <div className="h-px bg-[#E4E2DB] my-0.5" />
                <div className="flex items-center gap-2 px-3 py-2 text-[12.5px] cursor-pointer text-[#92600A] hover:bg-[#FEF6E7] whitespace-nowrap">
                  <DollarSign size={13} />
                  Pay Dues (${(supplier.totalDue ?? 0).toFixed(2)})
                </div>
              </>
            )}
            <div className="h-px bg-[#E4E2DB] my-0.5" />
            <div
              onClick={() => { onToggleStatus(); setOpen(false); }}
              className={`flex items-center gap-2 px-3 py-2 text-[12.5px] cursor-pointer whitespace-nowrap transition-colors
                ${supplier.status === "ACTIVE"
                  ? "text-[#C0392B] hover:bg-[#FDF0EE]"
                  : "text-[#1A1916] hover:bg-[#F9F8F5]"}`}
            >
              <Power size={13} />
              {supplier.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
  const rows: [string, string][] = [
    ["Supplier Name", supplier.name],
    ["Type", supplier.supplierType],
    ["Status", supplier.status],
    ["Contact Person", supplier.contactName || "—"],
    ["Phone", supplier.phone || "—"],
    ["Secondary Phone", supplier.phone2 || "—"],
    ["Email", supplier.email || "—"],
    ["Country", supplier.country || "—"],
    ["City", supplier.city || "—"],
    ["ZIP", supplier.zipCode || "—"],
    ["Full Address", supplier.fullAddress || "—"],
    ["Payment Terms", supplier.paymentTerms || "—"],
    ["Credit Limit", `$${(supplier.creditLimit || 0).toLocaleString()}`],
    ["Outstanding Due", `$${(supplier.totalDue ?? 0).toFixed(2)}`],
    ["Bank Account Name", supplier.bankAccountName || "—"],
    ["Account Number", supplier.bankAccountNo || "—"],
    ["Bank Name", supplier.bankName || "—"],
    ["Branch", supplier.bankBranch || "—"],
    ["Routing", supplier.routingNo || "—"],
    ["Notes", supplier.notes || "—"],
  ];

  return (
    <div
      className="fixed inset-0 bg-black/38 z-[1000] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-[640px] max-w-[96vw] max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="px-[18px] py-[14px] border-b border-[#E4E2DB] flex items-center justify-between flex-shrink-0">
          <span className="text-[14px] font-semibold">Supplier: {supplier.name}</span>
          <button onClick={onClose} className="p-[5px] w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F9F8F5] text-[#5C5A54]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-[18px] py-[14px] overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-2">
            {rows.map(([label, val]) => (
              <div key={label} className="py-2 border-b border-[#E4E2DB]">
                <div className="text-[11.5px] font-medium text-[#5C5A54]">{label}</div>
                <div className="mt-0.5 text-[13px] text-[#1A1916]">{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-[18px] py-[11px] border-t border-[#E4E2DB] flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-[14px] py-[7px] rounded-lg text-[13px] font-medium bg-white text-[#1A1916] border border-[#D0CEC6] hover:bg-[#F9F8F5] transition-colors"
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
  const [viewingSupplier, setViewingSupplier] = useState<SupplierWithDue | null>(null);

  // Replace with real entityType/entityId from your auth context
  const entityType = "ADMIN" as const;
  const entityId = undefined;

  const { data, isLoading, refetch } = useGetSuppliersQuery({ entityType, entityId });
  const [toggleStatus] = useToggleSupplierStatusMutation();

  const suppliers: SupplierWithDue[] = data?.data || [];

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

  const badgeClass = (status: string) =>
    status === "ACTIVE"
      ? "bg-[#D1EAD9] text-[#1D6B45]"
      : "bg-[#FDF0EE] text-[#C0392B]";

  const typeBadge = "bg-[#EBF2FA] text-[#1A4F7A]";

  return (
    <div
      className="min-h-screen bg-[#F4F3EF]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="p-[22px_24px]">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-[18px]">
          <div>
            <div className="text-[19px] font-bold tracking-[-0.4px] text-[#1A1916]">
              Suppliers
            </div>
            <div className="text-[12px] text-[#9B9890] mt-0.5">
              Manage your supplier directory
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-[14px] py-[7px] rounded-lg text-[13px] font-medium bg-[#1D6B45] text-white hover:bg-[#165a38] transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} />
            New Supplier
          </button>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-[#E4E2DB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Name","Type","Contact","Email","Phone","Secondary Phone","Credit Limit","Terms","Outstanding Due","Status","Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-[11px] font-semibold text-[#9B9890] uppercase tracking-[0.06em] px-[11px] py-[9px] text-left border-b border-[#E4E2DB] bg-[#F9F8F5] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-[13px] text-[#9B9890]">
                      Loading suppliers...
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-[13px] text-[#9B9890]">
                      No suppliers yet.{" "}
                      <button
                        onClick={handleOpenAdd}
                        className="text-[#1D6B45] underline"
                      >
                        Add your first supplier
                      </button>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:[&>td]:bg-[#F9F8F5]">
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB] text-[13px] font-medium text-[#1A1916]">
                        {s.name}
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${typeBadge}`}>
                          {s.supplierType}
                        </span>
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB] text-[12px] text-[#5C5A54]">
                        {s.contactName || "—"}
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB] text-[12px] text-[#5C5A54]">
                        {s.email || "—"}
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB] text-[12px] text-[#1A1916]">
                        {s.phone || "—"}
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB] text-[12px] text-[#9B9890]">
                        {s.phone2 || "—"}
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB] text-[13px] font-[DM_Mono,monospace]">
                        ${(s.creditLimit || 0).toLocaleString()}
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB] text-[12px] text-[#5C5A54]">
                        {s.paymentTerms || "—"}
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB]">
                        <span
                          className={`font-[DM_Mono,monospace] text-[13px] font-medium ${
                            (s.totalDue ?? 0) > 0 ? "text-[#92600A]" : "text-[#9B9890]"
                          }`}
                        >
                          ${(s.totalDue ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeClass(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-[11px] py-[9px] border-b border-[#E4E2DB] w-[50px]">
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
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      <SupplierModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSupplier(null); }}
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