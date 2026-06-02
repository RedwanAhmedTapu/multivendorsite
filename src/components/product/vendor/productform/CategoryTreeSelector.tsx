"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronRight, Search, X, Sparkles, Check } from "lucide-react";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import { Category } from "@/types/type";

interface Props {
  onSelect: (id: string, path: string, isLeaf: boolean, attributes: any[]) => void;
  productName?: string;
  suggestedCategories?: Array<{
    id: string;
    name: string;
    fullPath: string;
  }>;
  onSuggestionSelect?: (id: string, fullPath: string) => void;
  initialCategoryId?: string | null;
}

const CategoryTreeSelector: React.FC<Props> = ({
  onSelect,
  productName = "",
  suggestedCategories = [],
  onSuggestionSelect,
  initialCategoryId = "",
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

  const buildPathString = (path: string[]): string => path.join(" > ");

  useEffect(() => {
    if (initialCategoryId && categories && !selectedId) {
      const findCategory = (
        cats: Category[],
        targetId: string
      ): { category: Category | null; path: string[] } => {
        for (const cat of cats) {
          if (cat.id === targetId) return { category: cat, path: [cat.name] };
          if (cat.children) {
            const found = findCategory(cat.children, targetId);
            if (found.category)
              return { category: found.category, path: [cat.name, ...found.path] };
          }
        }
        return { category: null, path: [] };
      };

      const { category, path } = findCategory(categories, initialCategoryId);
      if (category) {
        const hasChildren = category.children && category.children.length > 0;
        setSelectedId(category.id);
        setSelectedPath(path);
        setSearchQuery(buildPathString(path));
        if (!hasChildren)
          onSelect(category.id, buildPathString(path), true, category.attributes || []);
      }
    }
  }, [initialCategoryId, categories, selectedId, onSelect]);

  useEffect(() => {
    if (productName.trim().length >= 10 && suggestedCategories.length > 0) {
      setShowSmartSuggestions(true);
    } else {
      setShowSmartSuggestions(false);
    }
  }, [productName, suggestedCategories]);

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

  const handleSuggestionSelect = (categoryId: string, fullPath: string) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(categoryId, fullPath);
      setSelectedId(categoryId);
      setSearchQuery(fullPath);
      setIsDropdownOpen(false);
      setShowSmartSuggestions(false);
    }
  };

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

  const handleRootClick = (cat: Category) => {
    if (clickedRoot?.id === cat.id) {
      setClickedRoot(null);
      setClickedL2(null);
      setL2Filter("");
      setL3Filter("");
    } else {
      setClickedRoot(cat);
      setClickedL2(null);
      setL2Filter("");
      setL3Filter("");
    }
  };

  const handleL2Click = (cat: Category) => {
    const hasChildren = cat.children && cat.children.length > 0;
    if (hasChildren) {
      if (clickedL2?.id === cat.id) {
        setClickedL2(null);
        setL3Filter("");
      } else {
        setClickedL2(cat);
        setL3Filter("");
      }
    } else {
      if (clickedRoot) handleSelectCategory(cat, [clickedRoot.name]);
    }
  };

  const handleL3Click = (cat: Category) => {
    if (clickedRoot && clickedL2)
      handleSelectCategory(cat, [clickedRoot.name, clickedL2.name]);
  };

  const allLeafCategories = useMemo(() => {
    if (!categories) return [];
    const leaves: Array<{ category: Category; path: string[] }> = [];
    const traverse = (cats: Category[], path: string[] = []) => {
      cats.forEach((cat) => {
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

  const filteredLeaves = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allLeafCategories.filter(
      ({ category, path }) =>
        category.name.toLowerCase().includes(query) ||
        buildPathString(path).toLowerCase().includes(query)
    );
  }, [searchQuery, allLeafCategories]);

  const filteredRootCategories = useMemo(() => {
    if (!categories) return [];
    if (!rootFilter.trim()) return categories;
    const query = rootFilter.toLowerCase();
    return categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categories, rootFilter]);

  const filteredL2Categories = useMemo(() => {
    if (!clickedRoot?.children) return [];
    if (!l2Filter.trim()) return clickedRoot.children;
    const query = l2Filter.toLowerCase();
    return clickedRoot.children.filter((cat) =>
      cat.name.toLowerCase().includes(query)
    );
  }, [clickedRoot, l2Filter]);

  const filteredL3Categories = useMemo(() => {
    if (!clickedL2?.children) return [];
    if (!l3Filter.trim()) return clickedL2.children;
    const query = l3Filter.toLowerCase();
    return clickedL2.children.filter((cat) =>
      cat.name.toLowerCase().includes(query)
    );
  }, [clickedL2, l3Filter]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── shared mini-filter input ── */
  const FilterInput = ({
    value,
    onChange,
    placeholder = "Filter…",
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <div style={{ padding: "6px 8px", borderBottom: "0.5px solid #E2E8F0", background: "#F8FAFC", position: "sticky", top: 0, zIndex: 1 }}>
      <div style={{ position: "relative" }}>
        <Search size={11} color="#94A3B8" style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            paddingLeft: 24,
            paddingRight: 8,
            paddingTop: 4,
            paddingBottom: 4,
            fontSize: 11,
            color: "#0F172A",
            border: "0.5px solid #CBD5E1",
            borderRadius: 6,
            background: "#FFFFFF",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0" }}>
        <div
          style={{
            width: 16,
            height: 16,
            border: "2px solid #BFDBFE",
            borderTopColor: "#1D4ED8",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ fontSize: 13, color: "#64748B" }}>Loading categories…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", position: "relative" }} ref={dropdownRef}>

      {/* ── Search input ── */}
      <div style={{ position: "relative" }}>
        <Search
          size={14}
          color="#94A3B8"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={
            selectedId ? buildPathString(selectedPath) : "Search or browse categories…"
          }
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
            setShowSmartSuggestions(false);
          }}
          onFocus={() => {
            setIsDropdownOpen(true);
            if (productName.trim().length >= 10 && suggestedCategories.length > 0)
              setShowSmartSuggestions(true);
          }}
          style={{
            width: "100%",
            paddingLeft: 34,
            paddingRight: selectedId || searchQuery ? 34 : 12,
            paddingTop: 8,
            paddingBottom: 8,
            fontSize: 13,
            color: "#0F172A",
            border: `0.5px solid ${selectedId ? "#6EE7B7" : "#BFDBFE"}`,
            borderRadius: 8,
            background: "#FFFFFF",
            outline: "none",
            fontFamily: "inherit",
            boxShadow: isDropdownOpen ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        />
        {(searchQuery || selectedId) && (
          <button
            onClick={handleClearSelection}
            style={{
              position: "absolute",
              right: 9,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Smart suggestions dropdown ── */}
      {showSmartSuggestions && !searchQuery.trim() && suggestedCategories.length > 0 && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            background: "#FFFFFF",
            border: "0.5px solid #BFDBFE",
            borderRadius: 10,
            boxShadow: "0 8px 30px rgba(37,99,235,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            marginTop: 4,
            overflow: "hidden",
            width: (dropdownRef.current?.getBoundingClientRect().width ?? 400),
            top: (dropdownRef.current?.getBoundingClientRect().bottom ?? 0) + window.scrollY + 4,
            left: dropdownRef.current?.getBoundingClientRect().left ?? 0,
          }}
        >
          {/* Suggestion header */}
          <div
            style={{
              padding: "10px 14px",
              background: "#EFF6FF",
              borderBottom: "0.5px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <Sparkles size={13} color="#1D4ED8" />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#1D4ED8" }}>
              Smart suggestions based on your product
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10.5,
                color: "#64748B",
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              "{productName.substring(0, 28)}…"
            </span>
          </div>

          {/* Suggestion list */}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {suggestedCategories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => handleSuggestionSelect(cat.id, cat.fullPath)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  borderBottom: i < suggestedCategories.length - 1 ? "0.5px solid #F0F4FA" : "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "#DBEAFE",
                    border: "0.5px solid #93C5FD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={12} color="#1D4ED8" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>
                    {cat.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "#64748B",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.fullPath}
                  </div>
                </div>
                <ChevronRight size={13} color="#93C5FD" />
              </button>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: "8px 14px", background: "#F8FAFC", borderTop: "0.5px solid #E2E8F0" }}>
            <button
              onClick={() => { setShowSmartSuggestions(false); setIsDropdownOpen(true); }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                color: "#64748B",
                fontFamily: "inherit",
                padding: "2px 0",
                textAlign: "center",
              }}
            >
              Browse all categories →
            </button>
          </div>
        </div>
      )}

      {/* ── Main dropdown mega-menu ── */}
      {isDropdownOpen && !showSmartSuggestions && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            background: "#FFFFFF",
            border: "0.5px solid #BFDBFE",
            borderRadius: 10,
            boxShadow: "0 8px 30px rgba(37,99,235,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
            width: Math.min((dropdownRef.current?.getBoundingClientRect().width ?? 400), 700),
            top: (dropdownRef.current?.getBoundingClientRect().bottom ?? 0) + window.scrollY + 4,
            left: dropdownRef.current?.getBoundingClientRect().left ?? 0,
          }}
        >
          {/* ── Search results ── */}
          {searchQuery.trim() && filteredLeaves.length > 0 && (
            <>
              <div
                style={{
                  padding: "7px 12px",
                  background: "#F8FAFC",
                  borderBottom: "0.5px solid #E2E8F0",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#64748B",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {filteredLeaves.length} result{filteredLeaves.length !== 1 ? "s" : ""}
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto" }}>
                {filteredLeaves.map(({ category, path }, i) => (
                  <button
                    key={category.id}
                    onClick={() => handleSelectCategory(category, path.slice(0, -1))}
                    style={{
                      width: "100%",
                      padding: "9px 14px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      borderBottom: i < filteredLeaves.length - 1 ? "0.5px solid #F0F4FA" : "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>
                      {category.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>
                      {buildPathString(path)}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* No results */}
          {searchQuery.trim() && filteredLeaves.length === 0 && (
            <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "#64748B" }}>
              No categories found for "{searchQuery}"
            </div>
          )}

          {/* ── 3-column mega browse ── */}
          {!searchQuery.trim() && categories && categories.length > 0 && (
            <div style={{ display: "flex", minHeight: 300, maxHeight: 380 }}>

              {/* Column 1 — Root */}
              <div
                style={{
                  width: "34%",
                  borderRight: "0.5px solid #E2E8F0",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <FilterInput value={rootFilter} onChange={setRootFilter} placeholder="Search root…" />
                {filteredRootCategories.map((cat) => {
                  const active = clickedRoot?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleRootClick(cat)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        textAlign: "left",
                        background: active ? "#EFF6FF" : "none",
                        border: "none",
                        borderBottom: "0.5px solid #F0F4FA",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F8FAFC"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "none"; }}
                    >
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: active ? 600 : 400,
                          color: active ? "#1D4ED8" : "#0F172A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {cat.name}
                      </span>
                      {cat.children && cat.children.length > 0 && (
                        <ChevronRight
                          size={13}
                          color={active ? "#1D4ED8" : "#94A3B8"}
                          style={{ flexShrink: 0, transform: active ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Column 2 — L2 */}
              {clickedRoot && clickedRoot.children && clickedRoot.children.length > 0 && (
                <div
                  style={{
                    width: "33%",
                    borderRight: "0.5px solid #E2E8F0",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <FilterInput value={l2Filter} onChange={setL2Filter} placeholder="Search…" />
                  {filteredL2Categories.map((cat) => {
                    const hasChildren = !!(cat.children && cat.children.length > 0);
                    const active = clickedL2?.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleL2Click(cat)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          textAlign: "left",
                          background: active ? "#EFF6FF" : "none",
                          border: "none",
                          borderBottom: "0.5px solid #F0F4FA",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F8FAFC"; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "none"; }}
                      >
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: active ? 600 : 400,
                            color: active ? "#1D4ED8" : "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {cat.name}
                        </span>
                        {hasChildren && (
                          <ChevronRight
                            size={13}
                            color={active ? "#1D4ED8" : "#94A3B8"}
                            style={{ flexShrink: 0, transform: active ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Column 3 — L3 leaf */}
              {clickedL2 && clickedL2.children && clickedL2.children.length > 0 && (
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <FilterInput value={l3Filter} onChange={setL3Filter} placeholder="Search…" />
                  {filteredL3Categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleL3Click(cat)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        borderBottom: "0.5px solid #F0F4FA",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 12.5,
                        color: "#0F172A",
                        transition: "background 0.12s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {cat.name}
                      </span>
                      <Check size={11} color="#93C5FD" style={{ flexShrink: 0, opacity: 0.6 }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Placeholder when nothing is selected yet */}
              {!clickedRoot && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 8,
                    color: "#94A3B8",
                    fontSize: 12,
                  }}
                >
                  <ChevronRight size={20} color="#BFDBFE" />
                  Select a root category
                </div>
              )}
            </div>
          )}

          {!searchQuery.trim() && (!categories || categories.length === 0) && (
            <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "#64748B" }}>
              No categories available
            </div>
          )}
        </div>
      )}

      {/* ── Selected display ── */}
      {selectedId && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "#F0FDF4",
            border: "0.5px solid #86EFAC",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Check size={13} color="#15803D" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 1 }}>
              Current selection
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#15803D",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {buildPathString(selectedPath) || searchQuery}
            </div>
          </div>
        </div>
      )}

      {/* ── Smart suggestion prompt (pre-selection) ── */}
      {!selectedId && productName.trim().length >= 10 && suggestedCategories.length > 0 && (
        <button
          onClick={() => { setIsDropdownOpen(true); setShowSmartSuggestions(true); }}
          style={{
            marginTop: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 11.5,
            color: "#1D4ED8",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: 0,
          }}
        >
          <Sparkles size={12} color="#1D4ED8" />
          See smart category suggestions for your product
          <ChevronRight size={12} />
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CategoryTreeSelector;