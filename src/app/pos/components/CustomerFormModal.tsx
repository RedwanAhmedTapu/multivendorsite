// app/pos/components/CustomerFormModal.tsx
"use client";

// Customer add/edit, ported from the prototype's tabbed dialog:
// centred 80vw × 80vh workspace on desktop (80dvh once a mobile keyboard is
// open), fixed header / tabs / footer with only the body scrolling, and the
// fields in two columns. The form state lives here as one object, so switching
// tabs or typing in Credit Limit never remounts an input and never loses
// focus — the loan summary below the inputs is derived from that same state.
// Saving sends the editable whitelist only (lib/pos/customer); balances such as
// due, loanBalance, walletBalance, orders and spent belong to the sale flow and
// the server refuses them anyway.

import { useState } from "react";
import type { ReactNode } from "react";
import { Save, X } from "lucide-react";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  type PosCustomer,
} from "@/features/posApi";
import {
  CREDIT_SCORES,
  customerFormError,
  customerPayload,
  initialCustomerForm,
  loanSummaryFor,
  type CustomerFormState,
} from "@/lib/pos/customer";
import { fmt, inputCls, labelCls } from "../ui";

const TABS = [
  { icon: "👤", label: "Basic Info" },
  { icon: "🪪", label: "Identity" },
  { icon: "💳", label: "Loan/Credit" },
] as const;

/** Declared once, outside the dialog, so typing never remounts a field. */
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const footerBtnCls = "px-4 py-2 text-xs font-semibold rounded-xl transition-all disabled:opacity-50";

