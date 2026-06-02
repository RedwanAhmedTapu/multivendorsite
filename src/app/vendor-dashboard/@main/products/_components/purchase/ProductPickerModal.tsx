"use client";
import { useState, useEffect } from "react";
import { X, ChevronLeft } from "lucide-react";
import { Product, ProductVariant, Category, SelectOption, WAREHOUSE_MAP } from "@/types/purchase.types";
import SearchableSelect from "./SearchableSelect";

interface Props {
  open: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onAdd: (product: Product, variant: ProductVariant) => void;
}

export default function ProductPickerModal({
  open,
  onClose,
  products,
  categories,
  onAdd,
}: Props) {
  const [catFilter, setCatFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setCatFilter("");
      setSelectedProduct(null);
    }
  }, [open]);

  const catOptions: SelectOption[] = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const filtered = products.filter((p) => {
    if (catFilter && p.categoryId !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[12px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-[680px] max-w-[96vw] max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-[18px] py-[14px] border-b border-[#E4E2DB] flex items-center justify-between flex-shrink-0">
          <span className="text-[14px] font-semibold text-[#1A1916]">
            {selectedProduct ? selectedProduct.name : "Select Product"}
          </span>
          <button
            onClick={onClose}
            className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] text-[#5C5A54] hover:bg-[#F9F8F5] transition-colors duration-150"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-[18px] py-[14px] overflow-y-auto flex-1">
          {!selectedProduct ? (
            <>
              {/* Filters */}
              <div className="flex gap-2 mb-3">
                <div className="w-[170px] flex-shrink-0">
                  <SearchableSelect
                    options={catOptions}
                    value={catFilter}
                    onChange={setCatFilter}
                    placeholder="All Categories"
                  />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product..."
                  className="flex-1 bg-white border border-[#D0CEC6] rounded-[8px] px-[10px] py-[7px] text-[13px] outline-none focus:border-[#1D6B45] focus:shadow-[0_0_0_3px_rgba(29,107,69,0.1)]"
                />
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 gap-[9px]">
                {filtered.length === 0 ? (
                  <div className="col-span-2 text-center py-6 text-[13px] text-[#9B9890]">
                    No products found
                  </div>
                ) : (
                  filtered.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className="border-2 border-[#E4E2DB] rounded-[8px] p-[10px] cursor-pointer hover:border-[#1D6B45] hover:bg-[#EBF4EF] transition-all duration-150"
                    >
                      <div className="text-[22px] mb-[5px]">{p.image || "📦"}</div>
                      <div className="text-[13px] font-medium text-[#1A1916]">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-[#9B9890] mt-[2px]">
                        {p.category}
                      </div>
                      <div className="text-[11px] text-[#9B9890] mt-[3px]">
                        {p.variants.length} variant(s)
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Variant View */}
              <div className="flex items-center gap-2 mb-[10px]">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex items-center gap-[5px] text-[12px] text-[#5C5A54] px-[8px] py-[5px] rounded-[8px] border border-[#E4E2DB] bg-white hover:bg-[#F9F8F5] transition-colors duration-150"
                >
                  <ChevronLeft size={12} />
                  Back
                </button>
                <span className="text-[13px] font-semibold text-[#1A1916]">
                  {selectedProduct.name}
                </span>
              </div>

              <div className="bg-[#EBF4EF] border border-[#D1EAD9] rounded-[8px] px-[11px] py-[7px] mb-[10px] text-[12px] text-[#1D6B45]">
                ✓ Click any variant to instantly add it as a purchase row
              </div>

              <div className="flex flex-col gap-0">
                {selectedProduct.variants.map((v) => {
                  const ws = v.warehouseStock || {
                    [v.warehouseId || "wh1"]: v.stock || 0,
                  };
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        onAdd(selectedProduct, v);
                        onClose();
                      }}
                      className="flex items-center justify-between px-3 py-[10px] border border-[#E4E2DB] rounded-[8px] mb-[6px] cursor-pointer hover:border-[#1D6B45] hover:bg-[#EBF4EF] hover:translate-x-[2px] transition-all duration-150"
                    >
                      <div>
                        <div className="text-[13px] font-semibold text-[#1A1916]">
                          {v.name}
                        </div>
                        <div className="font-mono text-[11px] text-[#9B9890] mt-[2px]">
                          {v.sku}
                        </div>
                        <div className="text-[11px] text-[#9B9890] mt-[1px]">
                          {Object.entries(ws).map(([wh, qty]) => (
                            <span key={wh} className="mr-2">
                              {WAREHOUSE_MAP[wh] || wh}:{" "}
                              <strong className="text-[#1D6B45]">{qty}</strong>
                            </span>
                          ))}
                          | Avg:{" "}
                          <strong>${(v.avgCost || 0).toFixed(2)}</strong>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-[10px]">
                        <div className="text-[14px] font-bold font-mono text-[#1A1916]">
                          ${v.price.toFixed(2)}
                        </div>
                        <div className="text-[10px] bg-[#EBF4EF] text-[#1D6B45] px-2 py-[2px] rounded-[10px] font-bold mt-[4px]">
                          + ADD ROW
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-[18px] py-[11px] border-t border-[#E4E2DB] flex items-center justify-between flex-shrink-0">
          <span className="text-[11.5px] text-[#9B9890] italic">
            {selectedProduct
              ? "Click variant to add"
              : "Select a product to see variants"}
          </span>
          <button
            onClick={onClose}
            className="px-[14px] py-[7px] bg-white border border-[#D0CEC6] rounded-[8px] text-[13px] font-medium text-[#1A1916] hover:bg-[#F9F8F5] transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}