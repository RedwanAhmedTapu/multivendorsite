"use client";
import { useState, useRef, useEffect } from "react";
import { Supplier } from "../types/purchase";

interface Props {
  suppliers: Supplier[];
  selected: Supplier | null;
  onSelect: (s: Supplier) => void;
  supplierDues: Record<string, number>;
}

export default function SupplierSearch({
  suppliers,
  selected,
  onSelect,
  supplierDues,
}: Props) {
  const [query, setQuery] = useState(selected?.name || "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setQuery(selected.name);
    else setQuery("");
  }, [selected]);

  const filtered = query.trim()
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.email.toLowerCase().includes(query.toLowerCase())
      )
    : suppliers;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        type="text"
        value={query}
        placeholder="Type to search..."
        autoComplete="off"
        className="w-full bg-white border border-[#D0CEC6] rounded-[8px] px-[10px] py-[7px] text-[13px] text-[#1A1916] outline-none transition-all duration-150 focus:border-[#1D6B45] focus:shadow-[0_0_0_3px_rgba(29,107,69,0.1)]"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div className="absolute top-[calc(100%+3px)] left-0 right-0 bg-white border border-[#D0CEC6] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-[300] max-h-[210px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-[9px] text-[13px] text-[#9B9890] italic">
              No suppliers found
            </div>
          ) : (
            filtered.map((s) => {
              const due = supplierDues[s.id] || 0;
              return (
                <div
                  key={s.id}
                  className="px-3 py-[9px] cursor-pointer hover:bg-[#F9F8F5] transition-colors duration-100"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery(s.name);
                    setOpen(false);
                    onSelect(s);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#1A1916]">
                      {s.name}
                    </span>
                    {due > 0 && (
                      <span className="text-[10px] px-[6px] py-[1px] rounded-[10px] bg-[#FEF6E7] text-[#92600A] font-semibold">
                        DUE ${due.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-[11.5px] text-[#9B9890]">
                    {s.phone} · {s.email}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}