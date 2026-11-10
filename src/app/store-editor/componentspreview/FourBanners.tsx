import { ComponentHandler } from "../ComponentHandler";

export interface FourBannersFormData {
  slotImages?: (string | undefined)[]; // [left, topRight, bottomLeft, bottomRight]
  titles?: string[];                     // [left, topRight, bottomLeft, bottomRight]
  subtitles?: string[];
  isVisible?: boolean;
}

interface FourBannersProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
  formData?: FourBannersFormData;
}

const Placeholder = ({ src, iconClass }: { src?: string; iconClass: string }) =>
  src ? (
    <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    </div>
  );

export const FourBanners = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile',
  formData = {},
}: FourBannersProps) => {
  const images    = formData.slotImages ?? [];
  const titles    = formData.titles    ?? ["FASHION", "KIDS SALE", "Men Brands", "WOMEN FASHION"];
  const subtitles = formData.subtitles ?? ["New Collection", "Up to 50% Off", "Top Picks", "Latest Trends"];
  const [leftImg, topRightImg, bottomLeftImg, bottomRightImg] = images;

  // Mobile View Design - Stacked layout
  const renderMobileView = () => (
    <div className="w-full bg-white p-3">
      <div className="flex flex-col gap-2">
        {/* Large Top Banner */}
        <div className="w-full h-48 relative overflow-hidden rounded-lg cursor-pointer group bg-gray-200">
          <Placeholder src={leftImg} iconClass="w-16 h-16 text-gray-400" />
          <div className="absolute bottom-4 left-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{titles[0]}</h2>
            <p className="text-sm text-gray-600">{subtitles[0]}</p>
          </div>
        </div>

        {/* Bottom Grid - 3 Banners */}
        <div className="grid grid-cols-2 gap-2">
          {/* Top Middle Banner */}
          <div className="col-span-2 h-32 relative overflow-hidden rounded-lg cursor-pointer group bg-blue-100">
            <Placeholder src={topRightImg} iconClass="w-12 h-12 text-blue-400" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <h3 className="text-lg font-bold text-gray-800">{titles[1]}</h3>
              <p className="text-xs text-gray-600 mt-1">{subtitles[1]}</p>
            </div>
          </div>

          {/* Bottom Left Banner */}
          <div className="h-32 relative overflow-hidden rounded-lg cursor-pointer group bg-green-100">
            <Placeholder src={bottomLeftImg} iconClass="w-10 h-10 text-green-400" />
            <div className="absolute bottom-2 left-2">
              <h4 className="text-sm font-bold text-gray-800">{titles[2]}</h4>
              <p className="text-xs text-gray-600">{subtitles[2]}</p>
            </div>
          </div>

          {/* Bottom Right Banner */}
          <div className="h-32 relative overflow-hidden rounded-lg cursor-pointer group bg-purple-100">
            <Placeholder src={bottomRightImg} iconClass="w-10 h-10 text-purple-400" />
            <div className="absolute bottom-2 left-2">
              <h4 className="text-sm font-bold text-gray-800">{titles[3]}</h4>
              <p className="text-xs text-gray-600">{subtitles[3]}</p>
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
        <div className="w-1/2 relative overflow-hidden rounded-lg cursor-pointer group bg-gray-200">
          <Placeholder src={leftImg} iconClass="w-24 h-24 text-gray-400" />
          <div className="absolute bottom-6 left-6">
            <h2 className="text-4xl font-bold text-gray-800 tracking-wider mb-1">{titles[0]}</h2>
            <p className="text-sm text-gray-600">{subtitles[0]}</p>
          </div>
        </div>

        {/* Right Grid - 3 Banners */}
        <div className="w-1/2 grid grid-cols-2 gap-2">
          {/* Top Right Banner - spans 2 columns */}
          <div className="col-span-2 relative overflow-hidden rounded-lg cursor-pointer group bg-blue-100">
            <Placeholder src={topRightImg} iconClass="w-16 h-16 text-blue-400" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <h3 className="text-2xl font-bold text-gray-800 tracking-wide">{titles[1]}</h3>
              <p className="text-xs text-gray-600 mt-1">{subtitles[1]}</p>
            </div>
          </div>

          {/* Bottom Left Banner */}
          <div className="relative overflow-hidden rounded-lg cursor-pointer group bg-green-100">
            <Placeholder src={bottomLeftImg} iconClass="w-12 h-12 text-green-400" />
            <div className="absolute bottom-3 left-3">
              <h4 className="text-lg font-bold text-gray-800">{titles[2]}</h4>
              <p className="text-xs text-gray-600">{subtitles[2]}</p>
            </div>
          </div>

          {/* Bottom Right Banner */}
          <div className="relative overflow-hidden rounded-lg cursor-pointer group bg-purple-100">
            <Placeholder src={bottomRightImg} iconClass="w-12 h-12 text-purple-400" />
            <div className="absolute bottom-3 left-3">
              <h4 className="text-lg font-bold text-gray-800">{titles[3]}</h4>
              <p className="text-xs text-gray-600">{subtitles[3]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (formData.isVisible === false) return null;

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