"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { X, Plus, Minus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGetCategoryFiltersBySlugQuery } from "@/features/apiSlice";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface ProductFilters {
  categories: string[];
  priceRange: [number, number];
  attributes: Record<string, string[]>;
  brands: string[];
  vendors: string[];
  ratings: number[];
  availability: string[];
}

interface FilterSidebarProps {
  categorySlug?: string;
  selectedVendor?: string;
}

interface FilterAttributeValue {
  id: string;
  value: string;
  productCount: number;
}

interface FilterAttribute {
  id: string;
  name: string;
  slug: string;
  type: 'SELECT' | 'MULTISELECT' | 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'FILE';
  unit?: string;
  values: FilterAttributeValue[];
}

interface CategoryFilterResponse {
  success: boolean;
  data: {
    category: {
      id: string;
      name: string;
      slug: string;
      breadcrumb: Array<{ id: string; name: string; slug: string; level: number }>;
    };
    filters: {
      attributes: FilterAttribute[];
      priceRange: { min: number; max: number };
    };
    meta: { totalProducts: number; hasFilters: boolean };
  };
  message: string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categorySlug,
  selectedVendor,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const {
    data: filterResponse,
    isLoading: filterLoading,
    error: filterError
  } = useGetCategoryFiltersBySlugQuery(categorySlug || '', {
    skip: !categorySlug,
  });

  const filterData: CategoryFilterResponse['data'] | undefined = filterResponse?.data;
  const apiPriceMin = filterData?.filters?.priceRange?.min;
  const apiPriceMax = filterData?.filters?.priceRange?.max;
  const priceBoundsPending = Boolean(categorySlug) && filterLoading && !filterError;

  const [filters, setFilters] = useState<ProductFilters>(() => {
    const hasUrlMin = searchParams.has("minPrice");
    const hasUrlMax = searchParams.has("maxPrice");
    const urlMin = hasUrlMin ? parseInt(searchParams.get("minPrice") || "0") : 0;
    const urlMax = hasUrlMax ? parseInt(searchParams.get("maxPrice") || "100000") : 100000;
    const urlRatings = searchParams.get("ratings")?.split(",").map(Number).filter(n => !isNaN(n)) || [];
    const urlAvail = searchParams.get("availability")?.split(",") || [];
    const urlBrands = searchParams.get("brands")?.split(",") || [];

    const attrs: Record<string, string[]> = {};
    const urlAttrs = searchParams.get("attrs")?.split(",") || [];
    urlAttrs.forEach(attr => {
      const [key, vals] = attr.split(":");
      if (key && vals) attrs[key] = vals.split("-");
    });

    return {
      categories: categorySlug ? [categorySlug] : [],
      priceRange: [urlMin, urlMax],
      attributes: attrs,
      brands: urlBrands,
      vendors: selectedVendor ? [selectedVendor] : [],
      ratings: urlRatings,
      availability: urlAvail,
    };
  });

  // ✅ text input state — শুধু টাইপ করার সময় এখানে আপডেট হয়, updateFilters()
  // এখান থেকে কল হয় না, তাই নিচের sync effect কখনো টাইপ করার মাঝপথে
  // ওভাররাইট করবে না (আগের bug এখানেই ছিল)।
  const [minPriceInput, setMinPriceInput] = useState<string>(filters.priceRange[0].toString());
  const [maxPriceInput, setMaxPriceInput] = useState<string>(filters.priceRange[1].toString());

