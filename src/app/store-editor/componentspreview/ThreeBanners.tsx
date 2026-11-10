import { ComponentHandler } from "../ComponentHandler";

export interface ThreeBannersFormData {
  bannerImages?: (string | undefined)[]; // [main, topRight, bottomRight]
  isVisible?: boolean;
}

interface ThreeBannersProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
  formData?: ThreeBannersFormData;
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

export const ThreeBanners = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile',
  formData = {},
}: ThreeBannersProps) => {
  const images = formData.bannerImages ?? [];
  const [mainImg, topRightImg, bottomRightImg] = images;

  // Mobile View Design - Stacked layout
  const renderMobileView = () => (
    <div className="w-full bg-white border border-gray-200 rounded-lg">
      <div className="space-y-3 p-4">
        {/* Main Banner */}
        <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100 border border-gray-300 transition-all duration-300 hover:shadow-md group">
          <Placeholder src={mainImg} iconClass="w-16 h-16 text-gray-400" />
        </div>

        {/* Two Smaller Banners */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative h-32 rounded-lg overflow-hidden bg-blue-50 border border-blue-200 transition-all duration-300 hover:shadow-sm group">
            <Placeholder src={topRightImg} iconClass="w-10 h-10 text-blue-300" />
          </div>

          <div className="relative h-32 rounded-lg overflow-hidden bg-green-50 border border-green-200 transition-all duration-300 hover:shadow-sm group">
            <Placeholder src={bottomRightImg} iconClass="w-10 h-10 text-green-300" />
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
            <Placeholder src={mainImg} iconClass="w-28 h-28 text-gray-400" />
          </div>
        </div>

        {/* Side Banners - Take 4 columns */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="flex-1 relative rounded-xl overflow-hidden bg-blue-50 border-2 border-blue-300 transition-all duration-300 hover:border-blue-400 group">
            <Placeholder src={topRightImg} iconClass="w-16 h-16 text-blue-400" />
          </div>

          <div className="flex-1 relative rounded-xl overflow-hidden bg-emerald-50 border-2 border-emerald-300 transition-all duration-300 hover:border-emerald-400 group">
            <Placeholder src={bottomRightImg} iconClass="w-16 h-16 text-emerald-400" />
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