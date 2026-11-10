"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  AlertCircle,
  Check,
  Warehouse,
  Grid3x3,
  Plus,
  RefreshCw,
  X,
  LayoutGrid,
  Image as ImageIcon,
  Boxes,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetWarehousesByVendorQuery,
  useGetRacksByWarehouseQuery,
  useCreateRackMutation,
  WarehouseType,
  WarehouseRack,
} from "@/features/warehouseApi";
// Shared warehouse create/edit form (also used by Settings and Purchase Receive).
import { WarehouseFormDialog } from "@/components/warehouse/WarehouseFormDialog";

/* ─── Types ─────────────────────────────────────────────────────────────── */
//
// A single product can now live in MULTIPLE warehouses at once, and within
// each warehouse it can be split across MULTIPLE racks/bins (e.g. some
// units on Rack A Row 1 Shelf 2, some on Rack B Row 3 Shelf 1). So the
// shape this component reports is now:
//
//   WarehouseRackSelection = WarehouseSelectionEntry[]
//
// where each warehouse entry carries its own list of "bins" (a rack +
// optional row/shelf pair). A warehouse entry with an empty `racks` array
// just means "stock lives in this warehouse, no specific bin pinned".

export interface RackBinSelection {
  /** Stable local id used for list keys — NOT sent to the backend. */
  binId: string;
  rackId?: string;
  rackCode?: string;
  rackLabel?: string;
  rowNumber?: number;
  shelfNumber?: number;
}

export interface WarehouseSelectionEntry {
  warehouseId: string;
  warehouseName: string;
  warehouseType?: WarehouseType;
  racks: RackBinSelection[];
}

export type WarehouseRackSelection = WarehouseSelectionEntry[];

interface Props {
  vendorId: string;
  value: WarehouseRackSelection;
  onChange: (val: WarehouseRackSelection) => void;
  validationErrors?: Record<string, boolean>;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

/* ─── Sub-primitives ─────────────────────────────────────────────────────── */

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#3D5068",
          letterSpacing: "0.01em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {children}
        {required && (
          <span style={{ color: "#DC2626", fontWeight: 800 }}>*</span>
        )}
      </label>
      {hint && (
        <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 2 }}>{hint}</p>
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 5,
        fontSize: 11.5,
        color: "#DC2626",
      }}
    >
      <AlertCircle size={12} />
      {message}
    </div>
  );
}

