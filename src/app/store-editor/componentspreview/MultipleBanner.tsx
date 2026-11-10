import { ComponentHandler } from "../ComponentHandler";

export interface MultipleBannersFormData {
  bannerImages?: (string | undefined)[]; // up to 4 images
  isVisible?: boolean;
}

interface MultipleBannersProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
  formData?: MultipleBannersFormData;
}

const FALLBACK_SHADES = ["bg-gray-200", "bg-gray-300", "bg-gray-400", "bg-gray-500"];
const FALLBACK_ICON_SHADES = ["text-gray-400", "text-gray-500", "text-gray-600", "text-gray-700"];

const Slot = ({ src, shade, iconShade, sizeClass }: { src?: string; shade: string; iconShade: string; sizeClass: string }) => (
  <div className="flex-1 relative rounded-lg overflow-hidden cursor-pointer group h-24">
    {src ? (
      <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <div className={`absolute inset-0 ${shade} flex items-center justify-center`}>
        <svg className={`${sizeClass} ${iconShade}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    )}
  </div>
);

export const MultipleBanners = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile',
  formData = {},
}: MultipleBannersProps) => {
  const images = formData.bannerImages ?? [undefined, undefined, undefined, undefined];

  // Mobile View Design - Four banners in flex
  const renderMobileView = () => (
    <div className="w-full bg-white p-3">
      <div className="flex gap-2">
        {images.map((src, i) => (
          <Slot key={i} src={src} shade={FALLBACK_SHADES[i % 4]} iconShade={FALLBACK_ICON_SHADES[i % 4]} sizeClass="w-8 h-8" />
        ))}
      </div>
    </div>
  );

  // Desktop View Design - Four banners in flex
  const renderDesktopView = () => (
    <div className="w-full bg-white p-6">
      <div className="flex gap-4">
        {images.map((src, i) => (
          <div key={i} className="flex-1 relative rounded-xl overflow-hidden cursor-pointer group h-32">
            {src ? (
              <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className={`absolute inset-0 ${FALLBACK_SHADES[i % 4]} flex items-center justify-center`}>
                <svg className={`w-12 h-12 ${FALLBACK_ICON_SHADES[i % 4]}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
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