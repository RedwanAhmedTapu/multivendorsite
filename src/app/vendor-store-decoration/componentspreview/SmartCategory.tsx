import React from 'react';
import { ComponentHandler } from "../ComponentHandler";

interface SmartCategoryProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const SmartCategory = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile'
}: SmartCategoryProps) => {
  const categories = [
    {
      name: "Electronics",
      bgColor: "bg-blue-100"
    },
    {
      name: "Fashion",
      bgColor: "bg-pink-100"
    },
    {
      name: "Beauty",
      bgColor: "bg-purple-100"
    },
    {
      name: "Men Style",
      bgColor: "bg-green-100"
    },
    {
      name: "Gadgets",
      bgColor: "bg-teal-100"
    },
    {
      name: "Cameras",
      bgColor: "bg-orange-100"
    },
    {
      name: "Lifestyle",
      bgColor: "bg-yellow-100"
    },
    {
      name: "Office",
      bgColor: "bg-indigo-100"
    }
  ];

  // Mobile View Design
  const renderMobileView = () => (
    <div className="w-full bg-white p-3">
    

      {/* Scrollable Container - Hidden Scrollbar */}
      <div 
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {categories.map((category, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
          >
            {/* Circular Image */}
            <div className={`w-20 h-20 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all border-4 border-gray-100 group-hover:border-blue-400 ${category.bgColor} flex items-center justify-center`}>
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Category Name */}
            <h4 className="mt-2 text-xs font-semibold text-gray-800 text-center group-hover:text-blue-500 transition-colors">
              {category.name}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );

  // Desktop View Design
  const renderDesktopView = () => (
    <div className="w-full bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-xl text-gray-800">Shop by Category</h3>
          <p className="text-sm text-gray-600">Browse our wide range of products</p>
        </div>
        <button className="text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors">
          View All →
        </button>
      </div>

      {/* Scrollable Container - Hidden Scrollbar */}
      <div 
        className="flex gap-8 overflow-x-auto pb-3 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {categories.map((category, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
          >
            {/* Circular Image */}
            <div className={`w-28 h-28 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all border-4 border-gray-100 group-hover:border-blue-400 ${category.bgColor} flex items-center justify-center`}>
              <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Category Name */}
            <h4 className="mt-3 text-sm font-semibold text-gray-800 text-center group-hover:text-blue-500 transition-colors">
              {category.name}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`relative ${
        isActive ? "ring-2 ring-blue-500 ring-offset-2" : ""
      } rounded-lg transition-all duration-200`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {viewMode === 'mobile' ? renderMobileView() : renderDesktopView()}

      {isActive && (
        <ComponentHandler
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

// Add this CSS to hide scrollbars
const styles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}