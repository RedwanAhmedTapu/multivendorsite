// app/pos/components/modals/ReceiptModal.tsx
"use client";

import { ChevronRight, Printer, X, CheckCircle, AlertTriangle } from "lucide-react";
import type { PosSale } from "@/features/posApi";
import { Badge, fmt, fmtD } from "../ui";

export default function ReceiptModal({
  sale,
  storeName,
  vendorId,
  onClose,
  onNewSale,
}: {
  sale: PosSale;
  storeName: string;
  vendorId: string;
  onClose: () => void;
  onNewSale: () => void;
}) {
  const ledgerEntries = sale.accountingVoucherId
    ? (sale as any).accountingVoucher?.ledgerEntries ?? []
    : [];
  const totalDR = ledgerEntries.reduce((s: number, e: any) => s + Number(e.debitAmount ?? 0), 0);
  const totalCR = ledgerEntries.reduce((s: number, e: any) => s + Number(e.creditAmount ?? 0), 0);
  const balanced = Math.abs(totalDR - totalCR) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl border border-cyan-100 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {sale.dueAmount > 0 ? (
              <>
                <AlertTriangle size={18} className="text-amber-500" />
                <span className="font-bold text-slate-700">Credit Sale Recorded</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} className="text-green-500" />
                <span className="font-bold text-slate-700">Payment Successful</span>
              </>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 font-mono text-xs">
            <div className="text-center mb-3">
              <div className="text-lg font-bold">🏪 {storeName}</div>
              <div className="text-slate-400 text-[10px]">
                FinixMart · {vendorId}
                <br />
                {new Date(sale.saleDate).toLocaleString()}
              </div>
            </div>
            <hr className="border-dashed border-slate-300 my-3" />
            <div className="space-y-1">
              <div className="flex justify-between"><span>Invoice #</span><b>{sale.invoiceNo}</b></div>
              <div className="flex justify-between"><span>Voucher #</span><b className="text-teal-600">{sale.voucherNo}</b></div>
              <div className="flex justify-between"><span>Customer</span><span>{sale.customer?.name ?? "Walk-in"}</span></div>
              <div className="flex justify-between"><span>Payment</span><span>{sale.paymentMethod}</span></div>
            </div>
            <hr className="border-dashed border-slate-300 my-3" />
            <div className="space-y-1">
              {sale.items.map((it) => (
                <div key={it.id} className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <span className="truncate">{it.icon ?? "•"} {it.name}</span>
                  <span className="text-slate-400">×{it.qty}</span>
                  <span className="text-right">{fmt(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <hr className="border-dashed border-slate-300 my-3" />
            <div className="space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(sale.subtotal)}</span></div>
              <div className="flex justify-between"><span>VAT</span><span>{fmt(sale.taxAmount)}</span></div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>-{fmt(sale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-slate-400 pt-2 mt-1">
                <span>Net Billing</span><span>{fmt(sale.netBilling)}</span>
              </div>
              {sale.paidAmount > 0 && (
                <div className="flex justify-between"><span>Paid</span><span className="text-green-700 font-bold">{fmt(sale.paidAmount)}</span></div>
              )}
              {sale.dueAmount > 0 ? (
                <div className="flex justify-between font-bold text-amber-600"><span>Due</span><span>{fmt(sale.dueAmount)}</span></div>
              ) : (
                <div className="flex justify-between text-green-600 font-bold"><span>✓ Fully Paid</span><span></span></div>
              )}
            </div>
            <div className="text-center text-slate-400 text-[10px] mt-4">Thank you for your purchase!</div>
          </div>

          {ledgerEntries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-slate-700">📒 Accounting Voucher</span>
                {balanced ? <Badge color="green">✓ Balanced</Badge> : <Badge color="red">⚠ Check</Badge>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="px-3 py-2 text-left w-12">Type</th>
                      <th className="px-3 py-2 text-left">Account</th>
                      <th className="px-3 py-2 text-right w-24">Debit</th>
                      <th className="px-3 py-2 text-right w-24">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.map((e: any) => (
                      <tr key={e.id} className="border-b border-slate-50">
                        <td className="px-3 py-2">
                          <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${Number(e.debitAmount) > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {Number(e.debitAmount) > 0 ? "DR" : "CR"}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-700">{e.account?.name ?? "—"}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-red-600">
                          {Number(e.debitAmount) > 0 ? fmtD(Number(e.debitAmount)) : ""}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-green-600">
                          {Number(e.creditAmount) > 0 ? fmtD(Number(e.creditAmount)) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800 text-white">
                      <td colSpan={2} className="px-3 py-2 font-bold">TOTAL</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{fmtD(totalDR)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{fmtD(totalCR)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100 shrink-0 flex-wrap">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all" onClick={() => window.print()}>
            <Printer size={13} /> Print
          </button>
          <button
            onClick={onNewSale}
            className="ml-auto flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-200 transition-all"
          >
            Done & New Sale <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}