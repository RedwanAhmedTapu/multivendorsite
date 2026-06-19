import { ComponentHandler } from "../ComponentHandler";

interface ThreeBannersProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const ThreeBanners = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile'
}: ThreeBannersProps) => {
  // Mobile View Design - Stacked layout
  const renderMobileView = () => (
    <div className="w-full bg-white border border-gray-200 rounded-lg">
      <div className="space-y-3 p-4">
        {/* Main Banner */}
        <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100 border border-gray-300 transition-all duration-300 hover:shadow-md group">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          
        </div>

        {/* Two Smaller Banners */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative h-32 rounded-lg overflow-hidden bg-blue-50 border border-blue-200 transition-all duration-300 hover:shadow-sm group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
           
          </div>
          
          <div className="relative h-32 rounded-lg overflow-hidden bg-green-50 border border-green-200 transition-all duration-300 hover:shadow-sm group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
           
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop View Design - Side by side layout
  const renderDesktopView = () => (
    <div className="w-full bg-white border border-gray-200 rounded-xl">
      <div className="grid grid-cols-3 gap-5 p-6">
        {/* Left Main Banner - Larger */}
        <div className="col-span-2">
          <div className="relative h-80 rounded-lg overflow-hidden bg-gray-100 border border-gray-300 transition-all duration-300 hover:shadow-lg group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-lg text-sm font-semibold text-gray-800 border border-gray-200">
              Featured
            </div>
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm font-medium">
              Main Promotion
            </div>
          </div>
        </div>

        {/* Right Side Banners - Vertical Stack */}
        <div className="flex flex-col gap-5">
          {/* Top Small Banner */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-purple-50 border border-purple-200 transition-all duration-300 hover:shadow-md group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-14 h-14 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded text-xs font-medium text-purple-700">
              Special Offer
            </div>
          </div>

          {/* Bottom Small Banner */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-pink-50 border border-pink-200 transition-all duration-300 hover:shadow-md group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-14 h-14 text-pink-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded text-xs font-medium text-pink-700">
              New Arrival
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Alternative Desktop Design - More Professional
  const renderDesktopViewAlt = () => (
    <div className="w-full bg-white border border-gray-300 rounded-2xl shadow-sm">
      <div className="grid grid-cols-12 gap-6 p-8">
        {/* Main Banner - Takes 8 columns */}
        <div className="col-span-8">
          <div className="relative h-96 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-300 transition-all duration-300 hover:border-gray-400 group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-28 h-28 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            
           
          </div>
        </div>

        {/* Side Banners - Take 4 columns */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="flex-1 relative rounded-xl overflow-hidden bg-blue-50 border-2 border-blue-300 transition-all duration-300 hover:border-blue-400 group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
           
          </div>

          <div className="flex-1 relative rounded-xl overflow-hidden bg-emerald-50 border-2 border-emerald-300 transition-all duration-300 hover:border-emerald-400 group">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
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
      } rounded-xl transition-all duration-200`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {viewMode === 'mobile' ? renderMobileView() : renderDesktopViewAlt()}

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