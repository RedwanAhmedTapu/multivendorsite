"use client";
import React from "react";
import { ChevronLeft, Search, X } from "lucide-react";
import { ModuleItemCard } from "./ModuleItemCard";

export interface ModuleItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  disabled?: boolean;
  hot?: boolean;
}

export interface ModuleCategory {
  name: string;
  items: ModuleItem[];
}

interface StoreModulesSidebarProps {
  showStoreModules: boolean;
  setShowStoreModules: (show: boolean) => void;
  moduleCategories: ModuleCategory[];
  onModuleClick: (module: ModuleItem) => void;
  selectedModuleId: string | null;
}

export const StoreModulesSidebar = ({
  showStoreModules,
  setShowStoreModules,
  moduleCategories,
  onModuleClick,
  selectedModuleId
}: StoreModulesSidebarProps) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCategories = moduleCategories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto "
    style={{
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStoreModules(!showStoreModules)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Store Modules</h2>
          </div>
        </div>

       
      </div>

      {/* Modules List */}
      <div className="p-4">
        {filteredCategories.map((category) => (
          <div key={category.name} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {category.name}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {category.items.map((item) => (
                <ModuleItemCard
                  key={item.id}
                  item={item}
                  onClick={() => onModuleClick(item)}
                  isSelected={selectedModuleId === item.id}
                />
              ))}
            </div>
          </div>
        ))}
        
        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No modules found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};