import { Grid, MessageSquare, Star, Users } from "lucide-react";
import { ComponentHandler } from "../ComponentHandler";

interface StoreHeaderProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
}

export const StoreHeader = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete
}: StoreHeaderProps) => {
  return (
    <div
      className={`relative ${
        isActive ? "border-2 border-teal-500" : "border-2 border-transparent"
      } rounded-lg`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="store-header">
        <div className="header-background bg-gradient-to-br from-gray-900 to-black text-white pt-7 px-2">
          <div className="store-info flex items-center mb-4">
            <img 
              className="store-avatar w-14 h-14 rounded-lg mr-2" 
              src="https://img.lazcdn.com/live/id/ot/bd1be8d500c8d7fcebe9eb46d1410641.jpg_110x110q75.jpg_.webp" 
              alt="Store" 
            />
            <div className="store-details flex-1">
              <span className="store-name text-base font-semibold mr-2">Ecom</span>
              <div className="store-stats flex gap-2 mt-1">
                <div className="stat-item flex items-center gap-1 text-xs">
                  <Star size={12} fill="currentColor" />
                  <span>4.8</span>
                </div>
                <div className="stat-item flex items-center gap-1 text-xs">
                  <Users size={12} />
                  <span>12.5k</span>
                </div>
              </div>
            </div>
            <button className="follow-btn bg-gradient-to-r from-orange-400 to-pink-500 text-white border-none rounded px-3 py-2 text-xs font-medium">
              FOLLOW
            </button>
          </div>
          
          <div className="store-tabs flex justify-around px-4">
            <div className="tab py-2 px-3 text-sm font-semibold relative cursor-pointer">
              Store
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded"></div>
            </div>
            <div className="tab py-2 px-3 text-sm cursor-pointer">Products</div>
          </div>
        </div>
        
       
      </div>

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