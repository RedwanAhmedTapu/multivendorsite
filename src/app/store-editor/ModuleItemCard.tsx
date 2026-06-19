import React from 'react';

interface ModuleItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  disabled?: boolean;
}

export const ModuleItemCard = ({ 
  item, 
  onClick,
  isSelected = false
}: {
  item: ModuleItem;
  onClick: () => void;
  isSelected?: boolean;
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (!item.disabled) {
      e.dataTransfer.setData('moduleId', item.id);
    }
  };

  return (
    <div
      draggable={!item.disabled}
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`relative border rounded-md p-2 text-center cursor-pointer transition-all ${
        item.disabled 
          ? 'bg-gray-50 opacity-60 cursor-not-allowed' 
          : isSelected 
            ? 'bg-teal-50 border-teal-300 shadow-sm'
            : 'bg-white hover:shadow-sm hover:border-teal-200 cursor-move'
      }`}
    >
      
      <img src={item.icon} alt={item.name} className="w-5 h-5 mx-auto mb-1" />
      <div className="text-[10px] font-medium text-teal-800 font-bold leading-tight mb-0.5 line-clamp-2">
        {item.name}
      </div>
      <div className="text-[8px] text-teal-600">
        {item.count}
      </div>
    </div>
  );
};