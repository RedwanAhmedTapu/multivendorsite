"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronRight, Search, X, Check, MapPin, RefreshCw } from "lucide-react";
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetThanasQuery,
  useSearchLocationsQuery,
  useGetLocationByIdQuery,
  Location,
} from "@/features/locationApi";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface PickedLocation {
  id: string;
  name: string;
  fullPath: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  selectedId?: string;
  title?: string;
  description?: string;
  accent?: string;
  accentBg?: string;
  accentBorder?: string;
  onSelect: (loc: PickedLocation) => void;
}

/* ─── Shared mini-filter input (mirrors CategoryTreeSelector) ───────────── */

function FilterInput({
  value,
  onChange,
  placeholder = "Filter…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div
      style={{
        padding: "6px 8px",
        borderBottom: "0.5px solid #E2E8F0",
        background: "#F8FAFC",
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      <div style={{ position: "relative" }}>
        <Search
          size={11}
          color="#94A3B8"
          style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            paddingLeft: 24,
            paddingRight: 8,
            paddingTop: 4,
            paddingBottom: 4,
            fontSize: 11,
            color: "#0F172A",
            border: "0.5px solid #CBD5E1",
            borderRadius: 6,
            background: "#FFFFFF",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
}

function ColumnLoading() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 12px", fontSize: 12, color: "#64748B" }}>
      <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
      Loading…
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export function LocationPickerDialog({
  open,
  onClose,
  selectedId,
  title = "Choose location",
  description,
  accent = "#1D4ED8",
  accentBg = "#EFF6FF",
  accentBorder = "#BFDBFE",
  onSelect,
}: Props) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [clickedDivision, setClickedDivision] = useState<Location | null>(null);
  const [clickedDistrict, setClickedDistrict] = useState<Location | null>(null);

  const [divisionFilter, setDivisionFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [thanaFilter, setThanaFilter] = useState("");

  // What's currently confirmed as "selected" for this dialog session
  const [currentPick, setCurrentPick] = useState<PickedLocation | null>(null);

  // Used to resolve ancestors for a location we don't already have the
  // drill-down path for (restoring `selectedId` on open, or picking a
  // search result directly).
  const [resolveId, setResolveId] = useState<string | undefined>(undefined);

  /* ── mount / unmount with animation, mirrors CreateWarehouseModal ── */
  useEffect(() => {
    if (open) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      closeTimer.current = setTimeout(() => {
        setVisible(false);
        setClosing(false);
        // reset transient browse state, keep nothing stale for next open
        setSearchQuery("");
        setDebouncedQuery("");
        setClickedDivision(null);
        setClickedDistrict(null);
        setDivisionFilter("");
        setDistrictFilter("");
        setThanaFilter("");
        setResolveId(undefined);
      }, 220);
    }
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, onClose]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // On open, if we already have a selectedId, resolve it so we can restore
  // the division/district drill-down and show the current pick.
  useEffect(() => {
    if (open && selectedId) {
      setResolveId(selectedId);
    }
  }, [open, selectedId]);

  /* ── Data fetching ── */
  const { data: divisionsData, isLoading: divisionsLoading } = useGetDivisionsQuery(undefined, { skip: !visible });
  const { data: districtsData, isLoading: districtsLoading } = useGetDistrictsQuery(clickedDivision?.id, {
    skip: !visible || !clickedDivision,
  });
  const { data: thanasData, isLoading: thanasLoading } = useGetThanasQuery(clickedDistrict?.id, {
    skip: !visible || !clickedDistrict,
  });
  const { data: searchData, isLoading: searchLoading } = useSearchLocationsQuery(
    { query: debouncedQuery },
    { skip: !visible || !debouncedQuery }
  );
  const { data: resolvedData } = useGetLocationByIdQuery(resolveId as string, { skip: !resolveId });

  const divisions = divisionsData?.data || [];
  const districts = districtsData?.data || [];
  const thanas = thanasData?.data || [];
  const searchResults = (searchData?.data || []).filter((l) => l.is_leaf_node);

  /* ── Restore drill-down + current pick once we resolve an id ── */
  useEffect(() => {
    if (!resolveId || !resolvedData?.data) return;
    const loc = resolvedData.data;
    const ancestors = loc.ancestors || [];
    const division = ancestors.find((a) => a.level === "DIVISION") || (loc.level === "DIVISION" ? loc : undefined);
    const district = ancestors.find((a) => a.level === "DISTRICT") || (loc.level === "DISTRICT" ? loc : undefined);

    if (division) setClickedDivision(division as Location);
    if (district) setClickedDistrict(district as Location);

    const fullPath = [...ancestors.map((a) => a.name), loc.name].join(" > ") || loc.name;
    setCurrentPick({ id: loc.id, name: loc.name, fullPath });

    // If this resolution was triggered by picking a search result (rather
    // than just restoring on open), finalize the selection now.
    if (searchQuery.trim()) {
      onSelect({ id: loc.id, name: loc.name, fullPath });
      handleRequestClose();
    }
    setResolveId(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveId, resolvedData]);

  const buildPath = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(" > ");

  const handleRequestClose = () => {
    onClose();
  };

  const handlePickDivision = (loc: Location) => {
    if (!loc.is_leaf_node) {
      if (clickedDivision?.id === loc.id) {
        setClickedDivision(null);
        setClickedDistrict(null);
        setDistrictFilter("");
        setThanaFilter("");
      } else {
        setClickedDivision(loc);
        setClickedDistrict(null);
        setDistrictFilter("");
        setThanaFilter("");
      }
      return;
    }
    const picked = { id: loc.id, name: loc.name, fullPath: loc.name };
    setCurrentPick(picked);
    onSelect(picked);
    handleRequestClose();
  };

  const handlePickDistrict = (loc: Location) => {
    if (!loc.is_leaf_node) {
      if (clickedDistrict?.id === loc.id) {
        setClickedDistrict(null);
        setThanaFilter("");
      } else {
        setClickedDistrict(loc);
        setThanaFilter("");
      }
      return;
    }
    const picked = { id: loc.id, name: loc.name, fullPath: buildPath(clickedDivision?.name, loc.name) };
    setCurrentPick(picked);
    onSelect(picked);
    handleRequestClose();
  };

  const handlePickThana = (loc: Location) => {
    const picked = {
      id: loc.id,
      name: loc.name,
      fullPath: buildPath(clickedDivision?.name, clickedDistrict?.name, loc.name),
    };
    setCurrentPick(picked);
    onSelect(picked);
    handleRequestClose();
  };

  const handlePickSearchResult = (loc: Location) => {
    // We don't know this result's ancestors yet (search doesn't return
    // them) — resolve the full record to build a fullPath before closing.
    setResolveId(loc.id);
  };

  const filteredDivisions = useMemo(() => {
    if (!divisionFilter.trim()) return divisions;
    const q = divisionFilter.toLowerCase();
    return divisions.filter((d) => d.name.toLowerCase().includes(q));
  }, [divisions, divisionFilter]);

  const filteredDistricts = useMemo(() => {
    if (!districtFilter.trim()) return districts;
    const q = districtFilter.toLowerCase();
    return districts.filter((d) => d.name.toLowerCase().includes(q));
  }, [districts, districtFilter]);

  const filteredThanas = useMemo(() => {
    if (!thanaFilter.trim()) return thanas;
    const q = thanaFilter.toLowerCase();
    return thanas.filter((d) => d.name.toLowerCase().includes(q));
  }, [thanas, thanaFilter]);

  if (!visible) return null;

  const columnButtonStyle = (active: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "9px 12px",
    textAlign: "left",
    background: active ? accentBg : "none",
    border: "none",
    borderBottom: "0.5px solid #F0F4FA",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    transition: "background 0.12s",
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      {/* Overlay */}
      <div
        onClick={handleRequestClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(2px)",
          animation: `${closing ? "lp-overlay-out" : "lp-overlay-in"} 0.2s ease forwards`,
        }}
      />

      {/* Dialog card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 640,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
          border: "1px solid #E2E8F0",
          animation: `${closing ? "lp-modal-out" : "lp-modal-in"} 0.22s cubic-bezier(0.16,1,0.3,1) forwards`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "0.5px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: accentBg,
                border: `0.5px solid ${accentBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={15} color={accent} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", margin: 0 }}>{title}</p>
              {description && (
                <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Search bar */}
        <div style={{ padding: "12px 18px", borderBottom: "0.5px solid #E2E8F0", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search division, district or area…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                paddingLeft: 34,
                paddingRight: searchQuery ? 34 : 12,
                paddingTop: 8,
                paddingBottom: 8,
                fontSize: 13,
                color: "#0F172A",
                border: `0.5px solid ${accentBorder}`,
                borderRadius: 8,
                background: "#FFFFFF",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  color: "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {debouncedQuery ? (
            /* ── Search results ── */
            <div style={{ flex: 1, overflowY: "auto" }}>
              {searchLoading ? (
                <ColumnLoading />
              ) : searchResults.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "#64748B" }}>
                  No areas found for "{debouncedQuery}"
                </div>
              ) : (
                searchResults.map((loc, i) => (
                  <button
                    key={loc.id}
                    onClick={() => handlePickSearchResult(loc)}
                    style={{
                      width: "100%",
                      padding: "9px 18px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      borderBottom: i < searchResults.length - 1 ? "0.5px solid #F0F4FA" : "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = accentBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>{loc.name}</div>
                    <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>{loc.level}</div>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* ── 3-column browse ── */
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Column 1 — Division */}
              <div style={{ width: "34%", borderRight: "0.5px solid #E2E8F0", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                <FilterInput value={divisionFilter} onChange={setDivisionFilter} placeholder="Search division…" />
                {divisionsLoading ? (
                  <ColumnLoading />
                ) : (
                  filteredDivisions.map((loc) => {
                    const active = clickedDivision?.id === loc.id;
                    return (
                      <button key={loc.id} onClick={() => handlePickDivision(loc)} style={columnButtonStyle(active)}>
                        <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? accent : "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {loc.name}
                        </span>
                        {!loc.is_leaf_node && (
                          <ChevronRight size={13} color={active ? accent : "#94A3B8"} style={{ flexShrink: 0, transform: active ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Column 2 — District */}
              {clickedDivision && (
                <div style={{ width: "33%", borderRight: "0.5px solid #E2E8F0", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  <FilterInput value={districtFilter} onChange={setDistrictFilter} placeholder="Search district…" />
                  {districtsLoading ? (
                    <ColumnLoading />
                  ) : (
                    filteredDistricts.map((loc) => {
                      const active = clickedDistrict?.id === loc.id;
                      return (
                        <button key={loc.id} onClick={() => handlePickDistrict(loc)} style={columnButtonStyle(active)}>
                          <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? accent : "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {loc.name}
                          </span>
                          {!loc.is_leaf_node && (
                            <ChevronRight size={13} color={active ? accent : "#94A3B8"} style={{ flexShrink: 0, transform: active ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Column 3 — Thana (leaf) */}
              {clickedDistrict && (
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  <FilterInput value={thanaFilter} onChange={setThanaFilter} placeholder="Search area…" />
                  {thanasLoading ? (
                    <ColumnLoading />
                  ) : (
                    filteredThanas.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => handlePickThana(loc)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          textAlign: "left",
                          background: currentPick?.id === loc.id ? accentBg : "none",
                          border: "none",
                          borderBottom: "0.5px solid #F0F4FA",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontSize: 12.5,
                          color: "#0F172A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = accentBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = currentPick?.id === loc.id ? accentBg : "none")}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{loc.name}</span>
                        <Check size={11} color={currentPick?.id === loc.id ? accent : "#93C5FD"} style={{ flexShrink: 0, opacity: currentPick?.id === loc.id ? 1 : 0.5 }} />
                      </button>
                    ))
                  )}
                </div>
              )}

              {!clickedDivision && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "#94A3B8", fontSize: 12 }}>
                  <ChevronRight size={20} color={accentBorder} />
                  Select a division to continue
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — current selection */}
        {currentPick && (
          <div style={{ padding: "10px 18px", borderTop: "0.5px solid #E2E8F0", background: "#F0FDF4", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={13} color="#15803D" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 1 }}>Currently selected</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#15803D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentPick.fullPath}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes lp-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lp-overlay-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes lp-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes lp-modal-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.96) translateY(6px); }
        }
      `}</style>
    </div>
  );
}

export default LocationPickerDialog;