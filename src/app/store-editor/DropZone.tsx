import React from "react";

export const DropZone = ({
  onDrop,
  onDragOver,
  onDragLeave,
  isVisible,
  position,
}: {
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  isVisible: boolean;
  /**
   * The slot index this drop zone represents.
   * position === 0 means "before the header" — never rendered.
   */
  position: number;
}) => {
  // Slot 0 is before the locked header — never allow drops there
  if (position === 0) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as Node;
    const currentTarget = e.currentTarget as Node;
    if (!currentTarget.contains(relatedTarget)) onDragLeave();
  };

  return (
    <div
      className={`h-32 border-2 border-dashed rounded-lg transition-all duration-200 ${
        isVisible
          ? "border-sky-400 bg-sky-100 opacity-100 scale-105"
          : "border-transparent bg-transparent opacity-0"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(e); }}
    >
      <div className="flex items-center justify-center h-full text-sky-500 text-xs font-medium">
        {isVisible && "Drop here to add module"}
      </div>
    </div>
  );
};