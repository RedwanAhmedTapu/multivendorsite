"use client";
import React, { useState, useCallback } from "react";
import {
  AlertCircle,
  Check,
  Warehouse,
  Grid3x3,
  Plus,
  RefreshCw,
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
  WarehouseType,
} from "@/features/warehouseApi";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface WarehouseRackSelection {
  warehouseId: string;
  warehouseName: string;
  rackId?: string;
  rackCode?: string;
  rackLabel?: string;
}

interface Props {
  vendorId: string;
  value: WarehouseRackSelection | null;
  onChange: (val: WarehouseRackSelection | null) => void;
  validationErrors?: Record<string, boolean>;
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
  accent = "#1D4ED8",
  accentBg = "#EFF6FF",
  accentBorder = "#BFDBFE",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
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
          gap: 8,
          padding: "9px 14px",
          borderBottom: `0.5px solid ${accentBorder}`,
          background: "#FFFFFF",
        }}
      >
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
          }}
        >
          {title}
        </span>
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
      }}
    >
      {isPickup ? "Pickup" : "Return"}
      {isDefault && " ★"}
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function WarehouseRackSelector({
  vendorId,
  value,
  onChange,
  validationErrors = {},
}: Props) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    value?.warehouseId || ""
  );
  const [selectedRackId, setSelectedRackId] = useState<string>(
    value?.rackId || ""
  );

  /* ── Data fetching ── */
  const {
    data: warehousesData,
    isLoading: warehousesLoading,
  } = useGetWarehousesByVendorQuery({ vendorId }, { skip: !vendorId });

  const {
    data: racksData,
    isLoading: racksLoading,
  } = useGetRacksByWarehouseQuery(
    { warehouseId: selectedWarehouseId, filters: { isActive: true } },
    { skip: !selectedWarehouseId }
  );

  const warehouses = warehousesData?.data || [];
  const racks = racksData?.data || [];

  /* ── Handlers ── */
  const handleWarehouseChange = useCallback(
    (warehouseId: string) => {
      setSelectedWarehouseId(warehouseId);
      setSelectedRackId("");
      const wh = warehouses.find((w) => w.id === warehouseId);
      if (wh) {
        onChange({
          warehouseId,
          warehouseName: wh.name || wh.code || warehouseId,
          rackId: undefined,
          rackCode: undefined,
          rackLabel: undefined,
        });
      } else {
        onChange(null);
      }
    },
    [warehouses, onChange]
  );

  const handleRackChange = useCallback(
    (rackId: string) => {
      setSelectedRackId(rackId);
      const wh = warehouses.find((w) => w.id === selectedWarehouseId);
      const rack = racks.find((r) => r.id === rackId);
      if (wh) {
        onChange({
          warehouseId: selectedWarehouseId,
          warehouseName: wh.name || wh.code || selectedWarehouseId,
          rackId: rack?.id,
          rackCode: rack?.code,
          rackLabel: rack?.label || undefined,
        });
      }
    },
    [warehouses, racks, selectedWarehouseId, onChange]
  );

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);
  const selectedRack = racks.find((r) => r.id === selectedRackId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>

      {/* ── Warehouse selection ── */}
      <SubSection
        icon={<Warehouse size={13} color="#1D4ED8" />}
        title="Warehouse"
        accent="#1D4ED8"
        accentBg="#EFF6FF"
        accentBorder="#BFDBFE"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            id="warehouseId"
            style={
              validationErrors.warehouseId
                ? { borderLeft: "3px solid #FCA5A5", paddingLeft: 10 }
                : {}
            }
          >
            <FieldLabel
              required
              hint="Choose the warehouse where this product will be stored"
            >
              Select warehouse
            </FieldLabel>

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
                <RefreshCw
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Loading warehouses…
              </div>
            ) : warehouses.length === 0 ? (
              <div
                style={{
                  padding: "12px 14px",
                  background: "#FFFBEB",
                  border: "0.5px solid #FDE68A",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#92400E",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={14} />
                No warehouses found. Please create a warehouse first.
              </div>
            ) : (
              <Select
                value={selectedWarehouseId}
                onValueChange={handleWarehouseChange}
              >
                <SelectTrigger
                  style={{
                    fontSize: 13,
                    background: "#FFFFFF",
                    borderColor: validationErrors.warehouseId
                      ? "#FCA5A5"
                      : selectedWarehouseId
                      ? "#6EE7B7"
                      : "#BFDBFE",
                    maxWidth: 420,
                  }}
                >
                  <SelectValue placeholder="Select a warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem
                      key={wh.id}
                      value={wh.id}
                      style={{ fontSize: 13 }}
                    >
                      <span style={{ display: "flex", alignItems: "center" }}>
                        {wh.name || wh.code || wh.id}
                        <WarehousePill
                          type={wh.type}
                          isDefault={wh.isDefault}
                        />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {validationErrors.warehouseId && (
              <FieldError message="Please select a warehouse" />
            )}

            {selectedWarehouse && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  background: "#EFF6FF",
                  border: "0.5px solid #BFDBFE",
                  borderRadius: 8,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 16px",
                  fontSize: 11,
                  color: "#374151",
                }}
              >
                {selectedWarehouse.address && (
                  <span>
                    <strong style={{ color: "#1D4ED8" }}>Address:</strong>{" "}
                    {selectedWarehouse.address}
                  </span>
                )}
                {selectedWarehouse.location && (
                  <span>
                    <strong style={{ color: "#1D4ED8" }}>Location:</strong>{" "}
                    {[
                      selectedWarehouse.location.city,
                      selectedWarehouse.location.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
                {selectedWarehouse.phone && (
                  <span>
                    <strong style={{ color: "#1D4ED8" }}>Phone:</strong>{" "}
                    {selectedWarehouse.phone}
                  </span>
                )}
                <span>
                  <strong style={{ color: "#1D4ED8" }}>Type:</strong>{" "}
                  {selectedWarehouse.type}
                  {selectedWarehouse.isDefault && (
                    <span
                      style={{
                        marginLeft: 5,
                        fontSize: 9.5,
                        fontWeight: 700,
                        background: "#DBEAFE",
                        color: "#1D4ED8",
                        padding: "1px 6px",
                        borderRadius: 20,
                        border: "0.5px solid #93C5FD",
                      }}
                    >
                      DEFAULT
                    </span>
                  )}
                </span>
              </div>
            )}

            {selectedWarehouse && (
              <p
                style={{
                  fontSize: 11,
                  color: "#10B981",
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Check size={11} /> Warehouse selected
              </p>
            )}
          </div>
        </div>
      </SubSection>

      {/* ── Rack selection (only after warehouse picked) ── */}
      {selectedWarehouseId && (
        <SubSection
          icon={<Grid3x3 size={13} color="#0369A1" />}
          title="Storage Rack"
          accent="#0369A1"
          accentBg="#F0F9FF"
          accentBorder="#7DD3FC"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FieldLabel hint="Optional — assign a specific rack/shelf for easier picking">
              Select rack (optional)
            </FieldLabel>

            {racksLoading ? (
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
                <RefreshCw
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Loading racks…
              </div>
            ) : racks.length === 0 ? (
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
                <Plus size={13} />
                No active racks in this warehouse. You can add racks in Warehouse
                settings, or leave unassigned for now.
              </div>
            ) : (
              <>
                <Select value={selectedRackId} onValueChange={handleRackChange}>
                  <SelectTrigger
                    style={{
                      fontSize: 13,
                      background: "#FFFFFF",
                      borderColor: selectedRackId ? "#7DD3FC" : "#BAE6FD",
                      maxWidth: 420,
                    }}
                  >
                    <SelectValue placeholder="No rack assigned (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {racks.map((rack) => (
                      <SelectItem
                        key={rack.id}
                        value={rack.id}
                        style={{ fontSize: 13 }}
                      >
                        {rack.code}
                        {rack.label ? ` — ${rack.label}` : ""}
                        {rack.row ? ` (Row ${rack.row}` : ""}
                        {rack.shelf
                          ? `, Shelf ${rack.shelf})`
                          : rack.row
                          ? ")"
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedRack && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      background: "#F0F9FF",
                      border: "0.5px solid #7DD3FC",
                      borderRadius: 7,
                      fontSize: 11.5,
                      color: "#0369A1",
                      fontWeight: 500,
                    }}
                  >
                    <Check size={12} color="#0EA5E9" />
                    Rack <strong>{selectedRack.code}</strong>
                    {selectedRack.label && ` — ${selectedRack.label}`}
                    {selectedRack.row && ` · Row ${selectedRack.row}`}
                    {selectedRack.shelf && ` · Shelf ${selectedRack.shelf}`}
                  </div>
                )}
              </>
            )}

            {/* Rack grid overview */}
            {racks.length > 0 && (
              <div
                style={{
                  marginTop: 4,
                  padding: "10px 12px",
                  background: "#FFFFFF",
                  border: "0.5px solid #BAE6FD",
                  borderRadius: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#0369A1",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Available racks ({racks.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {racks.map((rack) => (
                    <button
                      key={rack.id}
                      type="button"
                      onClick={() => handleRackChange(rack.id)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 7,
                        border: `0.5px solid ${
                          selectedRackId === rack.id ? "#0369A1" : "#BAE6FD"
                        }`,
                        background:
                          selectedRackId === rack.id ? "#0369A1" : "#F0F9FF",
                        color:
                          selectedRackId === rack.id ? "#FFFFFF" : "#0369A1",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <span>{rack.code}</span>
                      {(rack.row || rack.shelf) && (
                        <span
                          style={{ fontSize: 9, opacity: 0.8, fontWeight: 500 }}
                        >
                          {[
                            rack.row && `R${rack.row}`,
                            rack.shelf && `S${rack.shelf}`,
                          ]
                            .filter(Boolean)
                            .join("·")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SubSection>
      )}

      {/* Info card when no warehouse selected yet */}
      {!selectedWarehouseId && !warehousesLoading && warehouses.length > 0 && (
        <div
          style={{
            padding: "12px 14px",
            background: "#F0F9FF",
            border: "0.5px solid #BAE6FD",
            borderRadius: 10,
            fontSize: 11.5,
            color: "#0369A1",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#1E293B" }}>Why assign a warehouse?</strong>
          <br />
          Assigning a warehouse and rack helps track inventory location, speeds
          up order picking, and enables accurate stock transfers between
          locations.
        </div>
      )}
    </div>
  );
}