  // filters.priceRange শুধু commit (blur/enter), API load, বা clear-এর সময় বদলায় —
  // তাই এই effect শুধু তখনই fire করবে, keystroke-এ না।
  useEffect(() => {
    setMinPriceInput(filters.priceRange[0].toString());
    setMaxPriceInput(filters.priceRange[1].toString());
  }, [filters.priceRange]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    attributes: true,
    ratings: true,
    availability: true,
  });

  const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>({});

  // API থেকে price bounds এলে, URL-এ আগে থেকে min/maxPrice না থাকলে সেট করো
  useEffect(() => {
    if (apiPriceMin !== undefined && apiPriceMax !== undefined) {
      if (!searchParams.get("minPrice") && !searchParams.get("maxPrice")) {
        setFilters((prev) => ({
          ...prev,
          priceRange: [apiPriceMin, apiPriceMax],
        }));
      }
    }
  }, [apiPriceMin, apiPriceMax, searchParams]);

  const updateFilters = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);

    const params = new URLSearchParams(searchParams.toString());

    const defaultMin = apiPriceMin ?? 0;
    const defaultMax = apiPriceMax ?? 100000;
    if (newFilters.priceRange[0] > defaultMin) params.set("minPrice", String(newFilters.priceRange[0]));
    else params.delete("minPrice");

    if (newFilters.priceRange[1] < defaultMax) params.set("maxPrice", String(newFilters.priceRange[1]));
    else params.delete("maxPrice");

    if (newFilters.ratings.length > 0) params.set("ratings", newFilters.ratings.join(","));
    else params.delete("ratings");

    if (newFilters.availability.length > 0) params.set("availability", newFilters.availability.join(","));
    else params.delete("availability");

    if (newFilters.brands.length > 0) params.set("brands", newFilters.brands.join(","));
    else params.delete("brands");

    const attrStrings = Object.entries(newFilters.attributes)
      .map(([key, vals]) => `${key}:${vals.join("-")}`)
      .filter(Boolean);
    if (attrStrings.length > 0) params.set("attrs", attrStrings.join(","));
    else params.delete("attrs");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, apiPriceMin, apiPriceMax, pathname]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const toggleArrayFilter = useCallback((
    key: "ratings" | "availability" | "brands" | "vendors",
    value: string | number
  ) => {
    updateFilters({
      ...filters,
      [key]: (filters[key] as (string | number)[]).includes(value)
        ? (filters[key] as (string | number)[]).filter((item) => item !== value)
        : [...(filters[key] as (string | number)[]), value]
    });
  }, [filters, updateFilters]);

  const toggleAttributeFilter = useCallback((attributeId: string, valueId: string) => {
    updateFilters({
      ...filters,
      attributes: {
        ...filters.attributes,
        [attributeId]: (filters.attributes[attributeId] || []).includes(valueId)
          ? (filters.attributes[attributeId] || []).filter((id) => id !== valueId)
          : [...(filters.attributes[attributeId] || []), valueId]
      }
    });
  }, [filters, updateFilters]);

  // ✅ টাইপ করার সময় শুধু local string state আপডেট হয় — router.push/updateFilters
  // এখানে কল হচ্ছে না, তাই বার বার entry দেওয়ার bug টা আর ঘটবে না
  const handleMinPriceChange = (value: string) => {
    setMinPriceInput(value.replace(/\D/g, ""));
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPriceInput(value.replace(/\D/g, ""));
  };

  // ✅ commit শুধু blur/Enter-এ হয়
  const commitMinPrice = useCallback(() => {
    const priceMin = apiPriceMin ?? 0;
    const numValue = parseInt(minPriceInput, 10);
    const safeValue = isNaN(numValue) ? priceMin : numValue;
    const validMin = Math.max(priceMin, Math.min(safeValue, filters.priceRange[1]));
    setMinPriceInput(validMin.toString());
    if (validMin !== filters.priceRange[0]) {
      updateFilters({ ...filters, priceRange: [validMin, filters.priceRange[1]] });
    }
  }, [minPriceInput, filters, apiPriceMin, updateFilters]);

  const commitMaxPrice = useCallback(() => {
    const priceMax = apiPriceMax ?? 100000;
    const numValue = parseInt(maxPriceInput, 10);
    const safeValue = isNaN(numValue) ? priceMax : numValue;
    const validMax = Math.min(priceMax, Math.max(safeValue, filters.priceRange[0]));
    setMaxPriceInput(validMax.toString());
    if (validMax !== filters.priceRange[1]) {
      updateFilters({ ...filters, priceRange: [filters.priceRange[0], validMax] });
    }
  }, [maxPriceInput, filters, apiPriceMax, updateFilters]);

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, commit: () => void) => {
    if (e.key === "Enter") {
      commit();
      (e.target as HTMLInputElement).blur();
    }
  };

  const clearAllFilters = useCallback(() => {
    const defaultPriceRange: [number, number] = [apiPriceMin ?? 0, apiPriceMax ?? 100000];

    const clearedFilters: ProductFilters = {
      categories: categorySlug ? [categorySlug] : [],
      priceRange: defaultPriceRange,
      attributes: {},
      brands: [],
      vendors: selectedVendor ? [selectedVendor] : [],
      ratings: [],
      availability: [],
    };

    updateFilters(clearedFilters);
  }, [apiPriceMin, apiPriceMax, categorySlug, selectedVendor, updateFilters]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    const defaultMin = apiPriceMin ?? 0;
    const defaultMax = apiPriceMax ?? 100000;

    if (filters.priceRange[0] > defaultMin || filters.priceRange[1] < defaultMax) count += 1;
    count += Object.values(filters.attributes).flat().length;
    count += filters.brands.length;
    if (!selectedVendor) count += filters.vendors.length;
    count += filters.ratings.length;
    count += filters.availability.length;
    return count;
  }, [filters, apiPriceMin, apiPriceMax, selectedVendor]);

  const removeFilter = useCallback((
    type: string,
    key?: string,
    value?: string | number
  ) => {
    const defaultPriceRange: [number, number] = [apiPriceMin ?? 0, apiPriceMax ?? 100000];

    switch (type) {
      case "price":
        updateFilters({ ...filters, priceRange: defaultPriceRange });
        break;
      case "attribute":
        if (key && value) {
          updateFilters({
            ...filters,
            attributes: { ...filters.attributes, [key]: (filters.attributes[key] || []).filter(v => v !== value) },
          });
        }
        break;
      case "brand":
        if (value) updateFilters({ ...filters, brands: filters.brands.filter(b => b !== value) });
        break;
      case "vendor":
        if (value) updateFilters({ ...filters, vendors: filters.vendors.filter(v => v !== value) });
        break;
      case "rating":
        if (value !== undefined) updateFilters({ ...filters, ratings: filters.ratings.filter(r => r !== value) });
        break;
      case "availability":
        if (value) updateFilters({ ...filters, availability: filters.availability.filter(a => a !== value) });
        break;
    }
  }, [filters, apiPriceMin, apiPriceMax, updateFilters]);

  const filterableAttributes = useMemo(() => {
    if (!filterData?.filters?.attributes) return [];
    return filterData.filters.attributes.filter((attr: FilterAttribute) => attr.values && attr.values.length > 0);
  }, [filterData]);

  const hasCategoryFilters = useMemo(() => {
    return filterData?.meta?.hasFilters && filterableAttributes.length > 0;
  }, [filterData, filterableAttributes]);

  const getDisplayValueWithUnit = (attribute: FilterAttribute, value: FilterAttributeValue): string => {
    const valueStr = String(value.value);
    return attribute.unit ? `${valueStr} ${attribute.unit}` : valueStr;
  };

  const FilterSection: React.FC<{
    title: string;
    sectionKey: string;
    children: React.ReactNode;
    count?: number;
  }> = useCallback(({ title, sectionKey, children, count }) => (
    <div className="pb-3 border-b border-gray-200 last:border-b-0">
      <div
        className="flex justify-between items-center mb-2 cursor-pointer hover:text-primary transition-colors group"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 group-hover:text-gray-900">
            {title}
          </h3>
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 min-w-[18px] h-5 flex items-center justify-center">
              {count}
            </Badge>
          )}
        </div>
        {expandedSections[sectionKey] ? <Minus size={14} className="text-gray-500" /> : <Plus size={14} className="text-gray-500" />}
      </div>
      {expandedSections[sectionKey] && <div className="mt-2">{children}</div>}
    </div>
  ), [expandedSections, toggleSection]);

  const renderCommonFilters = useCallback(() => {
    const priceMin = apiPriceMin ?? 0;
    const priceMax = apiPriceMax ?? 100000;

    return (
      <>
        <FilterSection title="Price Range" sectionKey="price" count={(filters.priceRange[0] > priceMin || filters.priceRange[1] < priceMax) ? 1 : 0}>
          {priceBoundsPending ? (
            <div className="space-y-2 animate-pulse">
              <div className="flex gap-2">
                <div className="h-8 flex-1 bg-gray-200 rounded"></div>
                <div className="h-8 flex-1 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Min Price</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={minPriceInput}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    onBlur={commitMinPrice}
                    onKeyDown={(e) => handlePriceKeyDown(e, commitMinPrice)}
                    className="h-8 text-sm px-2"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Max Price</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={maxPriceInput}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    onBlur={commitMaxPrice}
                    onKeyDown={(e) => handlePriceKeyDown(e, commitMaxPrice)}
                    className="h-8 text-sm px-2"
                    placeholder="100000"
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>৳{priceMin}</span>
                <span>৳{priceMax}</span>
              </div>
            </div>
          )}
        </FilterSection>

        <FilterSection title="Ratings" sectionKey="ratings" count={filters.ratings.length}>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2 hover:bg-gray-50 p-1.5 rounded transition-colors">
                <Checkbox id={`rating-${rating}`} checked={filters.ratings.includes(rating)} onCheckedChange={() => toggleArrayFilter("ratings", rating)} className="h-4 w-4" />
                <label htmlFor={`rating-${rating}`} className="flex items-center text-sm text-gray-700 cursor-pointer flex-1">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                  <span className="ml-1.5 text-xs">& Up</span>
                </label>
              </div>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Availability" sectionKey="availability" count={filters.availability.length}>
          <div className="space-y-1.5">
            {[
              { value: "inStock", label: "In Stock" },
              { value: "onSale", label: "On Sale" },
              { value: "newArrivals", label: "New Arrivals" },
              { value: "freeShipping", label: "Free Shipping" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2 hover:bg-gray-50 p-1.5 rounded transition-colors">
                <Checkbox id={`avail-${option.value}`} checked={filters.availability.includes(option.value)} onCheckedChange={() => toggleArrayFilter("availability", option.value)} className="h-4 w-4" />
                <label htmlFor={`avail-${option.value}`} className="text-sm text-gray-700 cursor-pointer flex-1">{option.label}</label>
              </div>
            ))}
          </div>
        </FilterSection>
      </>
    );
  }, [filters, apiPriceMin, apiPriceMax, priceBoundsPending, minPriceInput, maxPriceInput, commitMinPrice, commitMaxPrice, toggleArrayFilter, FilterSection]);

  const renderDynamicAttributes = useCallback(() => {
    if (!filterableAttributes.length) return null;

    return filterableAttributes.map((attribute: FilterAttribute) => {
      const selectedCount = filters.attributes[attribute.id]?.length || 0;
      const displayLimit = 6;
      const shouldShowToggle = attribute.values.length > displayLimit;
      const displayValues = showAllItems[attribute.id] ? attribute.values : attribute.values.slice(0, displayLimit);

      return (
        <FilterSection key={attribute.id} title={`${attribute.name}${attribute.unit ? ` (${attribute.unit})` : ""}`} sectionKey={`attr-${attribute.id}`} count={selectedCount}>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
            {displayValues.map((value: FilterAttributeValue) => {
              const displayValue = getDisplayValueWithUnit(attribute, value);
              return (
                <div key={value.id} className="flex items-center space-x-2 hover:bg-gray-50 p-1.5 rounded transition-colors">
                  <Checkbox id={`attr-${value.id}`} checked={filters.attributes[attribute.id]?.includes(value.id) || false} onCheckedChange={() => toggleAttributeFilter(attribute.id, value.id)} className="h-4 w-4" />
                  <label htmlFor={`attr-${value.id}`} className="text-sm text-gray-700 cursor-pointer flex-1 truncate" title={displayValue}>{displayValue}</label>
                </div>
              );
            })}
          </div>
          {shouldShowToggle && (
            <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs w-full hover:bg-gray-100" onClick={() => setShowAllItems((prev) => ({ ...prev, [attribute.id]: !prev[attribute.id] }))}>
              {showAllItems[attribute.id] ? "Show Less" : `+${attribute.values.length - displayLimit} more`}
            </Button>
          )}
        </FilterSection>
      );
    });
  }, [filterableAttributes, filters, showAllItems, toggleAttributeFilter, FilterSection, getDisplayValueWithUnit]);

  const FilterContent = useCallback(() => {
    const activeCount = getActiveFilterCount();
    const defaultMin = apiPriceMin ?? 0;
    const defaultMax = apiPriceMax ?? 100000;

    if (filterLoading && categorySlug) {
      return (
        <div className="w-full md:w-64 p-4 h-full md:h-fit overflow-y-auto bg-transparent">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      );
    }

    if (filterError) {
      return (
        <div className="w-full md:w-64 p-4 h-full md:h-fit bg-transparent overflow-y-auto">
          <div className="text-center py-6">
            <p className="text-sm text-red-500">Failed to load filters</p>
            <p className="text-xs text-gray-400 mt-2">Showing common filters only</p>
          </div>
          {renderCommonFilters()}
        </div>
      );
    }

    return (
      <div className="w-full md:w-64 p-4 h-full md:h-fit bg-transparent overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 px-1.5 h-5">{activeCount}</Badge>
            )}
          </div>
          <div className="flex gap-1">
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-7 px-2 hover:bg-red-50 hover:text-red-600">Clear</Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden h-7 w-7" onClick={() => setIsMobileOpen(false)}><X size={14} /></Button>
          </div>
        </div>

        {activeCount > 0 && (
          <div className="mb-4 p-2.5 bg-blue-50 rounded border border-blue-100">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Active Filters</h3>
            <div className="flex flex-wrap gap-1.5">
              {(filters.priceRange[0] > defaultMin || filters.priceRange[1] < defaultMax) && (
                <Badge variant="secondary" className="flex items-center gap-1 py-1 px-2 text-xs bg-white hover:bg-gray-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); removeFilter("price"); }}>
                  ৳{filters.priceRange[0].toLocaleString()}-৳{filters.priceRange[1].toLocaleString()}
                  <X size={12} className="hover:text-red-500" />
                </Badge>
              )}

              {Object.entries(filters.attributes).map(([attrId, values]) =>
                values.map((valueId) => {
                  const attribute = filterableAttributes.find((a: FilterAttribute) => a.id === attrId);
                  const value = attribute?.values.find((v: any) => v.id === valueId);
                  if (!attribute || !value) return null;
                  const displayValue = getDisplayValueWithUnit(attribute, value);
                  return (
                    <Badge key={`${attrId}-${valueId}`} variant="secondary" className="flex items-center gap-1 py-1 px-2 text-xs bg-white hover:bg-gray-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); removeFilter("attribute", attrId, valueId); }}>
                      {attribute.name}: {displayValue}
                      <X size={12} className="hover:text-red-500" />
                    </Badge>
                  );
                })
              )}

              {filters.ratings.map((rating) => (
                <Badge key={rating} variant="secondary" className="flex items-center gap-1 py-1 px-2 text-xs bg-white hover:bg-gray-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); removeFilter("rating", undefined, rating); }}>
                  {rating}★
                  <X size={12} className="hover:text-red-500" />
                </Badge>
              ))}

              {filters.availability.map((avail) => (
                <Badge key={avail} variant="secondary" className="flex items-center gap-1 py-1 px-2 text-xs bg-white hover:bg-gray-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); removeFilter("availability", undefined, avail); }}>
                  {avail === 'inStock' ? 'In Stock' : avail === 'onSale' ? 'On Sale' : avail === 'newArrivals' ? 'New Arrivals' : 'Free Shipping'}
                  <X size={12} className="hover:text-red-500" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {hasCategoryFilters && renderDynamicAttributes()}
          {renderCommonFilters()}
        </div>
      </div>
    );
  }, [filterLoading, categorySlug, filterError, apiPriceMin, apiPriceMax, filters, getActiveFilterCount, removeFilter, filterableAttributes, clearAllFilters, hasCategoryFilters, renderCommonFilters, renderDynamicAttributes, getDisplayValueWithUnit]);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-teal-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-medium hover:bg-teal-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
      </button>

      <aside className="hidden md:block filter-sidebar sticky top-4 w-64 flex-shrink-0">
        <FilterContent />
      </aside>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`
        fixed top-0 left-0 h-full w-full bg-white z-50 transform transition-transform duration-300 ease-in-out
        md:hidden filter-sidebar overflow-y-auto 
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <FilterContent />
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
      `}</style>
    </>
  );
};