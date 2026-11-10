"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Store,
  Search,
  RefreshCw,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Building2,
  PackageSearch,
} from "lucide-react";

import {
  usePathaoGetStoresQuery,
  useRedxGetPickupStoresQuery,
  type Environment,
  type PathaoStore,
  type RedXStore,
} from "@/features/courierApi";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

interface NormalizedStore {
  id: string;
  name: string;
  phone: string;
  address: string;
  areaLabel: string;
  provider: "PATHAO" | "REDX";
}

function normalizePathaoStores(stores: PathaoStore[] = []): NormalizedStore[] {
  return stores.map((s) => ({
    id: String(s.store_id),
    name: s.store_name,
    phone: s.contact_number,
    address: s.store_address,
    areaLabel: `City ${s.city_id} · Zone ${s.zone_id} · Area ${s.area_id}`,
    provider: "PATHAO",
  }));
}

function normalizeRedxStores(stores: RedXStore[] = []): NormalizedStore[] {
  return stores.map((s) => ({
    id: String(s.id),
    name: s.name,
    phone: s.phone,
    address: s.address,
    areaLabel: s.area_name ? s.area_name : `Area ${s.area_id}`,
    provider: "REDX",
  }));
}

/* ─── shared small bits (same visual language as Bank page) ─────────────── */

