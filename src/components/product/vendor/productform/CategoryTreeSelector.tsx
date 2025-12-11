"use client";
import React, { useState, useEffect, useMemo, useRef, JSX } from "react";
import { ChevronDown, ChevronRight, Folder, Search, X, Check, Eye, EyeOff } from "lucide-react";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import { Category } from "@/types/type";

interface Props {
  onSelect: (id: string, path: string, isLeaf: boolean, attributes: any[]) => void;
}

interface CategoryWithPath extends Category {
  fullPath: string;
  depth: number;
}

const CategoryTreeSelector: React.FC<Props> = ({ onSelect }) => {
  const { data: categories, isLoading } = useGetCategoriesQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [isLeafCategory, setIsLeafCategory] = useState<boolean>(false);
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSelector, setShowSelector] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten only leaf categories with full paths for searching
  const leafCategories = useMemo(() => {
    if (!categories) return [];

    const findLeafCategories = (
      catList: Category[],
      parentPath: string = "",
      depth: number = 0
    ): CategoryWithPath[] => {
      let result: CategoryWithPath[] = [];
      
      catList.forEach((cat) => {
        const currentPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
        
        if (!cat.children || cat.children.length === 0) {
          // This is a leaf category
          result.push({
            ...cat,
            fullPath: currentPath,
            depth,
          });
        } else {
          // Not a leaf, search in children
          result = result.concat(findLeafCategories(cat.children, currentPath, depth + 1));
        }
      });
      
      return result;
    };

    return findLeafCategories(categories);
  }, [categories]);

  // Filter leaf categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return leafCategories.filter(cat => 
      cat.name.toLowerCase().includes(query) || 
      cat.fullPath.toLowerCase().includes(query)
    );
  }, [searchQuery, leafCategories]);

  // Handle category selection
  const handleSelectCategory = (category: CategoryWithPath) => {
    if (!categories) return;

    const isLeaf = true; // Always leaf since we only show leaf categories
    const attributes = category.attributes || [];
    
    setSelectedId(category.id);
    setSelectedPath(category.fullPath);
    setIsLeafCategory(isLeaf);
    setCategoryAttributes(attributes);
    setShowSuggestions(false);
    setSearchQuery(category.fullPath);
    setShowSelector(false); // Hide selector after selection
    
    onSelect(category.id, category.fullPath, isLeaf, attributes);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
    
    // If input is cleared, clear selection
    if (!value.trim()) {
      handleClearSelection();
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedId(null);
    setSelectedPath("");
    setIsLeafCategory(false);
    setCategoryAttributes([]);
    setSearchQuery("");
    setShowSuggestions(false);
    setShowSelector(true); // Show selector when clearing
    onSelect("", "", false, []);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    if (selectedId) {
      // Keep showing selected path
      const selected = leafCategories.find(cat => cat.id === selectedId);
      if (selected) {
        setSearchQuery(selected.fullPath);
      }
    }
  };

  // Toggle expansion on click
  const handleToggleExpand = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Handle hover to expand (with delay)
  const handleMouseEnter = (categoryId: string) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const timeout = setTimeout(() => {
      setExpandedIds(prev => new Set(prev).add(categoryId));
    }, 300); // 300ms delay before expanding
    
    setHoverTimeout(timeout);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
  };

  // Toggle selector visibility
  const toggleSelectorVisibility = () => {
    setShowSelector(!showSelector);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSuggestions && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [showSuggestions, hoverTimeout]);

  // Render category tree with hover-based expansion
  const renderCategoryTree = (catList: Category[], depth: number = 0, parentId: string = ''): JSX.Element[] => {
    return catList.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isLeaf = !hasChildren;
      const isExpanded = expandedIds.has(cat.id);
      const isSelected = selectedId === cat.id;
      const uniqueKey = `${parentId}-${cat.id}-${depth}`;

      return (
        <div key={uniqueKey} className="relative">
          {/* Category Item */}
          <div
            className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded text-xs transition-colors ${
              isSelected
                ? "bg-teal-50 border-l-2 border-teal-500 text-teal-800 font-medium"
                : "hover:bg-gray-100"
            }`}
            style={{ marginLeft: `${depth * 1}rem` }}
            onClick={() => {
              if (isLeaf) {
                // Build full path for this leaf category
                const buildPath = (category: Category, path: string[] = []): string => {
                  const newPath = [category.name, ...path];
                  // Find parent in categories (simplified - in real app you'd need parent tracking)
                  return newPath.reverse().join(' > ');
                };
                const path = buildPath(cat);
                handleSelectCategory({
                  ...cat,
                  fullPath: path,
                  depth
                });
              }
            }}
            onMouseEnter={() => handleMouseEnter(cat.id)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Expand/Collapse Button */}
            {hasChildren ? (
              <button
                className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
                onClick={(e) => handleToggleExpand(cat.id, e)}
                onMouseEnter={(e) => e.stopPropagation()}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-gray-600" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4 flex-shrink-0" />
            )}

            {/* Category Icon */}
            <Folder className="h-3 w-3 text-gray-500 flex-shrink-0" />

            {/* Category Name */}
            <span className="flex-1 truncate">{cat.name}</span>

            {/* Indicators */}
            {isLeaf && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded flex-shrink-0">
                Leaf
              </span>
            )}
            {isSelected && isLeaf && (
              <Check className="h-3 w-3 text-teal-600 flex-shrink-0" />
            )}
          </div>

          {/* Children (only if expanded) */}
          {hasChildren && isExpanded && cat.children && (
            <div className="relative">
              {/* Vertical line connecting parent to children */}
              {depth > 0 && (
                <div 
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"
                  style={{ 
                    left: `${(depth * 1) + 0.5}rem`,
                    height: '100%'
                  }}
                />
              )}
              <div className="ml-4">
                {renderCategoryTree(cat.children, depth + 1, cat.id)}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Header with Toggle Button */}
      <div className="flex items-center justify-between">
       
        <div className="flex items-center gap-2">
          {selectedId && (
            <>
              <button
                onClick={toggleSelectorVisibility}
                className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 p-1 hover:bg-gray-100 rounded"
                title={showSelector ? "Hide selector" : "Show selector"}
              >
                {showSelector ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
                <span>{showSelector ? "Hide" : "Show"}</span>
              </button>
              <button
                onClick={handleClearSelection}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Input (Always Visible) */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={selectedId ? selectedPath : "Search leaf categories..."}
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchQuery.trim() && !selectedId) {
              setShowSuggestions(true);
            }
          }}
          onClick={() => {
            // When clicking the input with a selection, show selector
            if (selectedId && !showSelector) {
              setShowSelector(true);
            }
          }}
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
          readOnly={!!selectedId && !showSelector}
        />
        {searchQuery && !selectedId && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {selectedId && (
          <button
            onClick={handleClearSelection}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Search Suggestions Dropdown - Only Leaf Categories */}
        {showSuggestions && filteredCategories.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-medium text-gray-600">
                Found {filteredCategories.length} leaf categories
              </span>
              <span className="text-xs text-gray-500 ml-2">
                (Only leaf categories can be selected)
              </span>
            </div>
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedId === cat.id ? "bg-teal-50" : ""
                }`}
                onClick={() => handleSelectCategory(cat)}
              >
                <div className="flex items-start gap-2">
                  <Folder className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {cat.name}
                      </span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        Leaf
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 truncate">
                        {cat.fullPath}
                      </span>
                    </div>
                  </div>
                  {selectedId === cat.id && (
                    <Check className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {showSuggestions && searchQuery.trim() && filteredCategories.length === 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600 text-center">
              No leaf categories found for "{searchQuery}"
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              Try browsing the category tree below
            </p>
          </div>
        )}
      </div>

      {/* Selected Category Summary (Always visible when selected) */}
      {selectedId && (
        <div className="p-3 border border-teal-200 rounded-lg bg-teal-50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Folder className="h-4 w-4 text-teal-600" />
                <h4 className="text-sm font-medium text-teal-900 truncate">
                  Selected Category
                </h4>
              </div>
              <p className="text-xs text-teal-700 truncate">{selectedPath}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                  ✓ Leaf Category
                </span>
                {categoryAttributes.length > 0 && (
                  <span className="text-xs text-gray-600">
                    {categoryAttributes.length} attributes available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tree Browser (Conditionally Visible) */}
      {showSelector && (
        <>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  Browse Categories (Hover to expand)
                </span>
                {leafCategories.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {leafCategories.length} leaf categories available
                  </span>
                )}
              </div>
            </div>
            
            <div className="max-h-72 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-sm text-gray-600">
                    Loading categories...
                  </span>
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="space-y-0.5">
                  {renderCategoryTree(categories)}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-gray-500">
                  No categories available
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p className="flex items-center gap-1">
              <span className="font-medium">Instructions:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Type to search for leaf categories only</li>
              <li>Hover over categories to expand them</li>
              <li>Click on leaf categories (marked with "Leaf") to select</li>
              <li>Only leaf categories can be selected for products</li>
              <li>Selector will hide after selection (click input to show again)</li>
            </ul>
          </div>
        </>
      )}

      {/* Show/Hide Toggle Button at Bottom */}
      {selectedId && (
        <div className="flex justify-center pt-2 border-t">
          <button
            onClick={toggleSelectorVisibility}
            className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 p-2 hover:bg-teal-50 rounded-lg transition-colors"
          >
            {showSelector ? (
              <>
                <EyeOff className="h-3 w-3" />
                Hide category selector
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                Show category selector
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryTreeSelector;