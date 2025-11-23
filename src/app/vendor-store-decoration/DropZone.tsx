import React from "react";

export const DropZone = ({
  onDrop,
  onDragOver,
  onDragLeave,
  isVisible,
}: {
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  isVisible: boolean;
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Check if we're actually leaving the drop zone, not just moving to child elements
    const relatedTarget = e.relatedTarget as Node;
    const currentTarget = e.currentTarget as Node;
    
    if (!currentTarget.contains(relatedTarget)) {
      onDragLeave();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e);
  };

  return (
    <div
      className={` h-32 border-2 border-dashed rounded-lg transition-all duration-200 ${
        isVisible
          ? "border-sky-400 bg-sky-100 opacity-100 scale-105"
          : "border-transparent bg-transparent opacity-0"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-center h-full text-sky-500 text-xs font-medium">
        {isVisible && "Drop here to add module"}
      </div>
    </div>
  );
};