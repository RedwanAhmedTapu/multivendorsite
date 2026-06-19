import { MessageSquare, Star, Users } from "lucide-react";
import { ComponentHandler } from "../ComponentHandler";

export interface StoreHeaderStyles {
  headerBgColor?:         string;
  headerBgImageMobile?:   string;
  headerBgImageDesktop?:  string;
  headerOverlayOpacity?:  number;
  storeNameColor?:        string;
  followersColor?:        string;
  iconsColor?:            string;
  logoRingColor?:         string;
  chatButtonColor?:       string;
  chatButtonTextColor?:   string;
  // Visibility
  showLogo?:          boolean;
  showStoreName?:     boolean;
  showFollowers?:     boolean;
  showRating?:        boolean;
  showVerifiedBadge?: boolean;
  showChatButton?:    boolean;
}

interface StoreHeaderProps {
  isActive?:    boolean;
  onDragOver?:  (e: React.DragEvent) => void;
  onDrop?:      (e: React.DragEvent) => void;
  onMoveUp?:    () => void;
  onMoveDown?:  () => void;
  onCopy?:      () => void;
  onDelete?:    () => void;
  viewMode?:    "mobile" | "desktop";
  styles?:      StoreHeaderStyles;
}

export const StoreHeader = ({
  isActive  = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode  = "mobile",
  styles    = {},
}: StoreHeaderProps) => {
  const {
    headerBgColor        = "#0f172a",
    headerBgImageMobile,
    headerBgImageDesktop,
    headerOverlayOpacity = 0,
    storeNameColor       = "#ffffff",
    followersColor       = "#cbd5e1",
    iconsColor           = "#f59e0b",
    logoRingColor        = "#ffffff",
    chatButtonColor      = "#f97316",
    chatButtonTextColor  = "#ffffff",
    showLogo             = true,
    showStoreName        = true,
    showFollowers        = true,
    showRating           = true,
    showVerifiedBadge    = true,
    showChatButton       = true,
  } = styles;

  // Pick the right background image for the current view
  const bgImage = viewMode === "mobile" ? headerBgImageMobile : headerBgImageDesktop;

  // Build the CSS background for the header band
  const headerBgStyle: React.CSSProperties = bgImage
    ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: headerBgColor,
      }
    : { backgroundColor: headerBgColor };

  // Overlay div opacity (only when an image is set)
  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: "#000000",
    opacity: bgImage ? (headerOverlayOpacity ?? 0) / 100 : 0,
    pointerEvents: "none",
    borderRadius: "inherit",
  };

  return (
    <div
      className={`relative ${
        isActive ? "border-2 border-teal-500" : "border-2 border-transparent"
      } rounded-lg`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="store-header">
        {/* ── Header band ─────────────────────────────────────────── */}
        <div
          className="header-background pt-7 px-2 relative"
          style={headerBgStyle}
        >
          {/* Overlay tint */}
          <div style={overlayStyle} />

          {/* Content sits above the overlay */}
          <div className="relative z-10">
            {/* Store info row */}
            <div className="store-info flex items-center mb-4">
              {showLogo && (
                <div
                  className="w-14 h-14 rounded-lg mr-2 flex-shrink-0 overflow-hidden"
                  style={{ border: `2px solid ${logoRingColor}` }}
                >
                  <img
                    className="w-full h-full object-cover"
                    src="https://img.lazcdn.com/live/id/ot/bd1be8d500c8d7fcebe9eb46d1410641.jpg_110x110q75.jpg_.webp"
                    alt="Store"
                  />
                </div>
              )}

              <div className="store-details flex-1 min-w-0">
                {showStoreName && (
                  <span
                    className="store-name text-base font-semibold mr-2 block truncate"
                    style={{ color: storeNameColor }}
                  >
                    Ecom
                  </span>
                )}

                <div className="store-stats flex gap-3 mt-1 flex-wrap">
                  {showRating && (
                    <div className="stat-item flex items-center gap-1 text-xs" style={{ color: iconsColor }}>
                      <Star size={12} fill="currentColor" />
                      <span style={{ color: followersColor }}>4.8</span>
                    </div>
                  )}
                  {showFollowers && (
                    <div className="stat-item flex items-center gap-1 text-xs" style={{ color: followersColor }}>
                      <Users size={12} />
                      <span>12.5k</span>
                    </div>
                  )}
                  {showVerifiedBadge && (
                    <div
                      className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${iconsColor}22`, color: iconsColor }}
                    >
                      ✓ Verified
                    </div>
                  )}
                </div>
              </div>

              {showChatButton && (
                <button
                  className="follow-btn border-none rounded px-3 py-2 text-xs font-medium flex items-center gap-1.5 flex-shrink-0"
                  style={{ backgroundColor: chatButtonColor, color: chatButtonTextColor }}
                >
                  <MessageSquare size={12} />
                  Chat
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="store-tabs flex justify-around px-4">
              <div className="tab py-2 px-3 text-sm font-semibold relative cursor-pointer" style={{ color: storeNameColor }}>
                Store
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded"
                  style={{ backgroundColor: storeNameColor }}
                />
              </div>
              <div className="tab py-2 px-3 text-sm cursor-pointer" style={{ color: followersColor }}>
                Products
              </div>
            </div>
          </div>
        </div>
      </div>

      {isActive && (
        <ComponentHandler
          isLocked
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};