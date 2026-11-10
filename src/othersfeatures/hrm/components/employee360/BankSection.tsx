// src/othersfeatures/hrm/components/employee360/BankSection.tsx
//
// Bank / MFS accounts on the Employee 360 page. Cards rather than a table
// because bank vs MFS accounts show different fields; the primary account
// is highlighted with the ProductForm accent border.
//
// PHASE F: the Add/Edit dialog now sources Bank / Branch / Routing from the
// real bank master data (features/bankApi.ts) via the shared SearchableSelect
// combobox — no invented lists. Payment method = BANK shows searchable Bank
// and Branch dropdowns (branch list filtered by the chosen bank) and
// auto-fills the routing number from the chosen branch (still editable);
// MFS hides the bank fields and shows the wallet number instead. Bank
// masking without hrBankView is server-side and untouched.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, BadgeCheck, Star } from "lucide-react";
import { SectionCard, FieldError } from "@/components/ui/section-card";
import { SmallOutlineButton } from "@/components/ui/section-buttons";
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";
import {
  useGetBanksQuery,
  useGetBranchesByBankQuery,
} from "@/features/bankApi";
import type { HrBankAccount } from "../../../../features/hrmApi";

const PAYMENT_METHODS = [
  { value: "BANK", label: "Bank transfer" },
  { value: "MFS", label: "MFS (bKash / Nagad / Rocket)" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

const ACCOUNT_TYPES = [
  { value: "SALARY", label: "Salary" },
  { value: "SAVINGS", label: "Savings" },
  { value: "CURRENT", label: "Current" },
];

const MFS_PROVIDERS = [
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "ROCKET", label: "Rocket" },
  { value: "OTHER", label: "Other" },
];

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500";

interface BankFormState {
  paymentMethod: string;
  holderName: string;
  bankId: string;
  branchId: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  mfsProvider: string;
  mfsNumber: string;
  isPrimary: boolean;
}

const EMPTY_FORM: BankFormState = {
  paymentMethod: "BANK", holderName: "", bankId: "", branchId: "",
  routingNumber: "", accountNumber: "", accountType: "SALARY",
  mfsProvider: "", mfsNumber: "", isPrimary: false,
};

export function BankSection({
  employeeId,
  accounts,
  canEdit = true,
  onAdd,
  onUpdate,
  onRemove,
}: {
  employeeId: string;
  accounts: HrBankAccount[] | undefined;
  /** PHASE F: hide Add/Edit/Remove when the user lacks the capability. */
  canEdit?: boolean;
  onAdd: (data: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
}) {
  void employeeId;
  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; row?: HrBankAccount } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(values: Record<string, unknown>) {
    if (!dialog) return;
    setBusy(true);
    setError(null);
    try {
      if (dialog.mode === "add") await onAdd(values);
      else await onUpdate(dialog.row!.id, values);
      setDialog(null);
    } catch (err: any) {
      const fieldErrors = Array.isArray(err?.data?.errors)
        ? err.data.errors.map((e: any) => `${String(e?.path ?? "").replace(/^body\./, "")}: ${e?.message}`).join("; ")
        : null;
      setError(fieldErrors || err?.data?.message || err?.message || "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard
      icon={<Wallet size={16} className="text-indigo-600" />}
      title="Bank & MFS"
      subtitle="Salary disbursement accounts"
      badge="optional"
      actions={
        canEdit ? (
          <SmallOutlineButton onClick={() => { setError(null); setDialog({ mode: "add" }); }}>+ Add</SmallOutlineButton>
        ) : undefined
      }
    >
      <FieldError message={error} />
      {(!accounts || accounts.length === 0) && <p className="text-sm text-gray-400">No bank or MFS account added yet.</p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {accounts?.map((acc) => (
          <div
            key={acc.id}
            className="rounded-lg p-3"
            style={{ border: `1.5px solid ${acc.isPrimary ? "#C7D2FE" : "#E5EAF2"}`, background: acc.isPrimary ? "#F8FAFF" : "#fff" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {acc.isPrimary && <Star size={13} className="fill-indigo-500 text-indigo-500" />}
                <span className="text-sm font-semibold text-gray-900">
                  {acc.paymentMethod === "MFS"
                    ? `${acc.mfsProvider ?? "MFS"} · ${acc.mfsNumber ?? "—"}`
                    : `${acc.bank ?? "Bank"}${acc.branch ? ` — ${acc.branch}` : ""}`}
                </span>
                {acc.verified && <BadgeCheck size={14} className="text-green-600" />}
              </div>
              {canEdit && (
                <div className="flex items-center gap-2 text-gray-400">
                  <button className="hover:text-indigo-600" title="Edit" onClick={() => { setError(null); setDialog({ mode: "edit", row: acc }); }}>
                    ✎
                  </button>
                  <button className="hover:text-red-600" title="Remove" onClick={() => onRemove(acc.id)}>
                    ✕
                  </button>
                </div>
              )}
            </div>
            <div className="mt-1.5 text-xs text-gray-500">
              {acc.paymentMethod === "MFS" ? (
                <span>Mobile financial service{acc.isPrimary ? " · primary" : ""}</span>
              ) : (
                <span>
                  {acc.holderName ? `${acc.holderName} · ` : ""}
                  {acc.accountNumber ?? "—"}
                  {acc.routingNumber ? ` · routing ${acc.routingNumber}` : ""}
                  {acc.accountType ? ` · ${acc.accountType}` : ""}
                  {acc.isPrimary ? " · primary" : ""}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {dialog && (
        <BankAccountDialog
          mode={dialog.mode}
          row={dialog.row}
          loading={busy}
          onSave={save}
          onClose={() => setDialog(null)}
        />
      )}
    </SectionCard>
  );
}

function BankAccountDialog({
  mode,
  row,
  loading,
  onSave,
  onClose,
}: {
  mode: "add" | "edit";
  row?: HrBankAccount;
  loading: boolean;
  onSave: (values: Record<string, unknown>) => Promise<unknown> | void;
  onClose: () => void;
}) {
  // Real bank master data — hooks from features/bankApi.ts.
  const banksQuery = useGetBanksQuery();
  const [form, setForm] = useState<BankFormState>(EMPTY_FORM);

  // Prefill from the stored account. HrBankAccount stores bank/branch as
  // NAME strings, so resolve them back to ids against the master data.
  useEffect(() => {
    if (mode !== "edit" || !row) return;
    setForm({
      paymentMethod: row.paymentMethod ?? "BANK",
      holderName: row.holderName ?? "",
      bankId: "",
      branchId: "",
      routingNumber: row.routingNumber ?? "",
      accountNumber: row.accountNumber ?? "",
      accountType: row.accountType ?? "SALARY",
      mfsProvider: row.mfsProvider ?? "",
      mfsNumber: row.mfsNumber ?? "",
      isPrimary: Boolean(row.isPrimary),
    });
    setPendingBankName(row.bank ?? "");
    setPendingBranchName(row.branch ?? "");
  }, [mode, row?.id]);

  // The bank list arrives asynchronously — resolve the stored bank NAME to
  // its id once the list is available (edit mode only).
  const [pendingBankName, setPendingBankName] = useState("");
  const [pendingBranchName, setPendingBranchName] = useState("");
  const bankRows = useMemo(() => banksQuery.data?.data ?? [], [banksQuery.data]);

  useEffect(() => {
    if (!pendingBankName || bankRows.length === 0) return;
    const match = bankRows.find((b) => b.name === pendingBankName || b.code === pendingBankName);
    if (match) setForm((f) => ({ ...f, bankId: match.id }));
    setPendingBankName("");
  }, [pendingBankName, bankRows]);

  const bankOptions: SelectOption[] = useMemo(
    () => bankRows.filter((b) => b.isActive !== false).map((b) => ({ value: b.id, label: b.name, sub: b.code ?? undefined })),
    [bankRows]
  );

  // Branch list is filtered by the chosen bank (skipped until one is picked).
  const branchesQuery = useGetBranchesByBankQuery(form.bankId, { skip: !form.bankId });
  const branchRows = useMemo(() => branchesQuery.data?.data ?? [], [branchesQuery.data]);

  // Resolve the stored branch NAME to its id once that bank's branches arrive.
  useEffect(() => {
    if (!pendingBranchName || branchRows.length === 0) return;
    const match = branchRows.find((b) => b.branchName === pendingBranchName);
    if (match) setForm((f) => ({ ...f, branchId: match.id }));
    setPendingBranchName("");
  }, [pendingBranchName, branchRows]);

  const branchOptions: SelectOption[] = useMemo(
    () => branchRows.filter((b) => b.isActive !== false).map((b) => ({ value: b.id, label: b.branchName, sub: b.routingNumber ?? undefined })),
    [branchRows]
  );

  const isBank = form.paymentMethod === "BANK";
  const isMfs = form.paymentMethod === "MFS";

  function setPaymentMethod(v: string) {
    // Switching away from BANK drops the bank-only fields; switching to MFS
    // keeps the wallet fields.
    setForm((f) => ({ ...f, paymentMethod: v }));
  }

  function selectBank(bankId: string) {
    // A different bank invalidates the branch and routing choices.
    setForm((f) => ({ ...f, bankId, branchId: "", routingNumber: "" }));
  }

  function selectBranch(branchId: string) {
    const branch = branchRows.find((b) => b.id === branchId);
    setForm((f) => ({ ...f, branchId, routingNumber: branch?.routingNumber ?? f.routingNumber }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bank = bankRows.find((b) => b.id === form.bankId);
    const branch = branchRows.find((b) => b.id === form.branchId);
    // Payload matches the backend bankFields schema: empty optional fields
    // are omitted (undefined), never "".
    const values: Record<string, unknown> = {
      paymentMethod: form.paymentMethod,
      holderName: form.holderName.trim() || undefined,
      isPrimary: form.isPrimary,
    };
    if (isBank) {
      values.bank = bank?.name ?? undefined;
      values.branch = branch?.branchName ?? undefined;
      values.accountNumber = form.accountNumber.trim() || undefined;
      values.routingNumber = form.routingNumber.trim() || undefined;
      values.accountType = form.accountType || undefined;
    } else if (isMfs) {
      values.mfsProvider = form.mfsProvider || undefined;
      values.mfsNumber = form.mfsNumber.trim() || undefined;
    }
    await onSave(values);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === "add" ? "Add Bank / MFS account" : "Edit Bank / MFS account"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Payment method <span className="text-red-600">*</span></label>
              <select className={inputCls} value={form.paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
                {PAYMENT_METHODS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Account holder</label>
              <input className={inputCls} type="text" value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} />
            </div>

            {isBank && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Bank</label>
                  <SearchableSelect
                    options={bankOptions}
                    value={form.bankId}
                    onChange={selectBank}
                    placeholder={banksQuery.isLoading ? "Loading banks…" : "— Select bank —"}
                    small
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Branch</label>
                  <SearchableSelect
                    options={branchOptions}
                    value={form.branchId}
                    onChange={selectBranch}
                    placeholder={!form.bankId ? "Select a bank first" : branchesQuery.isLoading ? "Loading branches…" : "— Select branch —"}
                    disabled={!form.bankId}
                    small
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Routing number</label>
                  <input
                    className={inputCls}
                    type="text"
                    value={form.routingNumber}
                    onChange={(e) => setForm({ ...form, routingNumber: e.target.value })}
                    placeholder="Auto-filled from the branch — editable"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Account number</label>
                  <input className={inputCls} type="text" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Account type</label>
                  <select className={inputCls} value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
                    <option value="">— select —</option>
                    {ACCOUNT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {isMfs && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">MFS provider</label>
                  <select className={inputCls} value={form.mfsProvider} onChange={(e) => setForm({ ...form, mfsProvider: e.target.value })}>
                    <option value="">— select —</option>
                    {MFS_PROVIDERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Wallet number</label>
                  <input className={inputCls} type="text" value={form.mfsNumber} onChange={(e) => setForm({ ...form, mfsNumber: e.target.value })} />
                </div>
              </>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
              <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
              Primary account — use this account for salary disbursement
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
