"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className = "",
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(
    (o) =>
      !q ||
      o.label.toLowerCase().includes(q.toLowerCase()) ||
      (o.sub || "").toLowerCase().includes(q.toLowerCase())
  );

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQ("");
        }}
        className="w-full flex items-center justify-between bg-white border border-cyan-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all hover:border-cyan-300"
      >
        <span className={selected ? "text-slate-700" : "text-slate-400"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-cyan-100 rounded-xl shadow-xl shadow-blue-100/60 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center italic">No results</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 hover:bg-cyan-50 transition-colors ${
                    o.value === value ? "bg-cyan-50" : ""
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      o.value === value ? "text-cyan-700" : "text-slate-700"
                    }`}
                  >
                    {o.label}
                  </span>
                  {o.sub && <span className="text-[10px] text-slate-400">{o.sub}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
