import { useState, useCallback, useMemo, useRef } from "react";
import type { AdminOrderFilters } from "@/features/adminOrderApi";

// Extended with UI-only fields (sortBy, sortOrder, limit, page)
export interface OrderFilters extends AdminOrderFilters {
  page: number;
  limit: number;
  sortBy: "createdAt" | "totalAmount";
  sortOrder: "asc" | "desc";
}

const DEFAULT_FILTERS: OrderFilters = {
  page: 1,
  limit: 20,
  search: "",
  status: undefined,
  paymentStatus: undefined,
  fulfillmentStatus: undefined,
  vendorId: "",
  userId: "",
  fromDate: "",
  toDate: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

/** Build clean query params — strip undefined / empty strings */
function buildQueryParams(filters: OrderFilters): AdminOrderFilters {
  const params: AdminOrderFilters = {};
  (Object.entries(filters) as [keyof OrderFilters, any][]).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) {
      // sortBy / sortOrder are UI-only; skip them from API params
      if (k === "sortBy" || k === "sortOrder") return;
      (params as any)[k] = v;
    }
  });
  return params;
}

export function useOrderFilters() {
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS);

  // Stable queryParams ref — only a new object when filters actually change,
  // preventing spurious RTK Query re-subscriptions.
  const queryParamsRef = useRef<AdminOrderFilters>(buildQueryParams(DEFAULT_FILTERS));
  const prevSerializedRef = useRef<string>(JSON.stringify(buildQueryParams(DEFAULT_FILTERS)));

  const serialized = JSON.stringify(buildQueryParams(filters));
  if (serialized !== prevSerializedRef.current) {
    prevSerializedRef.current = serialized;
    queryParamsRef.current = buildQueryParams(filters);
  }

  const setFilter = useCallback(
    <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        page: key === "page" ? (value as number) : 1,
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.paymentStatus) count++;
    if (filters.fulfillmentStatus) count++;
    if (filters.vendorId) count++;
    if (filters.fromDate || filters.toDate) count++;
    return count;
  }, [filters]);

  return {
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    /** Stable reference — only a new object when filters actually change */
    queryParams: queryParamsRef.current,
  };
}