"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronRight, Search, X, Sparkles } from "lucide-react";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import { Category } from "@/types/type";

interface Props {
  onSelect: (id: string, path: string, isLeaf: boolean, attributes: any[]) => void;
  productName?: string; // Add product name prop
  suggestedCategories?: Array<{ // Add suggested categories prop
    id: string;
    name: string;
    fullPath: string;
  }>;
  onSuggestionSelect?: (id: string, fullPath: string) => void; // Add suggestion handler
}

const CategoryTreeSelector: React.FC<Props> = ({ 
  onSelect, 
  productName = "", 
  suggestedCategories = [],
  onSuggestionSelect 
}) => {
  const { data: categories, isLoading } = useGetCategoriesQuery();
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [clickedRoot, setClickedRoot] = useState<Category | null>(null);
  const [clickedL2, setClickedL2] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [rootFilter, setRootFilter] = useState("");
  const [l2Filter, setL2Filter] = useState("");
  const [l3Filter, setL3Filter] = useState("");
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Show smart suggestions when product name has at least 10 characters
  useEffect(() => {
    if (productName.trim().length >= 10 && suggestedCategories.length > 0) {
      setShowSmartSuggestions(true);
    } else {
      setShowSmartSuggestions(false);
    }
  }, [productName, suggestedCategories]);

  // Build full path string
  const buildPathString = (path: string[]): string => {
    return path.join(" > ");
  };

  // Handle category selection (only leaf categories)
  const handleSelectCategory = (category: Category, parentPath: string[]) => {
    const hasChildren = category.children && category.children.length > 0;
    
    if (!hasChildren) {
      const fullPath = [...parentPath, category.name];
      setSelectedPath(fullPath);
      setSelectedId(category.id);
      setIsDropdownOpen(false);
      setSearchQuery(buildPathString(fullPath));
      
      onSelect(category.id, buildPathString(fullPath), true, category.attributes || []);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (categoryId: string, fullPath: string) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(categoryId, fullPath);
      setSelectedId(categoryId);
      setSearchQuery(fullPath);
      setIsDropdownOpen(false);
      setShowSmartSuggestions(false);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedPath([]);
    setSelectedId("");
    setSearchQuery("");
    setIsDropdownOpen(false);
    setClickedRoot(null);
    setClickedL2(null);
    setRootFilter("");
    setL2Filter("");
    setL3Filter("");
    setShowSmartSuggestions(false);
    onSelect("", "", false, []);
  };

  // Handle root category click
  const handleRootClick = (cat: Category) => {
    if (clickedRoot?.id === cat.id) {
      // If clicking the same root, close it
      setClickedRoot(null);
      setClickedL2(null);
      setL2Filter("");
      setL3Filter("");
    } else {
      // Open new root category
      setClickedRoot(cat);
      setClickedL2(null);
      setL2Filter("");
      setL3Filter("");
    }
  };

  // Handle level 2 category click
  const handleL2Click = (cat: Category) => {
    const hasChildren = cat.children && cat.children.length > 0;
    
    if (hasChildren) {
      if (clickedL2?.id === cat.id) {
        // If clicking the same L2, close it
        setClickedL2(null);
        setL3Filter("");
      } else {
        // Open new L2 category
        setClickedL2(cat);
        setL3Filter("");
      }
    } else {
      // It's a leaf, select it
      if (clickedRoot) {
        handleSelectCategory(cat, [clickedRoot.name]);
      }
    }
  };

  // Handle level 3 category click (always leaf)
  const handleL3Click = (cat: Category) => {
    if (clickedRoot && clickedL2) {
      handleSelectCategory(cat, [clickedRoot.name, clickedL2.name]);
    }
  };

  // Flatten all leaf categories for search
  const allLeafCategories = useMemo(() => {
    if (!categories) return [];
    
    const leaves: Array<{ category: Category; path: string[] }> = [];
    
    const traverse = (cats: Category[], path: string[] = []) => {
      cats.forEach(cat => {
        const currentPath = [...path, cat.name];
        
        if (!cat.children || cat.children.length === 0) {
          leaves.push({ category: cat, path: currentPath });
        } else if (cat.children) {
          traverse(cat.children, currentPath);
        }
      });
    };
    
    traverse(categories);
    return leaves;
  }, [categories]);

  // Filter categories based on search
  const filteredLeaves = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return allLeafCategories.filter(({ category, path }) => 
      category.name.toLowerCase().includes(query) || 
      buildPathString(path).toLowerCase().includes(query)
    );
  }, [searchQuery, allLeafCategories]);

  // Filter root categories
  const filteredRootCategories = useMemo(() => {
    if (!categories) return [];
    if (!rootFilter.trim()) return categories;
    
    const query = rootFilter.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(query)
    );
  }, [categories, rootFilter]);

  // Filter level 2 categories
  const filteredL2Categories = useMemo(() => {
    if (!clickedRoot?.children) return [];
    if (!l2Filter.trim()) return clickedRoot.children;
    
    const query = l2Filter.toLowerCase();
    return clickedRoot.children.filter(cat => 
      cat.name.toLowerCase().includes(query)
    );
  }, [clickedRoot, l2Filter]);

  // Filter level 3 categories
  const filteredL3Categories = useMemo(() => {
    if (!clickedL2?.children) return [];
    if (!l3Filter.trim()) return clickedL2.children;
    
    const query = l3Filter.toLowerCase();
    return clickedL2.children.filter(cat => 
      cat.name.toLowerCase().includes(query)
    );
  }, [clickedL2, l3Filter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setClickedRoot(null);
        setClickedL2(null);
        setShowSmartSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-600">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl" ref={dropdownRef}>
      {/* Search Input with Smart Suggestions */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={selectedId ? buildPathString(selectedPath) : "Search categories..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
              setShowSmartSuggestions(false);
            }}
            onFocus={() => {
              setIsDropdownOpen(true);
              if (productName.trim().length >= 10 && suggestedCategories.length > 0) {
                setShowSmartSuggestions(true);
              }
            }}
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {(searchQuery || selectedId) && (
            <button
              onClick={handleClearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Smart Suggestions Dropdown (Based on Product Name) */}
        {showSmartSuggestions && !searchQuery.trim() && suggestedCategories.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-teal-200 rounded-lg shadow-xl">
            <div className="p-3 bg-gradient-to-r from-teal-50 to-teal-100 border-b border-teal-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-medium text-teal-800">
                  Smart suggestions based on your product:
                </span>
                <span className="text-xs text-teal-600 ml-auto truncate max-w-[200px]">
                  "{productName.substring(0, 30)}..."
                </span>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {suggestedCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSuggestionSelect(category.id, category.fullPath)}
                  className="w-full px-4 py-3 text-left hover:bg-teal-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-teal-700">
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <span className="text-teal-600">→</span>
                        {category.fullPath}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-teal-600" />
                  </div>
                </button>
              ))}
            </div>
            <div className="p-2 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowSmartSuggestions(false);
                  setIsDropdownOpen(true);
                }}
                className="w-full text-center text-xs text-gray-500 hover:text-teal-600 py-1"
              >
                or browse all categories →
              </button>
            </div>
          </div>
        )}

        {/* Regular Dropdown Mega Menu */}
        {isDropdownOpen && !showSmartSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
            {/* Search Results */}
            {searchQuery.trim() && filteredLeaves.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="p-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-600">
                    Search Results ({filteredLeaves.length})
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredLeaves.map(({ category, path }) => (
                    <button
                      key={category.id}
                      onClick={() => handleSelectCategory(category, path.slice(0, -1))}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {buildPathString(path)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Search Results */}
            {searchQuery.trim() && filteredLeaves.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No categories found for "{searchQuery}"
              </div>
            )}

            {/* Category Mega Menu */}
            {!searchQuery.trim() && categories && categories.length > 0 && (
              <div className="flex" style={{ minHeight: "300px", maxHeight: "400px" }}>
                {/* Root Categories (Column 1) */}
                <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                  <div className="p-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={rootFilter}
                      onChange={(e) => setRootFilter(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    {filteredRootCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleRootClick(cat)}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                          clickedRoot?.id === cat.id ? "bg-teal-50 text-teal-600 font-medium" : "text-gray-700"
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {cat.children && cat.children.length > 0 && (
                          <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${
                            clickedRoot?.id === cat.id ? "rotate-90" : ""
                          }`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level 2 Categories (Column 2) */}
                {clickedRoot && clickedRoot.children && clickedRoot.children.length > 0 && (
                  <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                    <div className="p-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={l2Filter}
                        onChange={(e) => setL2Filter(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      {filteredL2Categories.map((cat) => {
                        const hasChildren = cat.children && cat.children.length > 0;
                        const isLeaf = !hasChildren;

                        return (
                          <button
                            key={cat.id}
                            onClick={() => handleL2Click(cat)}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                              clickedL2?.id === cat.id ? "bg-teal-50 text-teal-600 font-medium" : "text-gray-700"
                            } ${isLeaf ? "cursor-pointer" : ""}`}
                          >
                            <span className="truncate">{cat.name}</span>
                            {hasChildren && (
                              <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${
                                clickedL2?.id === cat.id ? "rotate-90" : ""
                              }`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Level 3 Categories (Column 3) */}
                {clickedL2 && clickedL2.children && clickedL2.children.length > 0 && (
                  <div className="w-1/3 overflow-y-auto">
                    <div className="p-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={l3Filter}
                        onChange={(e) => setL3Filter(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      {filteredL3Categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleL3Click(cat)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 text-gray-700 cursor-pointer transition-colors"
                        >
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Categories Available */}
            {!searchQuery.trim() && (!categories || categories.length === 0) && (
              <div className="p-4 text-center text-sm text-gray-500">
                No categories available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Selection Display */}
      {selectedId && (
        <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Current selection:</div>
          <div className="text-sm font-medium text-gray-900">
            {buildPathString(selectedPath) || searchQuery}
          </div>
          {showSmartSuggestions && (
            <div className="text-xs text-teal-600 mt-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Smart suggestion applied
            </div>
          )}
        </div>
      )}

      {/* Smart Suggestions Prompt */}
      {!selectedId && productName.trim().length >= 10 && suggestedCategories.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => {
              setIsDropdownOpen(true);
              setShowSmartSuggestions(true);
            }}
            className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            <span>Click here to see smart category suggestions based on your product name</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryTreeSelector;