import { ComponentHandler } from "../ComponentHandler";

interface FiveBannersProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const FiveBanners = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile'
}: FiveBannersProps) => {
  // Mobile View Design - Smaller heights
  const renderMobileView = () => (
    <div className="w-full bg-white border border-gray-200 rounded-lg">
      <div className="space-y-3 p-3">
        {/* Top Row - Two Corner Banners */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative h-20 rounded-lg overflow-hidden bg-blue-50 border border-blue-200 transition-all duration-300 hover:shadow-sm group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute top-1 left-1 bg-white/80 px-1 py-0.5 rounded text-xs font-medium text-blue-700">
              Top Left
            </div>
          </div>
          
          <div className="relative h-20 rounded-lg overflow-hidden bg-purple-50 border border-purple-200 transition-all duration-300 hover:shadow-sm group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute top-1 right-1 bg-white/80 px-1 py-0.5 rounded text-xs font-medium text-purple-700">
              Top Right
            </div>
          </div>
        </div>

        {/* Center Main Banner */}
        <div className="relative h-28 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 transition-all duration-300 hover:shadow-md group">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-sm font-semibold text-gray-800 border border-gray-200">
            Featured
          </div>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            Center Main
          </div>
        </div>

        {/* Bottom Row - Two Corner Banners */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative h-20 rounded-lg overflow-hidden bg-green-50 border border-green-200 transition-all duration-300 hover:shadow-sm group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-1 left-1 bg-white/80 px-1 py-0.5 rounded text-xs font-medium text-green-700">
              Bottom Left
            </div>
          </div>
          
          <div className="relative h-20 rounded-lg overflow-hidden bg-orange-50 border border-orange-200 transition-all duration-300 hover:shadow-sm group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-1 right-1 bg-white/80 px-1 py-0.5 rounded text-xs font-medium text-orange-700">
              Bottom Right
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop View Design - Smaller heights
  const renderDesktopView = () => (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[300px]">
        {/* ==== TOP LEFT BANNER ==== */}
        <div className="relative rounded-lg overflow-hidden bg-blue-50 border border-blue-200 transition-all duration-300 hover:shadow-sm group">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-blue-700 border border-blue-200">
            Top Left
          </div>
        </div>

        {/* ==== CENTER MAIN BANNER ==== */}
        <div className="relative col-span-2 row-span-2 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 transition-all duration-300 hover:shadow-md group">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded text-sm font-semibold text-gray-800 border border-gray-200">
            Featured
          </div>
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            Center Main
          </div>
        </div>

        {/* ==== TOP RIGHT BANNER ==== */}
        <div className="relative rounded-lg overflow-hidden bg-purple-50 border border-purple-200 transition-all duration-300 hover:shadow-sm group">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-purple-700 border border-purple-200">
            Top Right
          </div>
        </div>

        {/* ==== BOTTOM LEFT BANNER ==== */}
        <div className="relative rounded-lg overflow-hidden bg-green-50 border border-green-200 transition-all duration-300 hover:shadow-sm group">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-green-700 border border-green-200">
            Bottom Left
          </div>
        </div>

        {/* ==== BOTTOM RIGHT BANNER ==== */}
        <div className="relative rounded-lg overflow-hidden bg-orange-50 border border-orange-200 transition-all duration-300 hover:shadow-sm group">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-orange-700 border border-orange-200">
            Bottom Right
          </div>
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