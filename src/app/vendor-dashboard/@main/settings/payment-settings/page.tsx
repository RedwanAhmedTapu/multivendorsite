"use client";

import { useMemo, useState,useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  Landmark,
  Smartphone,
  CreditCard,
  Wallet,
  Plus,
  Star,
  StarOff,
  Copy,
  Check,
  X,
  Loader2,
  ShieldCheck,
  ChevronDown,
  Eye,
  EyeOff,
  Building2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetVendorPaymentAccountsQuery,
  useAddVendorPaymentAccountMutation,
  useSetDefaultVendorPaymentAccountMutation,
  type PaymentInstrumentType,
  type MobileBankingProvider,
  type VendorPaymentAccount,
  type AddVendorPaymentAccountRequest,
} from "@/features/vendorManageApi";
// NOTE: no bank-branch listing endpoint was provided in vendorManageApi.ts.
// This assumes a hook shaped like the one below exists somewhere in the
// project (e.g. a bankApi.ts) — swap the import path/hook name to match
// your actual source. It just needs to return
// { data: { data: VendorBankAccountBranch[] } } or similar.
import { useGetBankBranchesQuery } from "@/features/bankApi";

/* ── Static config ─────────────────────────────────────────────────────── */

const TYPE_CONFIG: Record<
  PaymentInstrumentType,
  { label: string; icon: typeof Landmark; accent: string; bg: string; text: string; border: string }
