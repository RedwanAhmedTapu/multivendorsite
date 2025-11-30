"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { X, Plus, Minus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGetCategoryFiltersQuery } from "@/features/apiSlice";
import { useSearchParams } from "next/navigation";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ProductFilters {
  categories: string[];
  priceRange: [number, number];
  attributes: Record<string, string[]>;
  specifications: Record<string, string[]>;
  brands: string[];
  vendors: string[];
  ratings: number[];
  availability: string[];
}

interface FilterSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  categoryId?: string;
  selectedVendor?: string;
  onFiltersChange: (filters: ProductFilters) => void;
  currentFilters?: ProductFilters;
}

// ============================================
// FILTER SIDEBAR COMPONENT
// ============================================

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isMobileOpen,
  onMobileClose,
  categoryId,
  selectedVendor,
  onFiltersChange,
  currentFilters: externalFilters,
}) => {
  const searchParams = useSearchParams();
  
  // Check if products page has any parameters in URL
  const hasUrlParams = useMemo(() => {
    return searchParams.toString().length > 0;
  }, [searchParams]);

  // FIXED: The query returns CategoryFilterResponse directly, not wrapped in { data: ... }
  const { 
    data: filtersr, // filterData is CategoryFilterResponse
    isLoading: filterLoading,
    isSuccess: filterSuccess,
    error: filterError 
  } = useGetCategoryFiltersQuery(categoryId || '', {
    skip: !categoryId,
  });
  
  const filterData = filtersr?.data;
  console.log(filterSuccess, "fil");

  // Initialize filters with proper defaults - 0 to 1 lakh
  const [internalFilters, setInternalFilters] = useState<ProductFilters>({
    categories: [],
    priceRange: [0, 100000],
    attributes: {},
    specifications: {},
    brands: [],
    vendors: selectedVendor ? [selectedVendor] : [],
    ratings: [],
    availability: [],
  });

  // Price input states - keep as strings for input
  const [minPriceInput, setMinPriceInput] = useState<string>("0");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("100000");

  // All sections expanded by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    attributes: true,
    specifications: true,
    ratings: true,
    availability: true,
  });

  const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>({});

  // Use external filters if provided, otherwise use internal state
  const filters = externalFilters || internalFilters;
  console.log(filterData, "filterData");

  // Sync price inputs with filters
  useEffect(() => {
    setMinPriceInput(filters.priceRange[0].toString());
    setMaxPriceInput(filters.priceRange[1].toString());
  }, [filters.priceRange]);

  // Update price range when filter data loads
  useEffect(() => {
    if (filterData?.filters?.priceRange && !externalFilters) {
      setInternalFilters((prev) => {
        if (prev.priceRange[0] === 0 && prev.priceRange[1] === 100000) {
          return {
            ...prev,
            priceRange: [
              filterData.filters.priceRange.min,
              filterData.filters.priceRange.max
            ],
          };
        }
        return prev;
      });
    }
  }, [filterData, externalFilters]);

  // Memoized filter update to prevent unnecessary re-renders
  const updateFilters = useCallback((newFilters: ProductFilters) => {
    if (externalFilters) {
      onFiltersChange(newFilters);
    } else {
      setInternalFilters(newFilters);
      onFiltersChange(newFilters);
    }
  }, [externalFilters, onFiltersChange]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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

  const toggleSpecificationFilter = useCallback((specId: string, value: string | number) => {
    const valueStr = String(value);
    updateFilters({
      ...filters,
      specifications: {
        ...filters.specifications,
        [specId]: (filters.specifications[specId] || []).includes(valueStr)
          ? (filters.specifications[specId] || []).filter((v) => v !== valueStr)
          : [...(filters.specifications[specId] || []), valueStr]
      }
    });
  }, [filters, updateFilters]);

  // Handle price input changes with auto-apply
  const handleMinPriceChange = (value: string) => {
    setMinPriceInput(value);
    
    // Convert string to number, handle empty string as 0
    const numValue = value === "" ? 0 : parseInt(value.replace(/\D/g, "")) || 0;
    
    // Apply filter if valid
    if (numValue >= 0 && numValue <= filters.priceRange[1]) {
      updateFilters({
        ...filters,
        priceRange: [numValue, filters.priceRange[1]],
      });
    }
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPriceInput(value);
    
    // Convert string to number, handle empty string as max
    const numValue = value === "" ? 100000 : parseInt(value.replace(/\D/g, "")) || 100000;
    
    // Apply filter if valid
    if (numValue >= filters.priceRange[0] && numValue <= 100000) {
      updateFilters({
        ...filters,
        priceRange: [filters.priceRange[0], numValue],
      });
    }
  };

  // Handle blur to ensure valid values
  const handleMinPriceBlur = () => {
    const numValue = parseInt(minPriceInput.replace(/\D/g, "")) || 0;
    const validMin = Math.max(0, Math.min(numValue, filters.priceRange[1]));
    setMinPriceInput(validMin.toString());
    updateFilters({
      ...filters,
      priceRange: [validMin, filters.priceRange[1]],
    });
  };

  const handleMaxPriceBlur = () => {
    const numValue = parseInt(maxPriceInput.replace(/\D/g, "")) || 100000;
    const validMax = Math.min(100000, Math.max(numValue, filters.priceRange[0]));
    setMaxPriceInput(validMax.toString());
    updateFilters({
      ...filters,
      priceRange: [filters.priceRange[0], validMax],
    });
  };

  const clearAllFilters = useCallback(() => {
    const defaultPriceRange = filterData?.filters?.priceRange
      ? [filterData.filters.priceRange.min, filterData.filters.priceRange.max]
      : [0, 100000];

    const clearedFilters = {
      categories: categoryId && filterData ? [filterData.category.id] : [],
      priceRange: defaultPriceRange as [number, number],
      attributes: {},
      specifications: {},
      brands: [],
      vendors: selectedVendor ? [selectedVendor] : [],
      ratings: [],
      availability: [],
    };

    updateFilters(clearedFilters);
    setMinPriceInput(defaultPriceRange[0].toString());
    setMaxPriceInput(defaultPriceRange[1].toString());
  }, [filterData, categoryId, selectedVendor, updateFilters]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    const defaultMin = filterData?.filters?.priceRange?.min || 0;
    const defaultMax = filterData?.filters?.priceRange?.max || 100000;
    
    if (filters.priceRange[0] > defaultMin || filters.priceRange[1] < defaultMax) {
      count += 1;
    }
    count += Object.values(filters.attributes).flat().length;
    count += Object.values(filters.specifications).flat().length;
    count += filters.brands.length;
    if (!selectedVendor) count += filters.vendors.length;
    count += filters.ratings.length;
    count += filters.availability.length;
    return count;
  }, [filters, filterData, selectedVendor]);

  // Fixed removeFilter function
  const removeFilter = useCallback((
    type: string,
    key?: string,
    value?: string | number
  ) => {
    const defaultPriceRange = filterData?.filters?.priceRange
      ? [filterData.filters.priceRange.min, filterData.filters.priceRange.max]
      : [0, 100000];

    switch (type) {
      case "price":
        updateFilters({
          ...filters,
          priceRange: defaultPriceRange as [number, number],
        });
        setMinPriceInput(defaultPriceRange[0].toString());
        setMaxPriceInput(defaultPriceRange[1].toString());
        break;
      
      case "attribute":
        if (key && value) {
          const currentValues = filters.attributes[key] || [];
          const newValues = currentValues.filter(v => v !== value);
          updateFilters({
            ...filters,
            attributes: {
              ...filters.attributes,
              [key]: newValues,
            },
          });
        }
        break;
      
      case "specification":
        if (key && value) {
          const currentValues = filters.specifications[key] || [];
          const newValues = currentValues.filter(v => v !== String(value));
          updateFilters({
            ...filters,
            specifications: {
              ...filters.specifications,
              [key]: newValues,
            },
          });
        }
        break;
      
      case "brand":
        if (value) {
          const newBrands = filters.brands.filter(b => b !== value);
          updateFilters({
            ...filters,
            brands: newBrands,
          });
        }
        break;
      
      case "vendor":
        if (value) {
          const newVendors = filters.vendors.filter(v => v !== value);
          updateFilters({
            ...filters,
            vendors: newVendors,
          });
        }
        break;
      
      case "rating":
        if (value !== undefined) {
          const newRatings = filters.ratings.filter(r => r !== value);
          updateFilters({
            ...filters,
            ratings: newRatings,
          });
        }
        break;
      
      case "availability":
        if (value) {
          const newAvailability = filters.availability.filter(a => a !== value);
          updateFilters({
            ...filters,
            availability: newAvailability,
          });
        }
        break;
    }
  }, [filters, filterData, updateFilters]);

  // Get filterable items from API response
  const filterableAttributes = useMemo(() => {
    return filterData?.filters?.attributes || [];
  }, [filterData]);

  const filterableSpecifications = useMemo(() => {
    return filterData?.filters?.specifications || [];
  }, [filterData]);

  // Check if we have category-specific filters
  const hasCategoryFilters = useMemo(() => {
    return filterData?.meta?.hasFilters && 
           (filterableAttributes.length > 0 || filterableSpecifications.length > 0);
  }, [filterData, filterableAttributes, filterableSpecifications]);

  // FilterSection component with larger text
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
        {expandedSections[sectionKey] ? (
          <Minus size={14} className="text-gray-500" />
        ) : (
          <Plus size={14} className="text-gray-500" />
        )}
      </div>
      {expandedSections[sectionKey] && <div className="mt-2">{children}</div>}
    </div>
  ), [expandedSections, toggleSection]);

  // Render common filters (price, ratings, availability)
  const renderCommonFilters = useCallback(() => {
    return (
      <>
        {/* Price Range with Auto-Apply Input Fields */}
        <FilterSection
          title="Price Range"
          sectionKey="price"
          count={
            (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) ? 1 : 0
          }
        >
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Min Price</label>
                <Input
                  type="text"
                  value={minPriceInput}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  onBlur={handleMinPriceBlur}
                  className="h-8 text-sm px-2"
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Max Price</label>
                <Input
                  type="text"
                  value={maxPriceInput}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  onBlur={handleMaxPriceBlur}
                  className="h-8 text-sm px-2"
                  placeholder="100000"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>৳0</span>
              <span>৳1L</span>
            </div>
          </div>
        </FilterSection>

        {/* Customer Ratings */}
        <FilterSection
          title="Ratings"
          sectionKey="ratings"
          count={filters.ratings.length}
        >
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div
                key={rating}
                className="flex items-center space-x-2 hover:bg-gray-50 p-1.5 rounded transition-colors"
              >
                <Checkbox
                  id={`rating-${rating}`}
                  checked={filters.ratings.includes(rating)}
                  onCheckedChange={() => toggleArrayFilter("ratings", rating)}
                  className="h-4 w-4"
                />
                <label
                  htmlFor={`rating-${rating}`}
                  className="flex items-center text-sm text-gray-700 cursor-pointer flex-1"
                >
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="ml-1.5 text-xs">& Up</span>
                </label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Availability */}
        <FilterSection
          title="Availability"
          sectionKey="availability"
          count={filters.availability.length}
        >
          <div className="space-y-1.5">
            {[
              { value: "inStock", label: "In Stock" },
              { value: "onSale", label: "On Sale" },
              { value: "newArrivals", label: "New Arrivals" },
              { value: "freeShipping", label: "Free Shipping" },
            ].map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 hover:bg-gray-50 p-1.5 rounded transition-colors"
              >
                <Checkbox
                  id={`avail-${option.value}`}
                  checked={filters.availability.includes(option.value)}
                  onCheckedChange={() =>
                    toggleArrayFilter("availability", option.value)
                  }
                  className="h-4 w-4"
                />
                <label
                  htmlFor={`avail-${option.value}`}
                  className="text-sm text-gray-700 cursor-pointer flex-1"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </FilterSection>
      </>
    );
  }, [filters, minPriceInput, maxPriceInput, handleMinPriceChange, handleMaxPriceChange, handleMinPriceBlur, handleMaxPriceBlur, toggleArrayFilter, FilterSection]);

  const FilterContent = useCallback(() => {
    const activeCount = getActiveFilterCount();
    const defaultMin = filterData?.filters?.priceRange?.min || 0;
    const defaultMax = filterData?.filters?.priceRange?.max || 100000;

    // Loading state
    if (filterLoading && categoryId) {
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

    // Error state
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

    // No data yet but still show common filters
    if (!filterData && categoryId) {
      return (
        <div className="w-full md:w-64 p-4 h-full md:h-fit bg-transparent overflow-y-auto">
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">Loading category filters...</p>
            <p className="text-xs text-gray-400 mt-1">Common filters available below</p>
          </div>
          {renderCommonFilters()}
        </div>
      );
    }

    return (
      <div className="w-full md:w-64 p-4 h-full md:h-fit bg-transparent overflow-y-auto">
        {/* Header with Clear All and Close */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 px-1.5 h-5">
                {activeCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs h-7 px-2 hover:bg-red-50 hover:text-red-600"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-7 w-7"
              onClick={onMobileClose}
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeCount > 0 && (
          <div className="mb-4 p-2.5 bg-blue-50 rounded border border-blue-100">
            <h3 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">
              Active Filters
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {/* Price filter */}
              {(filters.priceRange[0] > defaultMin || filters.priceRange[1] < defaultMax) && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2 text-xs bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFilter("price");
                  }}
                >
                  ৳{filters.priceRange[0].toLocaleString()}-৳{filters.priceRange[1].toLocaleString()}
                  <X size={12} className="hover:text-red-500" />
                </Badge>
              )}

              {/* Attribute filters */}
              {Object.entries(filters.attributes).map(([attrId, values]) =>
                values.map((valueId) => {
                  const attribute = filterableAttributes.find((a: any) => a.id === attrId);
                  const value = attribute?.values.find((v: any) => v.id === valueId);
                  return value ? (
                    <Badge
                      key={`${attrId}-${valueId}`}
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2 text-xs bg-white hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFilter("attribute", attrId, valueId);
                      }}
                    >
                      {attribute?.name}: {value.value}
                      <X size={12} className="hover:text-red-500" />
                    </Badge>
                  ) : null;
                })
              )}

              {/* Specification filters */}
              {Object.entries(filters.specifications).map(([specId, values]) =>
                values.map((value) => {
                  const spec = filterableSpecifications.find((s: any) => s.id === specId);
                  return spec ? (
                    <Badge
                      key={`${specId}-${value}`}
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2 text-xs bg-white hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFilter("specification", specId, value);
                      }}
                    >
                      {spec?.name}: {value}{spec?.unit && spec.unit}
                      <X size={12} className="hover:text-red-500" />
                    </Badge>
                  ) : null;
                })
              )}

              {/* Rating filters */}
              {filters.ratings.map((rating) => (
                <Badge
                  key={rating}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2 text-xs bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFilter("rating", undefined, rating);
                  }}
                >
                  {rating}★
                  <X size={12} className="hover:text-red-500" />
                </Badge>
              ))}

              {/* Availability filters */}
              {filters.availability.map((avail) => (
                <Badge
                  key={avail}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2 text-xs bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFilter("availability", undefined, avail);
                  }}
                >
                  {avail}
                  <X size={12} className="hover:text-red-500" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Filter Sections */}
        <div className="space-y-3">
          {/* Dynamic Attributes from API */}
          {hasCategoryFilters && filterableAttributes.length > 0 && filterableAttributes.map((attribute: any) => {
            const selectedCount = filters.attributes[attribute.id]?.length || 0;
            const displayLimit = 6;
            const shouldShowToggle = attribute.values.length > displayLimit;
            const displayValues = showAllItems[attribute.id]
              ? attribute.values
              : attribute.values.slice(0, displayLimit);

            return (
              <FilterSection
                key={attribute.id}
                title={attribute.name}
                sectionKey={`attr-${attribute.id}`}
                count={selectedCount}
              >
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                  {displayValues.map((value: any) => (
                    <div
                      key={value.id}
                      className="flex items-center justify-between space-x-2 hover:bg-gray-50 p-1.5 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Checkbox
                          id={`attr-${value.id}`}
                          checked={
                            filters.attributes[attribute.id]?.includes(value.id) || false
                          }
                          onCheckedChange={() =>
                            toggleAttributeFilter(attribute.id, value.id)
                          }
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={`attr-${value.id}`}
                          className="text-sm text-gray-700 cursor-pointer flex-1 truncate"
                          title={value.value}
                        >
                          {value.value}
                        </label>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        ({value.productCount})
                      </span>
                    </div>
                  ))}
                </div>
                {shouldShowToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 px-2 text-xs w-full hover:bg-gray-100"
                    onClick={() =>
                      setShowAllItems((prev) => ({
                        ...prev,
                        [attribute.id]: !prev[attribute.id],
                      }))
                    }
                  >
                    {showAllItems[attribute.id]
                      ? "Show Less"
                      : `+${attribute.values.length - displayLimit} more`}
                  </Button>
                )}
              </FilterSection>
            );
          })}

          {/* Dynamic Specifications from API */}
          {hasCategoryFilters && filterableSpecifications.length > 0 && filterableSpecifications.map((specification: any) => {
            const selectedCount = filters.specifications[specification.id]?.length || 0;
            const displayLimit = 6;
            const shouldShowToggle = specification.values.length > displayLimit;
            const displayValues = showAllItems[specification.id]
              ? specification.values
              : specification.values.slice(0, displayLimit);

            return (
              <FilterSection
                key={specification.id}
                title={`${specification.name}${specification.unit ? ` (${specification.unit})` : ""}`}
                sectionKey={`spec-${specification.id}`}
                count={selectedCount}
              >
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                  {displayValues.map((specValue: any, index: number) => (
                    <div
                      key={`${specification.id}-${specValue.value}-${index}`}
                      className="flex items-center justify-between space-x-2 hover:bg-gray-50 p-1.5 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Checkbox
                          id={`spec-${specification.id}-${specValue.value}`}
                          checked={
                            filters.specifications[specification.id]?.includes(String(specValue.value)) || false
                          }
                          onCheckedChange={() =>
                            toggleSpecificationFilter(specification.id, specValue.value)
                          }
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={`spec-${specification.id}-${specValue.value}`}
                          className="text-sm text-gray-700 cursor-pointer flex-1 truncate"
                          title={String(specValue.value)}
                        >
                          {specValue.value}
                        </label>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        ({specValue.productCount})
                      </span>
                    </div>
                  ))}
                </div>
                {shouldShowToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 px-2 text-xs w-full hover:bg-gray-100"
                    onClick={() =>
                      setShowAllItems((prev) => ({
                        ...prev,
                        [specification.id]: !prev[specification.id],
                      }))
                    }
                  >
                    {showAllItems[specification.id]
                      ? "Show Less"
                      : `+${specification.values.length - displayLimit} more`}
                  </Button>
                )}
              </FilterSection>
            );
          })}

          {/* Always show common filters */}
          {renderCommonFilters()}

          {/* Show message when no category filters available */}
          {categoryId && !hasCategoryFilters && filterData && (
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-600 text-center">No additional filters</p>
              <p className="text-xs text-gray-400 mt-1 text-center">Use common filters above</p>
            </div>
          )}
        </div>
      </div>
    );
  }, [
    filterLoading, categoryId, filterError, filterData, 
    filters, getActiveFilterCount, removeFilter, filterableAttributes, 
    filterableSpecifications, toggleAttributeFilter, toggleSpecificationFilter, 
    showAllItems, expandedSections, 
    onMobileClose, clearAllFilters, FilterSection, hasCategoryFilters, renderCommonFilters
  ]);

  // Hide the filter sidebar if no URL parameters are present
  if (!hasUrlParams) {
    return null;
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block filter-sidebar sticky top-4">
        <FilterContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0  bg-opacity-50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </>
  );
};