"use client";

interface VoucherEntry {
  type: "DR" | "CR";
  account: string;
  amount: number;
  note: string;
}

interface VoucherPreviewProps {
  title: string;
  narration: string;
  entries: VoucherEntry[];
}

function VoucherPreview({ title, narration, entries }: VoucherPreviewProps) {
  const dr = entries.filter((e) => e.type === "DR").reduce((s, e) => s + e.amount, 0);
  const cr = entries.filter((e) => e.type === "CR").reduce((s, e) => s + e.amount, 0);
  const balanced = Math.abs(dr - cr) < 0.01;

  return (
    <div className="mb-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#5C5A54] mb-[6px]">
        {title}
      </div>
      <div className="bg-[#F9F8F5] border border-[#E4E2DB] rounded-[8px] px-[14px] py-[12px]">
        {entries.map((e, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-[5px] ${
              i < entries.length - 1 ? "border-b border-dashed border-[#E4E2DB]" : ""
            }`}
          >
            <span
              className={`text-[11px] font-semibold px-2 py-[2px] rounded-[12px] font-mono ${
                e.type === "DR"
                  ? "bg-[#FDF0EE] text-[#C0392B]"
                  : "bg-[#EBF4EF] text-[#1D6B45]"
              }`}
            >
              {e.type}
            </span>
            <div className="flex-1 mx-2">
              <div className="text-[12.5px] text-[#1A1916]">{e.account}</div>
              <div className="text-[10.5px] text-[#9B9890]">{e.note}</div>
            </div>
            <span className="font-mono text-[13px] font-semibold text-[#1A1916]">
              ${e.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-[5px]">
        <span className="text-[10.5px] text-[#9B9890] italic">{narration}</span>
        <span
          className={`text-[11px] font-semibold ${
            balanced ? "text-[#1D6B45]" : "text-[#C0392B]"
          }`}
        >
          {balanced ? "✓ Balanced" : "⚠ Unbalanced"}
        </span>
      </div>
    </div>
  );
}

interface AccountingPreviewProps {
  subtotal: number;
  vatRate: number;
  vatLabel: string;
  paidAmount: number;
  poNumber: string;
  supplierName: string | null;
  bankAccountLabel: string;
}

export default function AccountingPreview({
  subtotal,
  vatRate,
  vatLabel,
  paidAmount,
  poNumber,
  supplierName,
  bankAccountLabel,
}: AccountingPreviewProps) {
  if (!subtotal && !supplierName) return null;

  const vat = parseFloat((subtotal * vatRate).toFixed(2));
  const grand = subtotal + vat;
  const supName = supplierName || "Supplier";
  const supCOA = `AP — ${supName} (Liability)`;
  const vatPct = Math.round(vatRate * 100);

  const narr1 = `Purchase from ${supName} | Ref: ${poNumber}`;
  const narr2 = `Payment to ${supName} | Ref: ${poNumber}`;

  const v1entries: VoucherEntry[] = [
    { type: "DR", account: "5010 – Inventory Asset (Goods)", amount: subtotal, note: "Purchase value" },
    { type: "DR", account: vatLabel, amount: vat, note: `VAT ${vatPct}%` },
    { type: "CR", account: supCOA, amount: grand, note: "Total payable to supplier" },
  ];

  const v2entries: VoucherEntry[] =
    paidAmount > 0
      ? [
          { type: "DR", account: supCOA, amount: paidAmount, note: "Reduce payable" },
          { type: "CR", account: bankAccountLabel, amount: paidAmount, note: "Cash/Bank paid" },
        ]
      : [];

  return (
    <div className="bg-white border border-[#E4E2DB] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="px-4 py-[13px] border-b border-[#E4E2DB] flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#1A1916]">
          Accounting Preview
        </span>
        <span className="text-[11px] font-medium px-2 py-[2px] rounded-[20px] bg-[#EBF2FA] text-[#1A4F7A]">
          2 Vouchers
        </span>
      </div>
      <div className="px-[14px] py-[10px]">
        <VoucherPreview title="Voucher 1 — Purchase" narration={narr1} entries={v1entries} />
        {paidAmount > 0 ? (
          <VoucherPreview title="Voucher 2 — Payment" narration={narr2} entries={v2entries} />
        ) : (
          <div className="text-[12px] text-[#9B9890] italic">
            Voucher 2 (Payment) will appear when paid amount is entered
          </div>
        )}
      </div>
    </div>
  );
}