> = {
  BANK: {
    label: "Bank Account",
    icon: Landmark,
    accent: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  MOBILE_BANKING: {
    label: "Mobile Banking",
    icon: Smartphone,
    accent: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  CARD: {
    label: "Card",
    icon: CreditCard,
    accent: "from-violet-500 to-purple-400",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  CASH: {
    label: "Cash",
    icon: Wallet,
    accent: "from-amber-500 to-orange-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

const MOBILE_PROVIDERS: { value: MobileBankingProvider; label: string; color: string }[] = [
  { value: "BKASH", label: "bKash", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "NAGAD", label: "Nagad", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "ROCKET", label: "Rocket", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "UPAY", label: "Upay", color: "bg-red-50 text-red-700 border-red-200" },
  { value: "OTHER", label: "Other", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

const TYPE_TABS: { key: PaymentInstrumentType | "ALL"; label: string }[] = [
  { key: "ALL", label: "All Methods" },
  { key: "BANK", label: "Bank" },
  { key: "MOBILE_BANKING", label: "Mobile Banking" },
  { key: "CARD", label: "Card" },
  { key: "CASH", label: "Cash" },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */

function maskNumber(value?: string | null) {
  if (!value) return "—";
  const last4 = value.slice(-4);
  return `•••• ${last4}`;
}

function accountDisplayNumber(account: VendorPaymentAccount) {
  if (account.type === "BANK") return account.accountNumber;
  if (account.type === "MOBILE_BANKING") return account.walletNumber;
  if (account.type === "CARD") return account.merchantId;
  return null;
}

/* ── Stat card ──────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="text-xl font-extrabold text-slate-800">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Searchable bank-branch select ─────────────────────────────────────── */

function BankBranchSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (branchId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // debounce so we don't fire a request on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useGetBankBranchesQuery({
    branchName: debouncedQ || undefined,
    limit: 20,
  });

  const branches = data?.data ?? [];
  const selected = branches.find((b) => b.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all hover:border-cyan-300"
      >
        <span className={selected ? "text-slate-700" : "text-slate-400"}>
          {selected ? `${selected.bankName ?? "Bank"} — ${selected.branchName}` : "Select bank & branch"}
        </span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-cyan-100 rounded-xl shadow-xl shadow-blue-100/60 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search branch name…"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {isFetching ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">Loading…</div>
            ) : branches.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400 italic">No branches found</div>
            ) : (
              branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onChange(b.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-cyan-50 transition-colors ${
                    b.id === value ? "bg-cyan-50" : ""
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-700">{b.bankName ?? "—"}</div>
                  <div className="text-[10px] text-slate-400">{b.branchName}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Add Payment Method Modal ──────────────────────────────────────────── */

function AddPaymentAccountModal({
  vendorId,
  onClose,
}: {
  vendorId: string;
  onClose: () => void;
}) {
  const [addAccount, { isLoading }] = useAddVendorPaymentAccountMutation();
  const [type, setType] = useState<PaymentInstrumentType>("BANK");
  const [label, setLabel] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  // BANK
  const [bankBranchId, setBankBranchId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // MOBILE_BANKING
  const [mobileProvider, setMobileProvider] = useState<MobileBankingProvider>("BKASH");
  const [walletNumber, setWalletNumber] = useState("");
  const [walletKind, setWalletKind] = useState("Personal");

  // CARD
  const [cardProcessor, setCardProcessor] = useState("");
  const [merchantId, setMerchantId] = useState("");

  const typeTiles: { type: PaymentInstrumentType; icon: typeof Landmark }[] = [
    { type: "BANK", icon: Landmark },
    { type: "MOBILE_BANKING", icon: Smartphone },
    { type: "CARD", icon: CreditCard },
    { type: "CASH", icon: Wallet },
  ];

  const canSubmit = useMemo(() => {
    if (type === "BANK") return !!bankBranchId && !!accountName && !!accountNumber;
    if (type === "MOBILE_BANKING") return !!walletNumber;
    if (type === "CARD") return !!cardProcessor;
    return true; // CASH
  }, [type, bankBranchId, accountName, accountNumber, walletNumber, cardProcessor]);

  const handleSubmit = async () => {
    if (submitting) return;   
  if (!canSubmit) {
    toast.error("Please fill in the required fields.");
    return;
  }
  setSubmitting(true);

    const payload: AddVendorPaymentAccountRequest = {
      type,
      label: label || undefined,
      isDefault,
      ...(type === "BANK" && {
        bankBranchId,
        accountName,
        accountNumber,
      }),
      ...(type === "MOBILE_BANKING" && {
        mobileProvider,
        walletNumber,
        walletKind,
      }),
      ...(type === "CARD" && {
        cardProcessor,
        merchantId: merchantId || undefined,
      }),
    };

    const promise = addAccount({ vendorId, data: payload }).unwrap();
    toast.promise(promise, {
      loading: "Adding payment method…",
      success: () => {
        onClose();
        return "Payment method added successfully";
      },
      error: (err: any) => err?.data?.message || "Failed to add payment method",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm">
              <Plus size={16} className="text-white" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">Add Payment Method</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Method Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {typeTiles.map(({ type: t, icon: Icon }) => {
                const cfg = TYPE_CONFIG[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                      active
                        ? `${cfg.border} ${cfg.bg}`
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        active ? `bg-gradient-to-br ${cfg.accent} text-white` : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <span className={`text-[10px] font-bold ${active ? cfg.text : "text-slate-400"}`}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BANK fields */}
          {type === "BANK" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Bank & Branch
                </label>
                <BankBranchSelect value={bankBranchId} onChange={setBankBranchId} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Account Holder Name
                </label>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Finixmart Trading Co."
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Account Number
                </label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 0123456789012"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>
          )}

          {/* MOBILE_BANKING fields */}
          {type === "MOBILE_BANKING" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MOBILE_PROVIDERS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setMobileProvider(p.value)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                        mobileProvider === p.value
                          ? p.color + " ring-2 ring-offset-1 ring-emerald-200"
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Wallet Number
                </label>
                <input
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Wallet Type
                </label>
                <select
                  value={walletKind}
                  onChange={(e) => setWalletKind(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400"
                >
                  <option>Personal</option>
                  <option>Agent</option>
                  <option>Merchant</option>
                </select>
              </div>
            </div>
          )}

          {/* CARD fields */}
          {type === "CARD" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Card Processor
                </label>
                <input
                  value={cardProcessor}
                  onChange={(e) => setCardProcessor(e.target.value)}
                  placeholder="e.g. SSLCommerz, Stripe"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Merchant ID <span className="text-slate-300 normal-case">(optional)</span>
                </label>
                <input
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  placeholder="Merchant / Store ID"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>
          )}

          {/* CASH — nothing extra needed */}
          {type === "CASH" && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 flex items-center gap-2">
              <Wallet size={16} className="shrink-0" />
              Cash doesn't need any account details — just save it as a payout method.
            </div>
          )}

          {/* Common fields */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Label <span className="text-slate-300 normal-case">(optional)</span>
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Primary payout account"
              className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded"
            />
            <span className="text-sm text-slate-600">Set as default payout method</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !canSubmit}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Save Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Payment Account Card ──────────────────────────────────────────────── */

function PaymentAccountCard({
  account,
  vendorId,
}: {
  account: VendorPaymentAccount;
  vendorId: string;
}) {
  const [setDefault, { isLoading: isSettingDefault }] = useSetDefaultVendorPaymentAccountMutation();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  

  const cfg = TYPE_CONFIG[account.type];
  const Icon = cfg.icon;
  const rawNumber = accountDisplayNumber(account);

  const handleSetDefault = async () => {
    const promise = setDefault({ vendorId, paymentAccountId: account.id }).unwrap();
    toast.promise(promise, {
      loading: "Setting as default…",
      success: "Default payment method updated",
      error: (err: any) => err?.data?.message || "Failed to set default",
    });
  };

  const handleCopy = () => {
    if (!rawNumber) return;
    navigator.clipboard.writeText(rawNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
        account.isDefault ? "border-cyan-300 shadow-cyan-100" : "border-slate-200 shadow-slate-100"
      }`}
    >
      {account.isDefault && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
          <Star size={10} fill="currentColor" /> Default
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.accent} flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon size={19} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                {account.type === "MOBILE_BANKING" && account.mobileProvider
                  ? MOBILE_PROVIDERS.find((p) => p.value === account.mobileProvider)?.label
                  : cfg.label}
              </span>
              {account.isActive ? (
                <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                  <ShieldCheck size={10} /> Active
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Inactive</span>
              )}
            </div>
            <div className="text-sm font-bold text-slate-700 mt-1 truncate">
              {account.label ||
                (account.type === "BANK"
                  ? account.accountName
                  : account.type === "MOBILE_BANKING"
                  ? "Mobile Wallet"
                  : account.type === "CARD"
                  ? "Card Account"
                  : "Cash")}
            </div>
            {account.type === "BANK" && account.bankBranch && (
              <div className="text-[11px] text-slate-400 truncate">
                {account.bankBranch.bank?.name} — {account.bankBranch.branchName}
              </div>
            )}
          </div>
        </div>

        {rawNumber && (
          <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            <span className="font-mono text-sm text-slate-600 tracking-wider">
              {revealed ? rawNumber : maskNumber(rawNumber)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRevealed((r) => !r)}
                className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                title={revealed ? "Hide" : "Reveal"}
              >
                {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                title="Copy"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        {!account.isDefault ? (
          <button
            onClick={handleSetDefault}
            disabled={isSettingDefault}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-xl hover:bg-cyan-100 transition-colors disabled:opacity-60"
          >
            {isSettingDefault ? <Loader2 size={12} className="animate-spin" /> : <StarOff size={12} />}
            Set as Default
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-xl">
            <Star size={12} className="text-cyan-500" fill="currentColor" />
            Currently Default
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */

export default function VendorPaymentAccountsPage() {
  const vendorId = useSelector((state: RootState) => state.auth.user?.vendorId ?? "");
  const [activeTab, setActiveTab] = useState<PaymentInstrumentType | "ALL">("ALL");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetVendorPaymentAccountsQuery(vendorId, {
    skip: !vendorId,
  });
  const accounts = data?.data ?? [];

  const filteredAccounts = useMemo(
    () => (activeTab === "ALL" ? accounts : accounts.filter((a) => a.type === activeTab)),
    [accounts, activeTab],
  );

  const defaultAccount = accounts.find((a) => a.isDefault);
  const activeCount = accounts.filter((a) => a.isActive).length;

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: accounts.length };
    accounts.forEach((a) => {
      counts[a.type] = (counts[a.type] ?? 0) + 1;
    });
    return counts;
  }, [accounts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans">
      {/* ── Top Bar ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30 shadow-sm shadow-blue-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-600 shrink-0">
              <Building2 size={14} />
              <span>Vendor</span>
            </div>
            <ChevronRight size={12} className="shrink-0" />
            <span className="font-semibold text-slate-700 truncate">Payment Accounts</span>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all shrink-0"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Add Method</span>
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Page title ── */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Payment Accounts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage bank accounts, mobile banking, cards, and cash payout methods
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Total Methods"
            value={accounts.length}
            sub={`${activeCount} active`}
            icon={<Wallet size={16} />}
            accent="from-blue-500 to-cyan-400"
          />
          <StatCard
            label="Default Method"
            value={defaultAccount ? TYPE_CONFIG[defaultAccount.type].label : "None set"}
            sub={defaultAccount?.label || "—"}
            icon={<Star size={16} />}
            accent="from-cyan-500 to-emerald-400"
          />
          <StatCard
            label="Bank Accounts"
            value={tabCounts["BANK"] ?? 0}
            sub="linked accounts"
            icon={<Landmark size={16} />}
            accent="from-violet-500 to-purple-400"
          />
          <StatCard
            label="Mobile Wallets"
            value={tabCounts["MOBILE_BANKING"] ?? 0}
            sub="bKash / Nagad / etc."
            icon={<Smartphone size={16} />}
            accent="from-emerald-500 to-teal-400"
          />
        </div>

        {/* ── Type Tabs ── */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 px-2 py-2 mb-5 flex flex-wrap gap-1.5">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm shadow-blue-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-white/20" : "bg-slate-100 text-slate-400"
                }`}
              >
                {tabCounts[tab.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* ── Accounts Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-44 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-slate-100 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 py-20 text-center">
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <Wallet size={40} className="opacity-40" />
              <div className="text-sm font-medium text-slate-400">
                {activeTab === "ALL" ? "No payment methods added yet" : "No methods of this type"}
              </div>
              <button
                onClick={() => setAddModalOpen(true)}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all"
              >
                <Plus size={13} /> Add your first payment method
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => (
              <PaymentAccountCard key={account.id} account={account} vendorId={vendorId} />
            ))}
          </div>
        )}

        {isFetching && !isLoading && (
          <div className="flex items-center justify-center gap-2 text-xs text-cyan-600 mt-4">
            <Loader2 size={12} className="animate-spin" /> Syncing…
          </div>
        )}
      </div>

      {addModalOpen && (
        <AddPaymentAccountModal vendorId={vendorId} onClose={() => setAddModalOpen(false)} />
      )}
    </div>
  );
}