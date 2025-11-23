import { ArrowDown, ArrowUp, Trash2, Copy } from "lucide-react";

interface ComponentHandlerProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
}

export const ComponentHandler = ({ 
  onMoveUp, 
  onMoveDown, 
  onCopy, 
  onDelete 
}: ComponentHandlerProps) => {
  
  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoveUp) onMoveUp();
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoveDown) onMoveDown();
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) onCopy();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col z-50">
      {/* Move Up */}
      <div 
        className={`p-2 cursor-pointer transition-colors first:rounded-t-lg ${
          onMoveUp ? 'hover:bg-gray-50' : 'opacity-30 cursor-not-allowed'
        }`}
        onClick={handleMoveUp}
        title="Move Up"
      >
        <ArrowUp size={16} className="text-gray-600" />
      </div>
      
      <div className="border-t border-gray-100"></div>
      
      {/* Move Down */}
      <div 
        className={`p-2 cursor-pointer transition-colors ${
          onMoveDown ? 'hover:bg-gray-50' : 'opacity-30 cursor-not-allowed'
        }`}
        onClick={handleMoveDown}
        title="Move Down"
      >
        <ArrowDown size={16} className="text-gray-600" />
      </div>
      
      <div className="border-t border-gray-100"></div>
      
      {/* Copy Button */}
      <div 
        className={`p-2 cursor-pointer transition-colors ${
          onCopy ? 'hover:bg-gray-50' : 'opacity-30 cursor-not-allowed'
        }`}
        onClick={handleCopy}
        title="Copy"
      >
        <Copy size={16} className="text-gray-600" />
      </div>
      
      <div className="border-t border-gray-100"></div>
      
      {/* Delete Button */}
      <div 
        className={`p-2 cursor-pointer transition-colors last:rounded-b-lg ${
          onDelete ? 'hover:bg-red-50' : 'opacity-30 cursor-not-allowed'
        }`}
        onClick={handleDelete}
        title="Delete"
      >
        <Trash2 size={16} className={onDelete ? "text-red-500" : "text-gray-400"} />
      </div>
    </div>
  );
};