function FilterInput({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 220 }}>
      <div
        style={{
          position: "absolute",
          left: 9,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#94A3B8",
          display: "flex",
        }}
      >
        {icon}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "7px 10px 7px 30px",
          borderRadius: 8,
          border: "1.5px solid #E2E8F0",
          fontSize: 12.5,
          fontFamily: "inherit",
          outline: "none",
          background: "#fff",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function PlainSelect({
  icon,
  value,
  onChange,
  children,
  width = 130,
}: {
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div style={{ position: "relative", width }}>
      {icon && (
        <div
          style={{
            position: "absolute",
            left: 9,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94A3B8",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: icon ? "7px 10px 7px 28px" : "7px 10px",
          borderRadius: 8,
          border: "1.5px solid #E2E8F0",
          fontSize: 12.5,
          fontFamily: "inherit",
          outline: "none",
          background: "#fff",
          boxSizing: "border-box",
          color: "#334155",
          cursor: "pointer",
        }}
      >
        {children}
      </select>
    </div>
  );
}

function IconButton({
  icon,
  onClick,
  label,
  loading,
  disabled,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        padding: "7px 12px",
        borderRadius: 8,
        border: "1.5px solid #E2E8F0",
        background: isDisabled ? "#F1F5F9" : "#fff",
        color: isDisabled ? "#94A3B8" : "#334155",
        fontSize: 12,
        fontWeight: 700,
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */

interface CourierProviderLite {
  id: string;
  name: string;
  displayName?: string;
}

interface Props {
  pathaoProvider?: CourierProviderLite | null;
  redxProvider?: CourierProviderLite | null;
  environment: Environment;
}

export function VendorStoresTable({ pathaoProvider, redxProvider, environment }: Props) {
  const [activeProvider, setActiveProvider] = useState<"PATHAO" | "REDX">(
    pathaoProvider ? "PATHAO" : "REDX"
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const isPathao = activeProvider === "PATHAO";
  const isRedx = activeProvider === "REDX";
  const providerId = isPathao ? pathaoProvider?.id : redxProvider?.id;

  // Switch to whichever provider actually exists if the current selection
  // becomes unavailable (e.g. only one provider configured).
  useEffect(() => {
    if (isPathao && !pathaoProvider && redxProvider) setActiveProvider("REDX");
    if (isRedx && !redxProvider && pathaoProvider) setActiveProvider("PATHAO");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathaoProvider, redxProvider]);

  const {
    data: pathaoData,
    isFetching: pathaoFetching,
    isError: pathaoIsError,
    refetch: refetchPathao,
  } = usePathaoGetStoresQuery(
    { courierProviderId: pathaoProvider?.id ?? "", environment },
    { skip: !pathaoProvider?.id || !isPathao, refetchOnMountOrArgChange: true }
  );

  const {
    data: redxData,
    isFetching: redxFetching,
    isError: redxIsError,
    refetch: refetchRedx,
  } = useRedxGetPickupStoresQuery(
    { courierProviderId: redxProvider?.id ?? "", environment },
    { skip: !redxProvider?.id || !isRedx, refetchOnMountOrArgChange: true }
  );

  useEffect(() => {
    setPage(1);
  }, [environment, activeProvider]);

  const isLoading = isPathao ? pathaoFetching : isRedx ? redxFetching : false;
  const isError = isPathao ? pathaoIsError : isRedx ? redxIsError : false;

  const allStores: NormalizedStore[] = useMemo(() => {
    if (isPathao) return normalizePathaoStores(pathaoData?.data?.data?.data ?? []);
    if (isRedx) return normalizeRedxStores(redxData?.data?.pickup_stores ?? []);
    return [];
  }, [isPathao, isRedx, pathaoData, redxData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allStores;
    return allStores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.areaLabel.toLowerCase().includes(q)
    );
  }, [allStores, search]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: 14 }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#0D1B2E",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Store size={15} color="#1D4ED8" />
            Courier Pickup Stores
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 20,
                background: "#EEF3FB",
                color: "#1D4ED8",
              }}
            >
              {filtered.length}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 2 }}>
            {environment === "SANDBOX" ? "Sandbox" : "Production"} environment
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <PlainSelect
            icon={<Building2 size={13} />}
            value={activeProvider}
            onChange={(v) => setActiveProvider(v as "PATHAO" | "REDX")}
            width={140}
          >
            {pathaoProvider && <option value="PATHAO">Pathao</option>}
            {redxProvider && <option value="REDX">RedX</option>}
            {!pathaoProvider && !redxProvider && <option value="">No provider</option>}
          </PlainSelect>

          <FilterInput
            icon={<Search size={13} />}
            placeholder="Search stores…"
            value={search}
            onChange={setSearch}
          />

          <IconButton
            icon={
              <RefreshCw
                size={13}
                style={isLoading ? { animation: "spin 1s linear infinite" } : undefined}
              />
            }
            label="Refresh"
            loading={isLoading}
            onClick={() => (isPathao ? refetchPathao() : refetchRedx())}
          />
        </div>
      </div>

      {/* Body */}
      {!providerId ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5EAF2",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            color: "#9BAABB",
          }}
        >
          <PackageSearch size={26} style={{ opacity: 0.3, marginBottom: 6 }} />
          <p style={{ fontSize: 12.5, margin: 0 }}>
            No {activeProvider.toLowerCase()} provider configured.
          </p>
        </div>
      ) : isError ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#DC2626",
            fontSize: 12.5,
            padding: "14px 16px",
            background: "#FEF2F2",
            borderRadius: 10,
            border: "1px solid #FECACA",
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          Failed to load stores. Check that {environment.toLowerCase()} credentials exist for
          this provider.
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5EAF2",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#FAFBFD", borderBottom: "1px solid #E5EAF2" }}>
                  {["Store", "Contact", "Address", "Area", "Env"].map((h, i) => (
                    <th
                      key={`${h}-${i}`}
                      style={{
                        textAlign: i === 4 ? "right" : "left",
                        padding: "9px 12px",
                        fontWeight: 700,
                        color: "#64748B",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: "center" }}>
                      <RefreshCw
                        size={16}
                        color="#94A3B8"
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: 28, textAlign: "center", color: "#9BAABB", fontSize: 12.5 }}
                    >
                      {search
                        ? `No stores matching "${search}"`
                        : `No ${environment.toLowerCase()} stores found for this provider.`}
                    </td>
                  </tr>
                ) : (
                  paginated.map((store) => (
                    <tr
                      key={`${store.provider}-${store.id}`}
                      style={{ borderBottom: "1px solid #F0F4FA", transition: "background 0.12s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFD")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Store */}
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              background: store.provider === "PATHAO" ? "#EEF3FB" : "#FDF0F2",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              fontSize: 11,
                              fontWeight: 800,
                              color: store.provider === "PATHAO" ? "#1D4ED8" : "#E11D48",
                            }}
                          >
                            {store.name?.[0]?.toUpperCase() || "S"}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "#0D1B2E",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 170,
                              }}
                            >
                              {store.name}
                            </div>
                            <div style={{ fontSize: 10.5, color: "#9BAABB" }}>#{store.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: "9px 12px", color: "#334155" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Phone size={11} color="#94A3B8" />
                          {store.phone || "—"}
                        </div>
                      </td>

                      {/* Address */}
                      <td style={{ padding: "9px 12px", color: "#334155", maxWidth: 220 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                          <MapPin size={11} color="#94A3B8" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "block",
                            }}
                          >
                            {store.address || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Area */}
                      <td style={{ padding: "9px 12px", color: "#334155" }}>
                        {store.areaLabel || "—"}
                      </td>

                      {/* Env */}
                      <td style={{ padding: "9px 12px", textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: environment === "SANDBOX" ? "#FFFBEB" : "#F0F9F0",
                            color: environment === "SANDBOX" ? "#B45309" : "#16A34A",
                            border: `1px solid ${
                              environment === "SANDBOX" ? "#FDE68A" : "#BBF7D0"
                            }`,
                          }}
                        >
                          {environment}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderTop: "1px solid #E5EAF2",
                fontSize: 11.5,
                color: "#7A90AB",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                </span>
                <PlainSelect
                  value={String(pageSize)}
                  onChange={(v) => setPageSize(Number(v))}
                  width={82}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </PlainSelect>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: "1px solid #E2E8F0",
                    background: "#fff",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    opacity: currentPage <= 1 ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronLeft size={13} />
                </button>
                <span style={{ padding: "0 6px", fontWeight: 700, color: "#334155" }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: "1px solid #E2E8F0",
                    background: "#fff",
                    cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage >= totalPages ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}