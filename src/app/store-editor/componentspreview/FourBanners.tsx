import { ComponentHandler } from "../ComponentHandler";

interface FourBannersProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const FourBanners = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile'
}: FourBannersProps) => {
  // Mobile View Design - Stacked layout
  const renderMobileView = () => (
    <div className="w-full bg-white p-3">
      <div className="flex flex-col gap-2">
        {/* Large Top Banner */}
        <div className="w-full h-48 relative overflow-hidden rounded-lg cursor-pointer group">
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute bottom-4 left-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">FASHION</h2>
            <p className="text-sm text-gray-600">New Collection</p>
          </div>
        </div>

        {/* Bottom Grid - 3 Banners */}
        <div className="grid grid-cols-2 gap-2">
          {/* Top Middle Banner */}
          <div className="col-span-2 h-32 relative overflow-hidden rounded-lg cursor-pointer group">
            <div className="absolute inset-0 bg-blue-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <h3 className="text-lg font-bold text-gray-800">KIDS SALE</h3>
              <p className="text-xs text-gray-600 mt-1">Up to 50% Off</p>
            </div>
          </div>

          {/* Bottom Left Banner */}
          <div className="h-32 relative overflow-hidden rounded-lg cursor-pointer group">
            <div className="absolute inset-0 bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-2 left-2">
              <h4 className="text-sm font-bold text-gray-800">Men Brands</h4>
              <p className="text-xs text-gray-600">Top Picks</p>
            </div>
          </div>

          {/* Bottom Right Banner */}
          <div className="h-32 relative overflow-hidden rounded-lg cursor-pointer group">
            <div className="absolute inset-0 bg-purple-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-2 left-2">
              <h4 className="text-sm font-bold text-gray-800">WOMEN FASHION</h4>
              <p className="text-xs text-gray-600">Latest Trends</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop View Design - Same layout with placeholder icons
  const renderDesktopView = () => (
    <div className="w-full bg-white p-3">
      <div className="flex gap-2 h-64">
        {/* Large Left Banner */}
        <div className="w-1/2 relative overflow-hidden rounded-lg cursor-pointer group">
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute bottom-6 left-6">
            <h2 className="text-4xl font-bold text-gray-800 tracking-wider mb-1">FASHION</h2>
            <p className="text-sm text-gray-600">New Collection</p>
          </div>
        </div>

        {/* Right Grid - 3 Banners */}
        <div className="w-1/2 grid grid-cols-2 gap-2">
          {/* Top Right Banner - spans 2 columns */}
          <div className="col-span-2 relative overflow-hidden rounded-lg cursor-pointer group">
            <div className="absolute inset-0 bg-blue-100 flex items-center justify-center">
              <svg className="w-16 h-16 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <h3 className="text-2xl font-bold text-gray-800 tracking-wide">KIDS SALE</h3>
              <p className="text-xs text-gray-600 mt-1">Up to 50% Off</p>
            </div>
          </div>

          {/* Bottom Left Banner */}
          <div className="relative overflow-hidden rounded-lg cursor-pointer group">
            <div className="absolute inset-0 bg-green-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-3 left-3">
              <h4 className="text-lg font-bold text-gray-800">Men Brands</h4>
              <p className="text-xs text-gray-600">Top Picks</p>
            </div>
          </div>

          {/* Bottom Right Banner */}
          <div className="relative overflow-hidden rounded-lg cursor-pointer group">
            <div className="absolute inset-0 bg-purple-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-3 left-3">
              <h4 className="text-lg font-bold text-gray-800">WOMEN FASHION</h4>
              <p className="text-xs text-gray-600">Latest Trends</p>
            </div>
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