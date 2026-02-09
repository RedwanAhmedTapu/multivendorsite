import React, { useState, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface FilterProps {
  filters: {
    search: string;
    category: string;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  onFilterChange: (filters: Partial<FilterProps["filters"]>) => void;
}

const ProductFilters: React.FC<FilterProps> = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, search: value }));
  };

  const handleSearchSubmit = () => {
    onFilterChange({ search: localFilters.search });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setMobileFiltersOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: "",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: "createdAt",
      sortOrder: "desc" as "asc" | "desc",
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setMobileFiltersOpen(false);
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.sortBy !== "createdAt" ||
    filters.sortOrder !== "desc";

  const activeFilterCount = [
    filters.search,
    filters.category,
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.sortBy !== "createdAt",
  ].filter(Boolean).length;

  const sortOptions = [
    { value: "createdAt-desc", label: "Newest First" },
    { value: "createdAt-asc", label: "Oldest First" },
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "stock-asc", label: "Stock: Low to High" },
    { value: "stock-desc", label: "Stock: High to Low" },
  ];

  const renderAdvancedFilters = () => (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              type="text"
              placeholder="Enter category name"
              value={localFilters.category}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
            />
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <Label>Price Range (৳)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Minimum"
                  value={localFilters.minPrice || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      minPrice: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Maximum"
                  value={localFilters.maxPrice || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      maxPrice: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label htmlFor="sort">Sort By</Label>
            <Select
              value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split("-");
                setLocalFilters((prev) => ({
                  ...prev,
                  sortBy,
                  sortOrder: sortOrder as "asc" | "desc",
                }));
              }}
            >
              <SelectTrigger 
                id="sort" 
                className="border-teal-200 focus:ring-teal-500 focus:border-teal-500"
              >
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
            >
              Clear All Filters
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 p-4">
      {/* Desktop Layout - Always show filters inline */}
      <div className="hidden md:block">
        <div className="space-y-6">
          {/* Top Row: Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                <Input
                  type="text"
                  placeholder="Search by product name, SKU, category..."
                  value={localFilters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 pr-10 py-2 h-11 border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                />
                {localFilters.search && (
                  <button
                    onClick={() => {
                      setLocalFilters((prev) => ({ ...prev, search: "" }));
                      onFilterChange({ search: "" });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 hover:text-teal-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <Button
              onClick={handleSearchSubmit}
              className="bg-teal-600 hover:bg-teal-700 px-6 whitespace-nowrap"
            >
              Search
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="border-teal-200 text-teal-700 hover:bg-teal-50 whitespace-nowrap"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Bottom Row: Advanced Filters inline */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="desktop-category" className="text-sm font-medium text-teal-700">
                Category
              </Label>
              <div className="relative">
                <Input
                  id="desktop-category"
                  type="text"
                  placeholder="Category"
                  value={localFilters.category}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                />
                {localFilters.category && (
                  <button
                    onClick={() => {
                      setLocalFilters((prev) => ({ ...prev, category: "" }));
                      onFilterChange({ category: "" });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 hover:text-teal-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Min Price */}
            <div className="space-y-2">
              <Label htmlFor="desktop-min-price" className="text-sm font-medium text-teal-700">
                Min Price (৳)
              </Label>
              <div className="relative">
                <Input
                  id="desktop-min-price"
                  type="number"
                  placeholder="Minimum"
                  value={localFilters.minPrice || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      minPrice: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                />
                {localFilters.minPrice !== undefined && (
                  <button
                    onClick={() => {
                      setLocalFilters((prev) => ({ ...prev, minPrice: undefined }));
                      onFilterChange({ minPrice: undefined });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 hover:text-teal-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Max Price */}
            <div className="space-y-2">
              <Label htmlFor="desktop-max-price" className="text-sm font-medium text-teal-700">
                Max Price (৳)
              </Label>
              <div className="relative">
                <Input
                  id="desktop-max-price"
                  type="number"
                  placeholder="Maximum"
                  value={localFilters.maxPrice || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      maxPrice: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  className="border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                />
                {localFilters.maxPrice !== undefined && (
                  <button
                    onClick={() => {
                      setLocalFilters((prev) => ({ ...prev, maxPrice: undefined }));
                      onFilterChange({ maxPrice: undefined });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 hover:text-teal-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="desktop-sort" className="text-sm font-medium text-teal-700">
                Sort By
              </Label>
              <Select
                value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split("-");
                  const newFilters = {
                    sortBy,
                    sortOrder: sortOrder as "asc" | "desc",
                  };
                  setLocalFilters((prev) => ({ ...prev, ...newFilters }));
                  onFilterChange(newFilters);
                }}
              >
                <SelectTrigger 
                  id="desktop-sort" 
                  className="border-teal-200 focus:ring-teal-500 focus:border-teal-500"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Badges (Desktop) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
              <span className="text-sm font-medium text-teal-700">Active Filters:</span>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge 
                    variant="outline" 
                    className="bg-white text-teal-700 border-teal-200"
                  >
                    Search: {filters.search}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ ...prev, search: "" }));
                        onFilterChange({ search: "" });
                      }}
                      className="ml-1 hover:text-teal-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.category && (
                  <Badge 
                    variant="outline" 
                    className="bg-white text-teal-700 border-teal-200"
                  >
                    Category: {filters.category}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ ...prev, category: "" }));
                        onFilterChange({ category: "" });
                      }}
                      className="ml-1 hover:text-teal-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.minPrice !== undefined && (
                  <Badge 
                    variant="outline" 
                    className="bg-white text-teal-700 border-teal-200"
                  >
                    Min: ৳{filters.minPrice}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ ...prev, minPrice: undefined }));
                        onFilterChange({ minPrice: undefined });
                      }}
                      className="ml-1 hover:text-teal-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.maxPrice !== undefined && (
                  <Badge 
                    variant="outline" 
                    className="bg-white text-teal-700 border-teal-200"
                  >
                    Max: ৳{filters.maxPrice}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ ...prev, maxPrice: undefined }));
                        onFilterChange({ maxPrice: undefined });
                      }}
                      className="ml-1 hover:text-teal-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.sortBy !== "createdAt" && (
                  <Badge 
                    variant="outline" 
                    className="bg-white text-teal-700 border-teal-200"
                  >
                    Sort: {sortOptions.find(o => o.value === `${filters.sortBy}-${filters.sortOrder}`)?.label}
                    <button
                      onClick={() => {
                        setLocalFilters((prev) => ({ 
                          ...prev, 
                          sortBy: "createdAt",
                          sortOrder: "desc"
                        }));
                        onFilterChange({ 
                          sortBy: "createdAt",
                          sortOrder: "desc"
                        });
                      }}
                      className="ml-1 hover:text-teal-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Search Bar Row */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
            <Input
              type="text"
              placeholder="Search products..."
              value={localFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-9 pr-9 py-2 h-10 text-sm border-teal-200 focus:border-teal-500 focus:ring-teal-500"
            />
            {localFilters.search && (
              <button
                onClick={() => {
                  setLocalFilters((prev) => ({ ...prev, search: "" }));
                  onFilterChange({ search: "" });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 hover:text-teal-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Mobile Filters Sheet */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-teal-200 text-teal-700 hover:bg-teal-50 relative"
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <Badge 
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-teal-500"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                  {hasActiveFilters && (
                    <Badge 
                      variant="secondary" 
                      className="bg-teal-100 text-teal-800"
                    >
                      {activeFilterCount} active
                    </Badge>
                  )}
                </SheetTitle>
              </SheetHeader>
              
              <div className="py-6">
                {renderAdvancedFilters()}
              </div>
            </SheetContent>
          </Sheet>

          <Button
            onClick={handleSearchSubmit}
            className="bg-teal-600 hover:bg-teal-700 px-4"
            size="sm"
          >
            Search
          </Button>
        </div>

        {/* Active Filters Display (Mobile) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-teal-50 rounded-lg border border-teal-100">
            <span className="text-xs font-medium text-teal-700">Active:</span>
            {filters.search && (
              <Badge 
                variant="outline" 
                className="bg-white text-teal-700 border-teal-200 text-xs"
              >
                Search: {filters.search.length > 10 ? filters.search.substring(0, 10) + "..." : filters.search}
                <button
                  onClick={() => {
                    setLocalFilters((prev) => ({ ...prev, search: "" }));
                    onFilterChange({ search: "" });
                  }}
                  className="ml-1 hover:text-teal-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.category && (
              <Badge 
                variant="outline" 
                className="bg-white text-teal-700 border-teal-200 text-xs"
              >
                Category: {filters.category}
                <button
                  onClick={() => {
                    setLocalFilters((prev) => ({ ...prev, category: "" }));
                    onFilterChange({ category: "" });
                  }}
                  className="ml-1 hover:text-teal-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.minPrice !== undefined && (
              <Badge 
                variant="outline" 
                className="bg-white text-teal-700 border-teal-200 text-xs"
              >
                Min: ৳{filters.minPrice}
                <button
                  onClick={() => {
                    setLocalFilters((prev) => ({ ...prev, minPrice: undefined }));
                    onFilterChange({ minPrice: undefined });
                  }}
                  className="ml-1 hover:text-teal-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.maxPrice !== undefined && (
              <Badge 
                variant="outline" 
                className="bg-white text-teal-700 border-teal-200 text-xs"
              >
                Max: ৳{filters.maxPrice}
                <button
                  onClick={() => {
                    setLocalFilters((prev) => ({ ...prev, maxPrice: undefined }));
                    onFilterChange({ maxPrice: undefined });
                  }}
                  className="ml-1 hover:text-teal-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;