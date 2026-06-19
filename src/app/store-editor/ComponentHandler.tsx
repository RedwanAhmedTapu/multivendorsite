import { ArrowDown, ArrowUp, Trash2, Copy, Lock } from "lucide-react";

interface ComponentHandlerProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  /** When true the header is locked — all actions are hidden and a lock badge shown */
  isLocked?: boolean;
}

export const ComponentHandler = ({
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  isLocked = false,
}: ComponentHandlerProps) => {

  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  // ── Locked header — show only a static lock indicator ─────────────────────
  if (isLocked) {
    return (
      <div className="absolute -right-10 top-1/2 -translate-y-1/2 z-50">
        <div
          className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow flex items-center justify-center"
          title="Store Header is pinned and cannot be moved or deleted"
        >
          <Lock size={14} className="text-slate-400" />
        </div>
      </div>
    );
  }

  // ── Normal module actions ──────────────────────────────────────────────────
  return (
    <div className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col z-50">
      <div
        className={`p-2 cursor-pointer transition-colors first:rounded-t-lg ${
          onMoveUp ? "hover:bg-gray-50" : "opacity-30 cursor-not-allowed"
        }`}
        onClick={stop(onMoveUp)}
        title="Move Up"
      >
        <ArrowUp size={16} className="text-gray-600" />
      </div>

      <div className="border-t border-gray-100" />

      <div
        className={`p-2 cursor-pointer transition-colors ${
          onMoveDown ? "hover:bg-gray-50" : "opacity-30 cursor-not-allowed"
        }`}
        onClick={stop(onMoveDown)}
        title="Move Down"
      >
        <ArrowDown size={16} className="text-gray-600" />
      </div>

      <div className="border-t border-gray-100" />

      <div
        className={`p-2 cursor-pointer transition-colors ${
          onCopy ? "hover:bg-gray-50" : "opacity-30 cursor-not-allowed"
        }`}
        onClick={stop(onCopy)}
        title="Copy"
      >
        <Copy size={16} className="text-gray-600" />
      </div>

      <div className="border-t border-gray-100" />

      <div
        className={`p-2 cursor-pointer transition-colors last:rounded-b-lg ${
          onDelete ? "hover:bg-red-50" : "opacity-30 cursor-not-allowed"
        }`}
        onClick={stop(onDelete)}
        title="Delete"
      >
        <Trash2 size={16} className={onDelete ? "text-red-500" : "text-gray-400"} />
      </div>
    </div>
  );
};