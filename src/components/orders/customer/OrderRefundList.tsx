// src/components/orders/customer/OrderRefundList.tsx
//
// Refunds on the customer's order — only the persisted Refund rows and their
// stored status (PENDING … REFUNDED / FAILED / REJECTED / CANCELLED).

import { RefreshCcw } from "lucide-react";

import type { OrderRefund } from "@/features/userorderApi";
import { TONE_BADGE, formatTaka, refundCopy, sortRefunds } from "@/lib/orders/customer-order-actions";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function OrderRefundList({ refunds }: { refunds: OrderRefund[] | undefined }) {
  const rows = sortRefunds(refunds);
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="order-refunds-title" className="mt-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <RefreshCcw className="size-4 text-slate-400" aria-hidden />
        <h2 id="order-refunds-title" className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Refunds
        </h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => {
          const c = refundCopy(r.status);
          return (
            <li key={r.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{formatTaka(r.amount)}</p>
                {c.description ? <p className="mt-0.5 text-sm text-slate-600">{c.description}</p> : null}
                {r.reason ? <p className="mt-0.5 break-words text-xs text-slate-400">Reason: {r.reason}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_BADGE[c.tone]}`}>{c.label}</span>
                <span className="text-xs text-slate-400">Requested {fmtDate(r.createdAt)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
