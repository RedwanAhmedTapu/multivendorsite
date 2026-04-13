"use client";

import { useState } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Plus,
  Lock,
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Container } from "@/components/Container";

const BALANCE = 2450.0;
const MIN_WITHDRAW = 100;

const METHODS = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "bank", label: "Bank transfer" },
  { value: "card", label: "Debit / Credit card" },
];

const transactions = [
  { id: 1, label: "Refund — Order #ORD-8821", date: "12 Apr 2026", amount: 250, type: "credit", status: "success" },
  { id: 2, label: "Withdrawal — bKash 017xxxxxxxx", date: "10 Apr 2026", amount: -1000, type: "debit", status: "success" },
  { id: 3, label: "Cashback — Voucher VCH-4421", date: "08 Apr 2026", amount: 120, type: "credit", status: "success" },
  { id: 4, label: "Withdrawal — Nagad 018xxxxxxxx", date: "06 Apr 2026", amount: -350, type: "debit", status: "pending" },
  { id: 5, label: "Withdrawal — Bank — Dutch Bangla", date: "01 Apr 2026", amount: -2500, type: "debit", status: "failed" },
];

const statusStyles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  failed: "bg-red-50 text-red-600 ring-1 ring-red-200",
};

const statusLabel: Record<string, string> = {
  success: "Success",
  pending: "Pending",
  failed: "Failed",
};

type Step = "form" | "success";

export default function WalletPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [account, setAccount] = useState("");
  const [refNo, setRefNo] = useState("");

  const parsedAmount = parseFloat(amount);
  const isValid =
    parsedAmount >= MIN_WITHDRAW &&
    parsedAmount <= BALANCE &&
    method !== "" &&
    account.trim().length >= 5;

  const openModal = () => {
    setStep("form");
    setAmount("");
    setMethod("");
    setAccount("");
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const ref = `TXN-${Math.floor(100000 + Math.random() * 899999)}`;
    setRefNo(ref);
    setStep("success");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
<Container>
        {/* ── Hero Balance Card ── */}
        <div
          className="relative rounded-3xl overflow-hidden p-6 sm:p-8"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-12 -bottom-10 w-32 h-32 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute -left-4 bottom-0 w-24 h-24 rounded-full bg-white/[0.03] pointer-events-none" />

          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-blue-200 mb-2">
            Wallet Balance
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            ৳{BALANCE.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
          </h1>
          <p className="text-xs text-blue-300 mt-1.5 mb-7">
            Last updated: 13 Apr 2026, 10:32 AM
          </p>

          <div className="flex gap-3 relative z-10">
            <button
              onClick={openModal}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold text-sm py-3 rounded-2xl hover:bg-blue-50 active:scale-[0.98] transition-all duration-150 shadow-sm"
            >
              <ArrowUpCircle className="w-4 h-4 shrink-0" />
              Withdraw
            </button>
            <button className="flex-1 inline-flex items-center justify-center gap-2 bg-white/15 border border-white/25 text-white font-semibold text-sm py-3 rounded-2xl hover:bg-white/20 active:scale-[0.98] transition-all duration-150 backdrop-blur-sm">
              <Plus className="w-4 h-4 shrink-0" />
              Top up
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />,
              label: "Received",
              value: "৳8,720",
              valueClass: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              icon: <TrendingDown className="w-3.5 h-3.5 text-red-500" />,
              label: "Withdrawn",
              value: "৳6,270",
              valueClass: "text-red-500",
              bg: "bg-red-50",
            },
            {
              icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
              label: "Pending",
              value: "৳350",
              valueClass: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                {s.icon}
              </div>
              <p className={`text-base font-bold ${s.valueClass} leading-none`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Transactions ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">Recent transactions</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {transactions.map((tx) => {
              const isCredit = tx.type === "credit";
              const isPending = tx.status === "pending";
              const isFailed = tx.status === "failed";

              const iconBg = isCredit
                ? "bg-emerald-50"
                : isPending
                ? "bg-amber-50"
                : isFailed
                ? "bg-red-50"
                : "bg-red-50";

              const Icon = isCredit
                ? ArrowDownCircle
                : isPending
                ? Clock
                : ArrowUpCircle;

              const iconColor = isCredit
                ? "text-emerald-500"
                : isPending
                ? "text-amber-500"
                : "text-red-500";

              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate leading-snug">
                      {tx.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{tx.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isCredit ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {isCredit ? "+" : "−"} ৳
                      {Math.abs(tx.amount).toLocaleString("en-BD", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusStyles[tx.status]}`}
                    >
                      {statusLabel[tx.status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>

      {/* ── Withdraw Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden border border-slate-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">
                {step === "form" ? "Withdraw funds" : "Request submitted"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              {step === "form" ? (
                <div className="space-y-4">
                  {/* Available note */}
                  <div className="flex items-center justify-between bg-blue-50 rounded-2xl px-4 py-3 text-xs">
                    <span className="text-slate-500">Available balance</span>
                    <span className="text-blue-700 font-bold text-sm">
                      ৳{BALANCE.toLocaleString()}
                    </span>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Amount (৳)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                        ৳
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min ৳${MIN_WITHDRAW}`}
                        min={MIN_WITHDRAW}
                        max={BALANCE}
                        className="w-full h-11 border border-slate-200 rounded-2xl pl-8 pr-4 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white"
                      />
                    </div>
                    {amount && (parsedAmount < MIN_WITHDRAW || parsedAmount > BALANCE) && (
                      <p className="text-xs text-red-500 mt-1.5 ml-1">
                        {parsedAmount < MIN_WITHDRAW
                          ? `Minimum withdrawal is ৳${MIN_WITHDRAW}`
                          : `Cannot exceed available balance`}
                      </p>
                    )}
                  </div>

                  {/* Method */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Withdrawal method
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-2xl px-4 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Select a method</option>
                      {METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Account / Card number
                    </label>
                    <input
                      type="text"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full h-11 border border-slate-200 rounded-2xl px-4 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white"
                    />
                  </div>

                  {/* SSLCommerz badge */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Secured by SSLCommerz</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        SSL-encrypted payment gateway
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={!isValid}
                    onClick={handleSubmit}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold rounded-2xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm shadow-blue-200"
                  >
                    Proceed with SSLCommerz
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-1">
                    Withdrawal initiated!
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-xs mx-auto">
                    Your request has been sent to SSLCommerz. Funds arrive within 1–3 business days.
                  </p>

                  <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 mb-5 border border-slate-100">
                    {[
                      { label: "Amount", value: `৳ ${parsedAmount.toFixed(2)}` },
                      { label: "Method", value: METHODS.find((m) => m.value === method)?.label ?? "" },
                      { label: "Reference", value: refNo },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{row.label}</span>
                        <span className="font-semibold text-slate-700">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold rounded-2xl transition-all duration-150 shadow-sm shadow-blue-200"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}