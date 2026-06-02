"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sub?: string;
  group?: string;
}

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  small?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "— Select —",
  className = "",
  disabled = false,
  small = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  const filtered = query
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sub || "").toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setTimeout(() => searchRef.current?.focus(), 10);
  };

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setQuery("");
    },
    [onChange]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Group logic
  const groups: string[] = [];
  filtered.forEach((o) => {
    if (o.group && !groups.includes(o.group)) groups.push(o.group);
  });
  const hasGroups = groups.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={open}
        tabIndex={disabled ? -1 : 0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open ? setOpen(false) : handleOpen();
          }
        }}
        className={`
          w-full flex items-center justify-between cursor-pointer select-none
          bg-white border border-[#D0CEC6] rounded-[8px] text-[#1A1916]
          transition-all duration-150 outline-none
          focus:border-[#1D6B45] focus:shadow-[0_0_0_3px_rgba(29,107,69,0.1)]
          ${small ? "px-2 py-[5px] text-[12px]" : "px-[10px] py-[7px] text-[13px]"}
          ${disabled ? "bg-[#F9F8F5] text-[#9B9890] cursor-not-allowed" : "hover:border-[#9B9890]"}
          ${open ? "border-[#1D6B45] shadow-[0_0_0_3px_rgba(29,107,69,0.1)]" : ""}
        `}
      >
        <span className={value ? "text-[#1A1916]" : "text-[#9B9890]"}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={12}
          className={`text-[#9B9890] flex-shrink-0 ml-1 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+3px)] left-0 right-0 bg-white border border-[#D0CEC6] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] z-[400] max-h-[220px] overflow-hidden flex flex-col">
          {/* Search */}
          <div className="sticky top-0 bg-white px-[10px] py-[7px] border-b border-[#E4E2DB]">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder="Type to search..."
              className="w-full border border-[#D0CEC6] rounded-[6px] px-2 py-[5px] text-[12.5px] text-[#1A1916] outline-none focus:border-[#1D6B45] bg-white"
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-[10px] text-[12.5px] text-[#9B9890] italic">
                No results
              </div>
            ) : (
              <>
                {hasGroups ? (
                  groups.map((g) => {
                    const groupOpts = filtered.filter((o) => o.group === g);
                    if (!groupOpts.length) return null;
                    return (
                      <React.Fragment key={g}>
                        <div className="px-3 py-[5px] text-[10px] font-bold uppercase tracking-[0.07em] text-[#9B9890] bg-[#F9F8F5] border-b border-[#E4E2DB]">
                          {g}
                        </div>
                        {groupOpts.map((o) => (
                          <OptionRow key={o.value} option={o} selected={o.value === value} onSelect={handleSelect} />
                        ))}
                      </React.Fragment>
                    );
                  })
                ) : (
                  filtered.map((o) => (
                    <OptionRow key={o.value} option={o} selected={o.value === value} onSelect={handleSelect} />
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionRow({
  option,
  selected,
  onSelect,
}: {
  option: SelectOption;
  selected: boolean;
  onSelect: (v: string) => void;
}) {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(option.value);
      }}
      className={`
        px-3 py-2 cursor-pointer text-[13px] flex flex-col gap-[1px] transition-colors duration-100
        ${selected ? "bg-[#EBF4EF] text-[#1D6B45] font-medium" : "hover:bg-[#F9F8F5] text-[#1A1916]"}
      `}
    >
      <span>{option.label}</span>
      {option.sub && (
        <span className="text-[11px] text-[#9B9890]">{option.sub}</span>
      )}
    </div>
  );
}