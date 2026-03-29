import { useState, useCallback, useMemo } from "react";
import type { VendorOrderFilters } from "@/types/vendorOrderTypes";

const DEFAULT_FILTERS: VendorOrderFilters = {
  page: 1,
  limit: 20,
  search: "",
  status: "",
  fulfillmentStatus: "",
  dateFrom: "",
  dateTo: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export function useVendorOrderFilters() {
  const [filters, setFilters] = useState<VendorOrderFilters>(DEFAULT_FILTERS);

  const setFilter = useCallback(
    <K extends keyof VendorOrderFilters>(key: K, value: VendorOrderFilters[K]) => {
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
    if (filters.fulfillmentStatus) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  // Stable string arg for RTK Query — avoids setState-during-render error
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("limit", String(filters.limit));
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.fulfillmentStatus) params.set("fulfillmentStatus", filters.fulfillmentStatus);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    params.set("sortBy", filters.sortBy);
    params.set("sortOrder", filters.sortOrder);
    return params.toString();
  }, [
    filters.page,
    filters.limit,
    filters.search,
    filters.status,
    filters.fulfillmentStatus,
    filters.dateFrom,
    filters.dateTo,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // Stats query string (date range only)
  const statsQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    return params.toString();
  }, [filters.dateFrom, filters.dateTo]);

  return {
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    queryString,
    statsQueryString,
  };
}