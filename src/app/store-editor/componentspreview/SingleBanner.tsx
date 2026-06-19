import { ComponentHandler } from "../ComponentHandler";

interface SingleBannerProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const SingleBanner = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile'
}: SingleBannerProps) => {
  // Mobile View Design - Full image placeholder
  const renderMobileView = () => (
    <div className="w-full bg-white p-3">
      <div className="w-full h-64 relative overflow-hidden rounded-lg cursor-pointer group">
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );

  // Desktop View Design - Full image placeholder
  const renderDesktopView = () => (
    <div className="w-full bg-white p-6">
      <div className="w-full h-80 relative overflow-hidden rounded-xl cursor-pointer group">
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );

  // Tall Desktop Banner
  const renderTallDesktop = () => (
    <div className="w-full bg-white p-4">
      <div className="w-full h-96 relative overflow-hidden rounded-lg cursor-pointer group">
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );

  // Wide Desktop Banner
  const renderWideDesktop = () => (
    <div className="w-full bg-white p-4">
      <div className="w-full h-60 relative overflow-hidden rounded-lg cursor-pointer group">
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
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