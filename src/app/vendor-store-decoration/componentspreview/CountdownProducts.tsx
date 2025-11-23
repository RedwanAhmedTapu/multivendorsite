import React from 'react';



interface CountdownProductsProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const CountdownProducts = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'desktop'
}: CountdownProductsProps) => {
  // Mobile View Design
  const renderMobileView = () => (
    <div className="bg-gray-100 rounded-lg p-3">
      <div className="countdown-section">
        <div className="countdown-header bg-gradient-to-r from-teal-500 to-teal-700 p-3 rounded-lg text-white">
          <h3 className="text-lg font-semibold">Flash Sale</h3>
          <div className="countdown-timer flex items-center mt-2">
            <span className="text-sm">Ending in</span>
            <div className="timer-display flex items-center gap-1 ml-2">
              <div className="time-unit bg-black text-white px-1 rounded text-sm font-bold min-w-[21px] text-center">22</div>
              <span>:</span>
              <div className="time-unit bg-black text-white px-1 rounded text-sm font-bold min-w-[21px] text-center">13</div>
              <span>:</span>
              <div className="time-unit bg-black text-white px-1 rounded text-sm font-bold min-w-[21px] text-center">53</div>
              <span>:</span>
              <div className="time-unit bg-black text-white px-1 rounded text-sm font-bold min-w-[21px] text-center">15</div>
            </div>
          </div>
        </div>
        
        <div className="product-scroll mt-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3 pb-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="product-item bg-white rounded-lg p-3 flex gap-2 min-w-[280px]">
                <div className="product-image w-24 h-24 rounded-lg overflow-hidden bg-teal-50 border border-teal-200 flex items-center justify-center">
                  <svg className="w-10 h-10 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="product-details flex-1">
                  <h4 className="text-sm text-gray-900 mb-1 line-clamp-2 h-8">Party Gown {item}</h4>
                  <div className="original-price text-xs text-gray-500 line-through">৳688</div>
                  <div className="price text-lg text-red-500 font-bold mb-2">৳344</div>
                  <button className="buy-now-btn bg-gradient-to-r from-teal-500 to-teal-600 text-white border border-teal-400 rounded-lg px-4 py-1 text-sm font-medium hover:from-teal-600 hover:to-teal-700 transition-all">
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Desktop View Design with Reduced Gaps
  const renderDesktopView = () => (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-xl">
      <div className="countdown-section">
        {/* Premium Countdown Header */}
        <div className="countdown-header bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 p-8 rounded-2xl text-white mb-6 shadow-2xl relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-bold border border-white/30">
                  ⚡ FLASH SALE
                </div>
                <div className="bg-red-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  LIVE NOW
                </div>
              </div>
              <h3 className="text-4xl font-black tracking-tight mb-2">MEGA DEALS</h3>
              <p className="text-teal-50 text-base font-medium">Grab your favorites before they're gone!</p>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold mb-4 tracking-wider text-teal-50">⏰ HURRY! OFFER ENDS IN</div>
              <div className="timer-display flex items-center justify-end gap-2">
                <div className="time-unit bg-white/95 backdrop-blur-sm text-teal-600 px-5 py-3 rounded-xl shadow-2xl border-2 border-white/50">
                  <div className="text-4xl font-black">22</div>
                  <div className="text-xs font-bold mt-1 text-teal-500">HOURS</div>
                </div>
                <span className="text-white/80 text-3xl font-bold">:</span>
                <div className="time-unit bg-white/95 backdrop-blur-sm text-teal-600 px-5 py-3 rounded-xl shadow-2xl border-2 border-white/50">
                  <div className="text-4xl font-black">13</div>
                  <div className="text-xs font-bold mt-1 text-teal-500">MINS</div>
                </div>
                <span className="text-white/80 text-3xl font-bold">:</span>
                <div className="time-unit bg-white/95 backdrop-blur-sm text-teal-600 px-5 py-3 rounded-xl shadow-2xl border-2 border-white/50">
                  <div className="text-4xl font-black">53</div>
                  <div className="text-xs font-bold mt-1 text-teal-500">SECS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Premium Product Grid with Reduced Gaps */}
        <div className="products-grid grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="product-card group bg-white rounded-xl p-3 border-2 border-gray-100 hover:border-teal-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              
              {/* Product Image with Enhanced Hover */}
              <div className="product-image w-full aspect-square rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 border-2 border-gray-100 flex items-center justify-center group-hover:border-teal-300 transition-all duration-300 relative">
                <svg className="w-16 h-16 text-teal-400 group-hover:scale-125 transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                
               
                <div className="absolute top-2 right-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-2 py-1 rounded-lg text-xs font-black shadow-lg">
                  -56%
                </div>
                
                {/* Quick View on Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button className="bg-white text-teal-600 px-4 py-2 rounded-lg font-bold text-sm transform scale-75 group-hover:scale-100 transition-transform">
                    Quick View
                  </button>
                </div>
              </div>

              {/* Product Info - Minimal */}
              <div className="product-info">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors leading-snug">
                  Premium Party Gown Collection {item}
                </h4>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex text-amber-400 text-xs">
                    {"★".repeat(5)}
                  </div>
                  <span className="text-xs text-gray-400">(128)</span>
                </div>
                
                {/* Price Section */}
                <div className="flex items-baseline gap-2">
                  <div className="text-lg text-red-600 font-bold">৳344</div>
                  <div className="text-xs text-gray-400 line-through">৳799</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Enhanced View All Section */}
        <div className="view-all-section text-center mt-6">
          <button className="bg-gradient-to-r from-white to-gray-50 border-3 border-teal-500 text-teal-600 hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-500 hover:text-white px-12 py-4 rounded-xl font-black text-base transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3 mx-auto group">
            VIEW ALL 24 DEALS
            <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          <p className="text-sm text-gray-500 mt-3 font-medium">✨ Discover more amazing deals before they expire!</p>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`relative ${
        isActive ? "ring-4 ring-teal-500 ring-offset-2" : ""
      } rounded-2xl`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {viewMode === 'mobile' ? renderMobileView() : renderDesktopView()}

     
    </div>
  );
};

// Demo Component
export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-gray-800 mb-2">Flash Sale Products</h1>
          <p className="text-gray-600">Enhanced user-friendly design with optimized spacing</p>
        </div>
        <CountdownProducts viewMode="desktop" />
      </div>
    </div>
  );
}