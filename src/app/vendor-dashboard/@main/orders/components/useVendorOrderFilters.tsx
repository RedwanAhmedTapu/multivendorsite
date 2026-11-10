"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  OrderStatus,
  FulfillmentStatus,
  VendorOrderFilters,
} from "@/features/vendorOrderApi";

// UI-facing filter shape (all strings so <Select>/<Input> bind cleanly).
export interface VendorOrderUiFilters {
  page: number;
  limit: number;
  search: string;
  status: OrderStatus | "";
  fulfillmentStatus: FulfillmentStatus | "";
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: VendorOrderUiFilters = {
  page: 1,
  limit: 20,
  search: "",
  status: "",
  fulfillmentStatus: "",
  dateFrom: "",
  dateTo: "",
};

export function useVendorOrderFilters() {
  const [filters, setFilters] = useState<VendorOrderUiFilters>(DEFAULT_FILTERS);

  const setFilter = useCallback(
    <K extends keyof VendorOrderUiFilters>(key: K, value: VendorOrderUiFilters[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        // any filter change resets pagination back to page 1
        page: key === "page" ? (value as number) : 1,
      }));
    },
    []
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.fulfillmentStatus) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  // What actually gets passed to useGetVendorOrdersQuery — matches the
  // VendorOrderFilters interface field-for-field (fromDate/toDate, not
  // dateFrom/dateTo), and strips empty values so we don't send "".
  const apiFilters: VendorOrderFilters = useMemo(() => {
    const f: VendorOrderFilters = { page: filters.page, limit: filters.limit };
    if (filters.search) f.search = filters.search;
    if (filters.status) f.status = filters.status;
    if (filters.fulfillmentStatus) f.fulfillmentStatus = filters.fulfillmentStatus;
    if (filters.dateFrom) f.fromDate = filters.dateFrom;
    if (filters.dateTo) f.toDate = filters.dateTo;
    return f;
  }, [filters]);

  return { filters, setFilter, resetFilters, activeFilterCount, apiFilters };
}