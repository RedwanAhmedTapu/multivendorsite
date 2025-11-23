import { ChevronRight } from "lucide-react";
import { ModuleCategory, ModuleItem } from "./page";
import { useState } from "react";
import { ModuleItemCard } from "./ModuleItemCard";

export const ModuleCategorySection = ({ 
  category, 
  onModuleClick 
}: {
  category: ModuleCategory;
  onModuleClick: (module: ModuleItem) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b pb-2">
      <div 
        className="cursor-pointer font-medium py-2 flex items-center justify-between hover:bg-gray-50 px-2 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{category.name}</span>
        <ChevronRight 
          size={16} 
          className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`} 
        />
      </div>
      {isOpen && (
        <div className="grid grid-cols-2 gap-2 mt-2 px-2">
          {category.items.map((item) => (
            <ModuleItemCard 
              key={item.id} 
              item={{ ...item, count: typeof item.count === "string" ? Number(item.count) : item.count }} 
              onClick={() => onModuleClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};