function SubSection({
  icon,
  title,
  children,
  headerRight,
  accent = "#1D4ED8",
  accentBg = "#EFF6FF",
  accentBorder = "#BFDBFE",
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  accent?: string;
  accentBg?: string;
  accentBorder?: string;
}) {
  return (
    <div
      style={{
        background: accentBg,
        border: `0.5px solid ${accentBorder}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "9px 14px",
          borderBottom: `0.5px solid ${accentBorder}`,
          background: "#FFFFFF",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: accentBg,
              border: `0.5px solid ${accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: accent,
              letterSpacing: "-0.1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
        </div>
        {headerRight}
      </div>
      <div style={{ padding: "14px 14px" }}>{children}</div>
    </div>
  );
}

/* ─── Warehouse badge pill ───────────────────────────────────────────────── */

function WarehousePill({
  type,
  isDefault,
}: {
  type: WarehouseType;
  isDefault: boolean;
}) {
  const isPickup = type === WarehouseType.PICKUP;
  return (
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "1px 7px",
        borderRadius: 20,
        background: isPickup ? "#EFF6FF" : "#F0F9FF",
        color: isPickup ? "#1D4ED8" : "#0369A1",
        border: `0.5px solid ${isPickup ? "#93C5FD" : "#7DD3FC"}`,
        marginLeft: 5,
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      {isPickup ? "Pickup" : "Return"}
      {isDefault && " ★"}
    </span>
  );
}

/* ─── Small icon-only remove button (used on cards / bin rows) ──────────── */

function RemoveButton({
  onClick,
  label,
  size = 26,
}: {
  onClick: () => void;
  label: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        border: "1px solid #FECACA",
        background: "#FEF2F2",
        color: "#DC2626",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <X size={13} />
    </button>
  );
}

/* ─── Responsive create button (label on desktop, icon-only on mobile) ──── */
/* Tooltip is colored to match the section it belongs to instead of black.  */

function ResponsiveCreateButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  accent = "#1D4ED8",
  accentBg = "#EFF6FF",
  accentBorder = "#BFDBFE",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  accent?: string;
  accentBg?: string;
  accentBorder?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="wh-responsive-btn"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 28,
          padding: "0 10px",
          borderRadius: 7,
          border: `1px solid ${active ? accent : accentBorder}`,
          background: disabled ? "#F1F5F9" : active ? accent : "#fff",
          color: disabled ? "#94A3B8" : active ? "#fff" : accent,
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "inherit",
          transition: "transform 0.15s ease, background 0.15s ease",
          transform: hovered && !disabled ? "scale(1.04)" : "scale(1)",
          flexShrink: 0,
        }}
      >
        {icon}
        <span className="wh-btn-label">{label}</span>
      </button>

      {/* Tooltip: only relevant when the label text is hidden (mobile icon-only mode) */}
      <div
        role="tooltip"
        className="wh-btn-tooltip"
        style={{
          position: "absolute",
          bottom: "calc(100% + 7px)",
          left: "50%",
          transform: hovered
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(4px)",
          background: accentBg,
          color: accent,
          border: `1px solid ${accentBorder}`,
          fontSize: 10.5,
          fontWeight: 700,
          padding: "4px 8px",
          borderRadius: 6,
          whiteSpace: "nowrap",
          opacity: hovered ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 0.15s ease, transform 0.15s ease",
          zIndex: 30,
          boxShadow: "0 4px 10px rgba(15,23,42,0.10)",
        }}
      >
        {label}
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: `4px solid ${accentBg}`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Image preview modal ─────────────────────────────────────────────────
   Shows a static reference image (e.g. an example warehouse rack/row/shelf
   layout) in a centered modal. Mount/unmount is animated the same way as
   the shared WarehouseFormDialog: it stays mounted while "closing" so the fade/scale
   transition can play, then unmounts after the animation duration. ────── */

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: string;
}

