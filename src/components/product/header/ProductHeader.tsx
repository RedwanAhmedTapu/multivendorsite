"use client";

import { useState } from "react";
import {
  ChevronDown,
  SlidersHorizontal,
  Grid2x2,
  List,
  Filter,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const ProductHeader: React.FC<{
  totalResults: number;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  onFilterClick: () => void;
  selectedCategory?: string;
  isLeafCategory?: boolean;
}> = ({ 
  totalResults, 
  viewMode, 
  setViewMode, 
  onFilterClick, 
  selectedCategory,
  isLeafCategory = true 
}) => {
  const [sortBy, setSortBy] = useState("Default");

  const sortOptions = [
    "Default",
    "Popularity",
    "Average rating",
    "Latest",
    "Price: low to high",
    "Price: high to low",
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 mb-6 border-b bg-white rounded-lg px-4 sm:px-6">
      {/* Top section for mobile */}
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              {totalResults} {totalResults === 1 ? 'product' : 'products'} found
            </span>
          </div>
          
          {/* Category Info */}
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">in</span>
              <div className="flex items-center gap-1">
                <Badge 
                  variant="secondary" 
                  className="text-xs font-medium px-2 py-1"
                >
                  {selectedCategory}
                </Badge>
                {!isLeafCategory && (
                  <Badge 
                    variant="outline" 
                    className="text-xs flex items-center gap-1 px-2 py-1"
                    title="Includes subcategories"
                  >
                    <FolderTree className="w-3 h-3" />
                    <span className="hidden xs:inline">Includes subcategories</span>
                    <span className="xs:hidden">Subcats</span>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Filter Button */}
        <Button 
          className="sm:hidden flex items-center gap-2"
          onClick={onFilterClick}
          variant="outline"
          size="sm"
        >
          <Filter size={16} />
          Filters
        </Button>
      </div>

      {/* Bottom section for controls */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4">
        {/* Sort By */}
        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <span className="text-gray-600 hidden xs:inline-block">Sort by:</span>
          <span className="text-gray-600 xs:hidden">Sort:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-1 h-8 px-2 text-xs min-w-[120px] justify-between"
              >
                <span className="truncate">{sortBy}</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[120px]"
            >
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setSortBy(option)}
                  className="text-xs"
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* View Options */}
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <Grid2x2 size={16} />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <List size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};