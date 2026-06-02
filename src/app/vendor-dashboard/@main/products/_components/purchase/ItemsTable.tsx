"use client";
import { Trash2 } from "lucide-react";
import { PurchaseItem } from "@/types/purchase.types";

interface Props {
  items: PurchaseItem[];
  onQtyChange: (id: string, qty: number) => void;
  onCostChange: (id: string, cost: number) => void;
  onSellPriceChange: (id: string, price: number) => void;
  onExpiryChange: (id: string, expiry: string) => void;
  onRemove: (id: string) => void;
}

export default function ItemsTable({
  items,
  onQtyChange,
  onCostChange,
  onSellPriceChange,
  onExpiryChange,
  onRemove,
}: Props) {
  if (items.length === 0) {
    return (
      <tr id="empty-row">
        <td colSpan={10} className="text-center py-7 text-[#9B9890] text-[13px]">
          No items — click <strong>Add Product</strong>
        </td>
      </tr>
    );
  }

  return (
    <>
      {items.map((item, idx) => {
        const isBelowAvg =
          item.sellPrice > 0 &&
          item.newAvgCost > 0 &&
          item.sellPrice < item.newAvgCost;

        return (
          <tr key={item.id} className="group">
            <td className="text-[#9B9890] text-[11.5px] text-center px-[7px] py-[5px]">
              {idx + 1}
            </td>

            {/* Product */}
            <td className="px-[7px] py-[5px]">
              <div className="flex items-center gap-2">
                <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-[#F9F8F5] to-[#E4E2DB] border border-[#E4E2DB] flex items-center justify-center text-[15px] flex-shrink-0">
                  {item.image || "📦"}
                </div>
                <div>
                  <div className="text-[12.5px] font-medium text-[#1A1916]">
                    {item.productName}
                  </div>
                  <div className="text-[11px] text-[#5C5A54]">
                    {item.variantName}
                  </div>
                </div>
              </div>
            </td>

            {/* SKU */}
            <td className="px-[7px] py-[5px]">
              <span className="font-mono text-[11.5px] text-[#1A4F7A]">
                {item.sku}
              </span>
            </td>

            {/* Qty */}
            <td className="px-[7px] py-[5px]">
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) =>
                  onQtyChange(item.id, Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-[55px] bg-white border border-[#D0CEC6] rounded-[6px] px-2 py-[5px] text-[13px] text-center outline-none focus:border-[#1D6B45] focus:shadow-[0_0_0_2px_rgba(29,107,69,0.1)]"
              />
            </td>

            {/* Unit Cost */}
            <td className="px-[7px] py-[5px]">
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={item.unitCost || ""}
                onChange={(e) => onCostChange(item.id, parseFloat(e.target.value) || 0)}
                className="w-[75px] bg-white border border-[#D0CEC6] rounded-[6px] px-2 py-[5px] text-[13px] outline-none focus:border-[#1D6B45] focus:shadow-[0_0_0_2px_rgba(29,107,69,0.1)]"
              />
            </td>

            {/* Expiry */}
            <td className="px-[7px] py-[5px]">
              <input
                type="date"
                value={item.expiry}
                onChange={(e) => onExpiryChange(item.id, e.target.value)}
                className="w-[108px] bg-white border border-[#D0CEC6] rounded-[6px] px-2 py-[5px] text-[13px] outline-none focus:border-[#1D6B45] focus:shadow-[0_0_0_2px_rgba(29,107,69,0.1)]"
              />
            </td>

            {/* New Avg Cost */}
            <td className="px-[7px] py-[5px]">
              {item.unitCost > 0 ? (
                <div
                  title={`Weighted avg: $${item.newAvgCost.toFixed(2)}`}
                  className="bg-[#EBF2FA] text-[#1A4F7A] border border-[#c5ddf0] px-[7px] py-[3px] rounded-[5px] text-[11.5px] font-mono font-medium text-center cursor-help whitespace-nowrap"
                >
                  ${item.newAvgCost.toFixed(2)}
                </div>
              ) : (
                <span className="text-[#9B9890] text-[12px] ml-1">—</span>
              )}
            </td>

            {/* Sell Price */}
            <td className="px-[7px] py-[5px]">
              <input
                type="number"
                min={0}
                step="0.01"
                value={item.sellPrice || ""}
                onChange={(e) =>
                  onSellPriceChange(item.id, parseFloat(e.target.value) || 0)
                }
                title={
                  isBelowAvg
                    ? `⚠ Below avg cost ($${item.newAvgCost.toFixed(2)})`
                    : ""
                }
                className={`w-[75px] border rounded-[6px] px-2 py-[5px] text-[13px] outline-none focus:shadow-[0_0_0_2px_rgba(29,107,69,0.1)] transition-colors ${
                  isBelowAvg
                    ? "border-[#C0392B] bg-[#FDF0EE] focus:border-[#C0392B]"
                    : "border-[#D0CEC6] bg-white focus:border-[#1D6B45]"
                }`}
              />
            </td>

            {/* Total */}
            <td className="px-[7px] py-[5px] text-right font-mono text-[13px] font-medium text-[#1A1916]">
              ${item.total.toFixed(2)}
            </td>

            {/* Remove */}
            <td className="px-[7px] py-[5px]">
              <button
                onClick={() => onRemove(item.id)}
                className="text-[#9B9890] hover:text-[#C0392B] hover:bg-[#FDF0EE] p-[3px] rounded-[4px] transition-all duration-150 flex items-center justify-center"
              >
                <Trash2 size={13} />
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}