function ImagePreviewModal({ open, onClose, src, alt, title }: ImagePreviewModalProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      }, 220);
    }
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(2px)",
          animation: `${closing ? "wh-img-overlay-out" : "wh-img-overlay-in"} 0.2s ease forwards`,
        }}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Image preview"}
        style={{
          position: "relative",
          maxWidth: "min(900px, 92vw)",
          maxHeight: "88vh",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(15,23,42,0.3)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: `${closing ? "wh-img-modal-out" : "wh-img-modal-in"} 0.24s cubic-bezier(0.16,1,0.3,1) forwards`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "0.5px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "#EFF6FF",
                border: "0.5px solid #BFDBFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ImageIcon size={14} color="#1D4ED8" />
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 800, color: "#1E293B", margin: 0 }}>
              {title || "Warehouse layout example"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              flexShrink: 0,
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FEE2E2";
              e.currentTarget.style.color = "#DC2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F8FAFC";
              e.currentTarget.style.color = "#64748B";
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Image */}
        <div
          style={{
            padding: 16,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F8FAFC",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: "100%",
              maxHeight: "72vh",
              objectFit: "contain",
              borderRadius: 8,
              display: "block",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes wh-img-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wh-img-overlay-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes wh-img-modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wh-img-modal-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(6px); }
        }
      `}</style>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/** Builds [1, 2, ..., n] for populating row/shelf number selects. */
function range(n: number): number[] {
  return Array.from({ length: Math.max(n, 0) }, (_, i) => i + 1);
}

/* ─── Rack + bin row ──────────────────────────────────────────────────────
   One line inside a warehouse card: pick a rack, then (optionally) pin a
   specific row/shelf within that rack's capacity. Multiple of these can
   exist per warehouse so stock can be split across several bins. ───────── */

function RackBinRow({
  index,
  racks,
  racksLoading,
  selection,
  onChange,
  onRemove,
}: {
  index: number;
  racks: WarehouseRack[];
  racksLoading: boolean;
  selection: RackBinSelection;
  onChange: (patch: Partial<RackBinSelection>) => void;
  onRemove: () => void;
}) {
  const selectedRack = racks.find((r) => r.id === selection.rackId);

  const handleRackChange = (rackId: string) => {
    const rack = racks.find((r) => r.id === rackId);
    onChange({
      rackId: rack?.id,
      rackCode: rack?.code,
      rackLabel: rack?.label || undefined,
      rowNumber: undefined,
      shelfNumber: undefined,
    });
  };

  return (
    <div
      style={{
        padding: "10px 12px",
        background: "#fff",
        border: "0.5px solid #BAE6FD",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0369A1", display: "flex", alignItems: "center", gap: 5 }}>
          <LayoutGrid size={11} />
          Bin {index + 1}
        </span>
        <RemoveButton onClick={onRemove} label={`Remove bin ${index + 1}`} size={22} />
      </div>

      {racksLoading ? (
        <div style={{ fontSize: 11.5, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
          Loading racks…
        </div>
      ) : (
        <Select value={selection.rackId || ""} onValueChange={handleRackChange}>
          <SelectTrigger style={{ fontSize: 12.5, background: "#FFFFFF", borderColor: selection.rackId ? "#7DD3FC" : "#BAE6FD" }}>
            <SelectValue placeholder="Choose a rack" />
          </SelectTrigger>
          <SelectContent>
            {racks.map((rack) => (
              <SelectItem key={rack.id} value={rack.id} style={{ fontSize: 12.5 }}>
                {rack.code}
                {rack.label ? ` — ${rack.label}` : ""}
                {` (${rack.totalRows} row${rack.totalRows === 1 ? "" : "s"} × ${rack.totalShelves} shelf${rack.totalShelves === 1 ? "" : "ves"})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedRack && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 3 }}>
              Row
            </label>
            <Select
              value={selection.rowNumber ? String(selection.rowNumber) : ""}
              onValueChange={(v) => onChange({ rowNumber: v ? parseInt(v, 10) : undefined })}
            >
              <SelectTrigger style={{ fontSize: 12.5, background: "#FFFFFF", borderColor: "#BAE6FD" }}>
                <SelectValue placeholder="Any row" />
              </SelectTrigger>
              <SelectContent>
                {range(selectedRack.totalRows).map((n) => (
                  <SelectItem key={n} value={String(n)} style={{ fontSize: 12.5 }}>
                    Row {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 3 }}>
              Shelf
            </label>
            <Select
              value={selection.shelfNumber ? String(selection.shelfNumber) : ""}
              onValueChange={(v) => onChange({ shelfNumber: v ? parseInt(v, 10) : undefined })}
            >
              <SelectTrigger style={{ fontSize: 12.5, background: "#FFFFFF", borderColor: "#BAE6FD" }}>
                <SelectValue placeholder="Any shelf" />
              </SelectTrigger>
              <SelectContent>
                {range(selectedRack.totalShelves).map((n) => (
                  <SelectItem key={n} value={String(n)} style={{ fontSize: 12.5 }}>
                    Shelf {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Warehouse card ─────────────────────────────────────────────────────
   One selected warehouse. Owns its own rack fetch (hooks stay stable since
   each card is a distinct component instance) and lets the user add any
   number of bin rows under it, or create a brand new rack on the spot. ── */

function WarehouseCard({
  entry,
  onRemove,
  onRacksChange,
}: {
  entry: WarehouseSelectionEntry;
  onRemove: () => void;
  onRacksChange: (racks: RackBinSelection[]) => void;
}) {
  const { data: racksData, isLoading: racksLoading } = useGetRacksByWarehouseQuery(
    { warehouseId: entry.warehouseId, filters: { isActive: true } },
    { skip: !entry.warehouseId }
  );
  const racks = racksData?.data || [];

  const [showCreateRack, setShowCreateRack] = useState(false);
  const [newRack, setNewRack] = useState({ code: "", label: "", totalRows: "1", totalShelves: "1" });
  const [createRackError, setCreateRackError] = useState("");
  const [createRack, { isLoading: isCreatingRack }] = useCreateRackMutation();

  const addBin = () => onRacksChange([...entry.racks, { binId: makeId() }]);
  const removeBin = (binId: string) => onRacksChange(entry.racks.filter((r) => r.binId !== binId));
  const patchBin = (binId: string, patch: Partial<RackBinSelection>) =>
    onRacksChange(entry.racks.map((r) => (r.binId === binId ? { ...r, ...patch } : r)));

  const handleCreateRack = async () => {
    if (!newRack.code.trim()) {
      setCreateRackError("Rack code is required");
      return;
    }
    const totalRows = parseInt(newRack.totalRows, 10);
    const totalShelves = parseInt(newRack.totalShelves, 10);
    if (!Number.isInteger(totalRows) || totalRows < 1) {
      setCreateRackError("Rows must be a positive number");
      return;
    }
    if (!Number.isInteger(totalShelves) || totalShelves < 1) {
      setCreateRackError("Shelves must be a positive number");
      return;
    }
    setCreateRackError("");
    try {
      const result = await createRack({
        warehouseId: entry.warehouseId,
        code: newRack.code.trim(),
        label: newRack.label.trim() || undefined,
        totalRows,
        totalShelves,
        isActive: true,
      }).unwrap();

      const created = result.data;
      // Newly created rack is immediately usable — add it as a bin line.
      onRacksChange([
        ...entry.racks,
        {
          binId: makeId(),
          rackId: created.id,
          rackCode: created.code,
          rackLabel: created.label || undefined,
        },
      ]);
      setNewRack({ code: "", label: "", totalRows: "1", totalShelves: "1" });
      setShowCreateRack(false);
    } catch (err: any) {
      setCreateRackError(err?.data?.message || "Failed to create rack");
    }
  };

  return (
    <SubSection
      icon={<Warehouse size={13} color="#1D4ED8" />}
      title={entry.warehouseName}
      accent="#1D4ED8"
      accentBg="#EFF6FF"
      accentBorder="#BFDBFE"
      headerRight={
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {entry.warehouseType && <WarehousePill type={entry.warehouseType} isDefault={false} />}
          <RemoveButton onClick={onRemove} label={`Remove ${entry.warehouseName}`} />
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <FieldLabel hint="Optional — pin this warehouse's stock to one or more racks/bins">
            Storage bins
          </FieldLabel>
          <ResponsiveCreateButton
            icon={<Plus size={13} />}
            label="Add bin"
            onClick={addBin}
            disabled={racksLoading || racks.length === 0}
            accent="#0369A1"
            accentBg="#F0F9FF"
            accentBorder="#7DD3FC"
          />
        </div>

        {entry.racks.length === 0 ? (
          <p style={{ fontSize: 11.5, color: "#94A3B8", margin: 0 }}>
            No specific bin assigned yet — stock will simply be tracked at the
            warehouse level. Add a bin to pin it to a rack, row and shelf.
          </p>
        ) : (
          entry.racks.map((bin, idx) => (
            <RackBinRow
              key={bin.binId}
              index={idx}
              racks={racks}
              racksLoading={racksLoading}
              selection={bin}
              onChange={(patch) => patchBin(bin.binId, patch)}
              onRemove={() => removeBin(bin.binId)}
            />
          ))
        )}

        {!racksLoading && racks.length === 0 && !showCreateRack && (
          <div
            style={{
              padding: "10px 12px",
              background: "#F0F9FF",
              border: "0.5px solid #7DD3FC",
              borderRadius: 8,
              fontSize: 12,
              color: "#0369A1",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={13} />
            No active racks in this warehouse yet — create one below, or leave
            this warehouse unassigned to a specific bin.
          </div>
        )}

        <div>
          <ResponsiveCreateButton
            icon={showCreateRack ? <X size={13} /> : <Plus size={13} />}
            label={showCreateRack ? "Cancel" : "Create new rack"}
            active={showCreateRack}
            onClick={() => {
              setShowCreateRack((p) => !p);
              setCreateRackError("");
            }}
            accent="#0369A1"
            accentBg="#F0F9FF"
            accentBorder="#7DD3FC"
          />

          {showCreateRack && (
            <div
              style={{
                marginTop: 8,
                padding: "12px 14px",
                background: "#fff",
                border: "1px solid #7DD3FC",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input
                  value={newRack.code}
                  onChange={(e) => setNewRack((p) => ({ ...p, code: e.target.value }))}
                  placeholder="Rack code *"
                  style={{
                    padding: "7px 10px",
                    borderRadius: 7,
                    border: `1px solid ${createRackError && !newRack.code.trim() ? "#FCA5A5" : "#BAE6FD"}`,
                    fontSize: 12.5,
                    fontFamily: "inherit",
                  }}
                />
                <input
                  value={newRack.label}
                  onChange={(e) => setNewRack((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Label (optional)"
                  style={{
                    padding: "7px 10px",
                    borderRadius: 7,
                    border: "1px solid #BAE6FD",
                    fontSize: 12.5,
                    fontFamily: "inherit",
                  }}
                />
                <div>
                  <label style={{ fontSize: 10.5, color: "#0369A1", fontWeight: 700, display: "block", marginBottom: 3 }}>
                    Total rows
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newRack.totalRows}
                    onChange={(e) => setNewRack((p) => ({ ...p, totalRows: e.target.value }))}
                    placeholder="e.g. 4"
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 7,
                      border: "1px solid #BAE6FD",
                      fontSize: 12.5,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, color: "#0369A1", fontWeight: 700, display: "block", marginBottom: 3 }}>
                    Total shelves
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newRack.totalShelves}
                    onChange={(e) => setNewRack((p) => ({ ...p, totalShelves: e.target.value }))}
                    placeholder="e.g. 3"
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 7,
                      border: "1px solid #BAE6FD",
                      fontSize: 12.5,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {createRackError && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#DC2626" }}>
                  <AlertCircle size={11} /> {createRackError}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateRack}
                disabled={isCreatingRack}
                style={{
                  alignSelf: "flex-start",
                  padding: "7px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: isCreatingRack ? "#94A3B8" : "linear-gradient(135deg,#0369A1,#0891B2)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isCreatingRack ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isCreatingRack ? (
                  <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Check size={12} />
                )}
                {isCreatingRack ? "Creating…" : "Save rack"}
              </button>
            </div>
          )}
        </div>
      </div>
    </SubSection>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function WarehouseRackSelector({
  vendorId,
  value,
  onChange,
  validationErrors = {},
}: Props) {
  const entries = value ?? [];

  const [showCreateWarehouse, setShowCreateWarehouse] = useState(false);
  const [showLayoutImage, setShowLayoutImage] = useState(false);
  const [pickerValue, setPickerValue] = useState("");

  // Only active warehouses can receive new stock assignments.
  const { data: warehousesData, isLoading: warehousesLoading } = useGetWarehousesByVendorQuery(
    { vendorId, filters: { isActive: true } },
    { skip: !vendorId }
  );
  const warehouses = warehousesData?.data || [];

  const selectedIds = new Set(entries.map((e) => e.warehouseId));
  const availableWarehouses = warehouses.filter((w) => !selectedIds.has(w.id));

  const addWarehouse = useCallback(
    (warehouseId: string) => {
      const wh = warehouses.find((w) => w.id === warehouseId);
      if (!wh) return;
      onChange([
        ...entries,
        {
          warehouseId: wh.id,
          warehouseName: wh.name || wh.code || wh.id,
          warehouseType: wh.type,
          racks: [],
        },
      ]);
      setPickerValue("");
    },
    [entries, warehouses, onChange]
  );

  const removeWarehouse = useCallback(
    (warehouseId: string) => onChange(entries.filter((e) => e.warehouseId !== warehouseId)),
    [entries, onChange]
  );

  const updateRacks = useCallback(
    (warehouseId: string, racks: RackBinSelection[]) =>
      onChange(entries.map((e) => (e.warehouseId === warehouseId ? { ...e, racks } : e))),
    [entries, onChange]
  );

  const handleWarehouseCreated = useCallback(
    (created: { id: string; name: string | null; code: string | null; type: WarehouseType }) => {
      onChange([
        ...entries,
        {
          warehouseId: created.id,
          warehouseName: created.name || created.code || created.id,
          warehouseType: created.type,
          racks: [],
        },
      ]);
    },
    [entries, onChange]
  );

  const totalBins = entries.reduce((sum, e) => sum + e.racks.length, 0);
  const showEmptyError = entries.length === 0 && !!validationErrors.warehouseId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
      {/* ── Summary bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
            <Boxes size={14} color="#1D4ED8" />
            Warehouses
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
            {entries.length === 0
              ? "No warehouses selected yet"
              : `${entries.length} warehouse${entries.length === 1 ? "" : "s"} selected${
                  totalBins ? `, ${totalBins} bin${totalBins === 1 ? "" : "s"} assigned` : ""
                }`}
          </p>
        </div>
        <ResponsiveCreateButton
          icon={<ImageIcon size={13} />}
          label="View layout example"
          onClick={() => setShowLayoutImage(true)}
          accent="#1D4ED8"
          accentBg="#EFF6FF"
          accentBorder="#BFDBFE"
        />
      </div>

      {showEmptyError && (
        <div
          id="warehouseId"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "#FEF2F2",
            border: "0.5px solid #FCA5A5",
            borderRadius: 8,
            fontSize: 12,
            color: "#DC2626",
          }}
        >
          <AlertCircle size={14} />
          Please select at least one warehouse.
        </div>
      )}

      {/* ── One card per selected warehouse ── */}
      {entries.map((entry) => (
        <WarehouseCard
          key={entry.warehouseId}
          entry={entry}
          onRemove={() => removeWarehouse(entry.warehouseId)}
          onRacksChange={(racks) => updateRacks(entry.warehouseId, racks)}
        />
      ))}

      {/* ── Add warehouse ── */}
      <SubSection
        icon={<Plus size={13} color="#1D4ED8" />}
        title="Add a warehouse"
        accent="#1D4ED8"
        accentBg="#EFF6FF"
        accentBorder="#BFDBFE"
        headerRight={
          <ResponsiveCreateButton
            icon={<Plus size={13} />}
            label="Create warehouse"
            onClick={() => setShowCreateWarehouse(true)}
            accent="#1D4ED8"
            accentBg="#EFF6FF"
            accentBorder="#BFDBFE"
          />
        }
      >
        {warehousesLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "#F8FAFC",
              border: "0.5px solid #E2E8F0",
              borderRadius: 8,
              fontSize: 12,
              color: "#64748B",
            }}
          >
            <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
            Loading warehouses…
          </div>
        ) : availableWarehouses.length === 0 ? (
          <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
            {warehouses.length === 0
              ? "No warehouses exist yet for this vendor — create one to get started."
              : "All available warehouses have already been added above."}
          </p>
        ) : (
          <Select value={pickerValue} onValueChange={addWarehouse}>
            <SelectTrigger
              style={{
                fontSize: 13,
                background: "#FFFFFF",
                borderColor: "#BFDBFE",
                maxWidth: 420,
              }}
            >
              <SelectValue placeholder="Select a warehouse to add" />
            </SelectTrigger>
            <SelectContent>
              {availableWarehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id} style={{ fontSize: 13 }}>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {wh.name || wh.code || wh.id}
                    <WarehousePill type={wh.type} isDefault={wh.isDefault} />
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </SubSection>

      <WarehouseFormDialog
        vendorId={vendorId}
        open={showCreateWarehouse}
        onClose={() => setShowCreateWarehouse(false)}
        onCreated={handleWarehouseCreated}
      />

      <ImagePreviewModal
        open={showLayoutImage}
        onClose={() => setShowLayoutImage(false)}
        src="/warehouseimage/wrehousedemopic.png"
        alt="Example warehouse rack, row and shelf layout"
        title="Warehouse layout example"
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Label text hidden on mobile, shown from tablet/desktop up */
        .wh-btn-label { display: none; }
        @media (min-width: 768px) {
          .wh-btn-label { display: inline; }
        }

        /* Tooltip only useful in icon-only (mobile) mode; keep it out of the
           way once the button already shows its own label on desktop */
        @media (min-width: 768px) {
          .wh-btn-tooltip { display: none; }
        }
      `}</style>
    </div>
  );
}