"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sub?: string;
  group?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  small?: boolean;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "— Select —",
  small = false,
  className = "",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : placeholder;

  const filtered = query
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sub || "").toLowerCase().includes(query.toLowerCase())
      )
    : options;

  // Group options
  const grouped: { group: string | null; items: SelectOption[] }[] = [];
  filtered.forEach((o) => {
    const g = o.group || null;
    const existing = grouped.find((x) => x.group === g);
    if (existing) existing.items.push(o);
    else grouped.push({ group: g, items: [o] });
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
    if (!open) {
      setQuery("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`
          w-full text-left bg-white border border-[#D0CEC6] rounded-lg text-[#1A1916]
          transition-all duration-150 outline-none appearance-none pr-7
          ${small ? "text-xs px-2 py-[5px]" : "text-[13px] px-[10px] py-[7px]"}
          ${open ? "border-[#1D6B45] ring-2 ring-[#1D6B45]/10" : "hover:border-[#9B9890]"}
          ${disabled ? "bg-[#F9F8F5] text-[#5C5A54] cursor-not-allowed" : "cursor-pointer"}
          focus:border-[#1D6B45] focus:ring-2 focus:ring-[#1D6B45]/10
        `}
      >
        <span className={!selected ? "text-[#9B9890]" : ""}>{displayLabel}</span>
      </button>
      <ChevronDown
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#9B9890]"
        size={12}
        strokeWidth={2.5}
      />

      {open && (
        <div className="absolute top-[calc(100%+3px)] left-0 right-0 bg-white border border-[#D0CEC6] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] z-[400] max-h-[220px] overflow-y-auto">
          {/* Search */}
          <div className="px-[10px] py-[7px] border-b border-[#E4E2DB] sticky top-0 bg-white">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder="Type to search..."
              className="w-full border border-[#D0CEC6] rounded-md px-2 py-[5px] text-[12.5px] outline-none focus:border-[#1D6B45] font-[DM_Sans,sans-serif]"
            />
          </div>
          {/* Options */}
          {grouped.length === 0 ? (
            <div className="px-3 py-2.5 text-[12.5px] text-[#9B9890] italic">No results</div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group || "__none__"}>
                {group && (
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[#9B9890] bg-[#F9F8F5] border-b border-[#E4E2DB]">
                    {group}
                  </div>
                )}
                {items.map((o) => (
                  <div
                    key={o.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(o.value);
                    }}
                    className={`
                      px-3 py-2 cursor-pointer text-[13px] transition-colors flex flex-col gap-0.5
                      ${o.value === value ? "bg-[#EBF4EF] text-[#1D6B45] font-medium" : "hover:bg-[#F9F8F5]"}
                    `}
                  >
                    <span>{o.label}</span>
                    {o.sub && <span className="text-[11px] text-[#9B9890]">{o.sub}</span>}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}