export default function CustomerFormModal({
  editData,
  canSetCredit = false,
  focusLoan = false,
  onClose,
  onSaved,
}: {
  editData?: PosCustomer | null;
  /** posCredit (owner, or staff with POS Credit Sales). Without it the form never sends credit terms. */
  canSetCredit?: boolean;
  /** Open on the Loan/Credit tab (the terminal's "Enable Loan" action). */
  focusLoan?: boolean;
  onClose: () => void;
  onSaved: (customer: PosCustomer) => void;
}) {
  const [tab, setTab] = useState(focusLoan ? 2 : 0);
  const [form, setForm] = useState<CustomerFormState>(() => initialCustomerForm(editData));
  const [error, setError] = useState("");

  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();
  const busy = creating || updating;

  const upd = (k: keyof CustomerFormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Server-owned balances, only ever displayed; the payload never carries them.
  const balance = Number(editData?.due ?? editData?.loanBalance) || 0;
  const summary = loanSummaryFor(form.loanLimit, balance, form.loanInterestRate);

  const handleSave = async () => {
    const problem = customerFormError(form, canSetCredit);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const body = customerPayload(form, canSetCredit);
    try {
      if (editData) {
        const res = await updateCustomer({ id: editData.id, ...body }).unwrap();
        onSaved(res.data);
      } else {
        const res = await createCustomer(body).unwrap();
        onSaved(res.data);
      }
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      setError(message || "Failed to save customer");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editData ? "Edit customer" : "Add customer"}
        className="bg-white shadow-2xl border border-cyan-100 w-[80vw] max-w-none h-[80vh] max-h-[80dvh] rounded-[20px] flex flex-col overflow-hidden"
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-lg shadow-md shadow-blue-200 shrink-0">
              {editData ? "✏️" : "➕"}
            </div>
            <div className="font-bold text-slate-800 truncate">{editData ? "Edit Customer" : "Add Customer"}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* tabs */}
        <div role="tablist" aria-label="Customer sections" className="flex gap-1 px-5 border-b border-slate-100 shrink-0">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={`-mb-px px-3 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                tab === i ? "border-cyan-500 text-cyan-600" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* body: the only scrolling region */}
        <div role="tabpanel" className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {tab === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input
                  aria-label="Full name"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => upd("name", e.target.value)}
                  placeholder="Customer's full name"
                  maxLength={120}
                />
              </Field>
              <Field label="Phone" required>
                <input
                  aria-label="Phone"
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => upd("phone", e.target.value)}
                  placeholder="01XXX-XXXXXX"
                  maxLength={20}
                />
              </Field>
              <Field label="Address">
                <textarea
                  aria-label="Address"
                  rows={3}
                  className={inputCls + " resize-none"}
                  value={form.address}
                  onChange={(e) => upd("address", e.target.value)}
                  placeholder="Full address"
                  maxLength={500}
                />
              </Field>
              <Field label="Internal Note">
                <textarea
                  aria-label="Internal note"
                  rows={3}
                  className={inputCls + " resize-none"}
                  value={form.note}
                  onChange={(e) => upd("note", e.target.value)}
                  placeholder="VIP, preferences..."
                  maxLength={500}
                />
              </Field>
            </div>
          )}

          {tab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email">
                  <input
                    aria-label="Email"
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => upd("email", e.target.value)}
                    placeholder="customer@email.com"
                    maxLength={120}
                  />
                </Field>
                <Field label="NID">
                  <input
                    aria-label="NID"
                    className={inputCls + " font-mono"}
                    value={form.nid}
                    onChange={(e) => upd("nid", e.target.value)}
                    placeholder="National ID number"
                    maxLength={17}
                  />
                </Field>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-4">
                <div className="text-[11px] font-bold text-blue-600">🔗 Referral</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Referrer Name">
                    <input
                      aria-label="Referrer name"
                      className={inputCls}
                      value={form.referrerName}
                      onChange={(e) => upd("referrerName", e.target.value)}
                      placeholder="Who referred this customer"
                      maxLength={120}
                    />
                  </Field>
                  <Field label="Referrer Email">
                    <input
                      aria-label="Referrer email"
                      type="email"
                      className={inputCls}
                      value={form.referrerEmail}
                      onChange={(e) => upd("referrerEmail", e.target.value)}
                      placeholder="referrer@email.com"
                      maxLength={120}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {tab === 2 &&
            (!canSetCredit ? (
              <div className="space-y-4">
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="text-xs font-bold text-red-700">🚫 Permission Required</div>
                  <p className="text-[11px] text-red-600 mt-1">Contact Admin to manage loan settings.</p>
                </div>
                {editData && (Number(editData.loanLimit) > 0 || balance > 0) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Credit limit</span>
                      <span className="font-bold text-slate-700">{fmt(editData.loanLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding</span>
                      <span className="font-bold text-slate-700">{fmt(balance)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] font-semibold text-amber-700">
                  ⚠️ Verify NID before enabling credit.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Credit Limit" hint="0 = no credit facility.">
                    <input
                      id="pos-customer-credit-limit"
                      aria-label="Credit limit"
                      type="number"
                      min={0}
                      step="0.01"
                      className={inputCls}
                      value={form.loanLimit}
                      onChange={(e) => upd("loanLimit", e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Balance" hint="Outstanding due, managed by sales.">
                    <div
                      aria-label="Loan balance"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-slate-600"
                    >
                      {fmt(balance)}
                    </div>
                  </Field>
                  <Field label="Interest Rate (%/yr)">
                    <input
                      aria-label="Interest rate"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      className={inputCls}
                      value={form.loanInterestRate}
                      onChange={(e) => upd("loanInterestRate", e.target.value)}
                      placeholder="12"
                    />
                  </Field>
                  <Field label="Tenure (days)">
                    <input
                      aria-label="Tenure"
                      type="number"
                      min={0}
                      max={3650}
                      step="1"
                      className={inputCls}
                      value={form.loanTenureDays}
                      onChange={(e) => upd("loanTenureDays", e.target.value)}
                      placeholder="30"
                    />
                  </Field>
                </div>
                <Field label="Credit Score">
                  <select
                    aria-label="Credit score"
                    className={inputCls}
                    value={form.creditScore}
                    onChange={(e) => upd("creditScore", e.target.value)}
                  >
                    {CREDIT_SCORES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                {summary.limit > 0 && (
                  <div aria-label="Loan summary" className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
                    <div className="text-[11px] font-bold text-cyan-700 mb-2.5">💳 Loan Summary</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Available Credit</div>
                        <div className="font-mono text-sm font-extrabold text-green-600">{fmt(summary.available)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Monthly Interest</div>
                        <div className="font-mono text-sm font-extrabold text-amber-600">{fmt(summary.monthlyInterest)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Utilization</div>
                        <div className="font-mono text-sm font-extrabold text-slate-700">{summary.utilization}%</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-white overflow-hidden">
                      <div
                        className={`h-full rounded-full ${summary.utilization > 80 ? "bg-rose-500" : "bg-cyan-500"}`}
                        style={{ width: `${Math.min(summary.utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

          {error && (
            <div role="alert" className="mt-3 text-xs font-semibold text-red-600">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* footer: always visible, so Back / Next / Save never scroll away */}
        <div
          className="flex items-center justify-between gap-2.5 px-5 py-3.5 border-t border-slate-100 shrink-0"
          style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => (tab > 0 ? setTab((t) => t - 1) : onClose())}
            className={`${footerBtnCls} text-slate-500 border border-slate-200 hover:bg-slate-50`}
          >
            {tab > 0 ? "← Back" : "Cancel"}
          </button>
          {tab < 2 ? (
            <button
              onClick={() => setTab((t) => t + 1)}
              className={`flex-1 ${footerBtnCls} bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={busy}
              className={`flex-1 ${footerBtnCls} bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200 flex items-center justify-center gap-1.5`}
            >
              <Save size={13} /> {busy ? "Saving..." : "Save Customer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}