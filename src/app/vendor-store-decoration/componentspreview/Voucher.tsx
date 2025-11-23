import React from 'react';
import { ComponentHandler } from "../ComponentHandler";

interface VoucherProps {
  isActive?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  viewMode?: 'mobile' | 'desktop';
}

export const Voucher = ({
  isActive = false,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
  onCopy,
  onDelete,
  viewMode = 'mobile'
}: VoucherProps) => {
  const vouchers = [
    {
      id: 1,
      discount: '50%',
      upTo: 'UP TO 80% OFF',
      date: 'FRIDAY',
      fullDate: '10.05.2024',
      event: 'Place Event',
      time: '20:15',
      code: 'SAVE50NOW',
      serialNumber: 'No. 0000123'
    },
    {
      id: 2,
      discount: '40%',
      upTo: 'UP TO 70% OFF',
      date: 'SATURDAY',
      fullDate: '11.05.2024',
      event: 'Special Sale',
      time: '18:30',
      code: 'MEGA40OFF',
      serialNumber: 'No. 0000124'
    },
    {
      id: 3,
      discount: '60%',
      upTo: 'UP TO 90% OFF',
      date: 'SUNDAY',
      fullDate: '12.05.2024',
      event: 'Flash Deal',
      time: '14:00',
      code: 'SUPER60',
      serialNumber: 'No. 0000125'
    },
    {
      id: 4,
      discount: '35%',
      upTo: 'UP TO 65% OFF',
      date: 'MONDAY',
      fullDate: '13.05.2024',
      event: 'Week Start',
      time: '10:00',
      code: 'START35',
      serialNumber: 'No. 0000126'
    },
    {
      id: 5,
      discount: '45%',
      upTo: 'UP TO 75% OFF',
      date: 'TUESDAY',
      fullDate: '14.05.2024',
      event: 'Mid Week',
      time: '16:45',
      code: 'DEAL45NOW',
      serialNumber: 'No. 0000127'
    }
  ];

  // Mobile View Design
  const renderMobileView = () => (
    <div className="w-full bg-white p-3">
      <div className="overflow-x-auto scrollbar-hide pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex gap-4 min-w-max">
          {vouchers.map((voucher, index) => (
            <div
              key={voucher.id}
              className="flex-shrink-0 w-80"
            >
              {/* Compact Voucher Ticket */}
              <div className="relative bg-white rounded-xl border border-gray-300 overflow-hidden hover:shadow-lg transition-all duration-300 h-48">
                <div className="flex h-full">
                  {/* Left Gray Section */}
                  <div className="relative bg-gray-200 w-[60%] p-4">
                    {/* Voucher Header */}
                    <div className="relative mb-3">
                      <h3 className="text-sm font-bold text-gray-800">Voucher</h3>
                      <h2 className="text-lg font-bold text-gray-900">Discount</h2>
                    </div>

                    {/* Up to Badge */}
                    <div className="inline-block bg-white/80 rounded-lg px-2 py-1 mb-4">
                      <span className="text-xs font-bold text-gray-700">{voucher.upTo}</span>
                    </div>

                    {/* Compact Barcode */}
                    <div className="bg-white rounded p-1.5 w-32">
                      <div className="flex gap-[1px] h-6">
                        {[...Array(25)].map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gray-600"
                            style={{
                              height: Math.random() > 0.5 ? '100%' : '60%',
                              marginTop: Math.random() > 0.5 ? '0' : 'auto'
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Discount Circle */}
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-300">
                        <span className="text-2xl font-bold text-gray-800">
                          {voucher.discount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right White Section */}
                  <div className="relative w-[40%] bg-white p-3 flex flex-col justify-between">
                    {/* Hamburger Menu Icon */}
                    <div className="absolute top-3 right-3">
                      <div className="space-y-0.5">
                        <div className="w-3 h-0.5 bg-gray-600"></div>
                        <div className="w-3 h-0.5 bg-gray-600"></div>
                        <div className="w-3 h-0.5 bg-gray-600"></div>
                      </div>
                    </div>

                    {/* Date Info */}
                    <div className="space-y-0.5 text-right pr-6">
                      <p className="text-gray-500 text-[9px] font-semibold">Date</p>
                      <p className="font-bold text-sm text-gray-800">
                        {voucher.date}
                      </p>
                      <p className="text-gray-600 text-[10px] font-bold">{voucher.fullDate}</p>
                      
                      <div className="pt-1">
                        <p className="text-gray-500 text-[9px] font-semibold">Place Event</p>
                        <p className="text-gray-800 text-[10px] font-bold">{voucher.event}</p>
                        <p className="text-gray-600 text-[10px] font-bold">{voucher.time}</p>
                      </div>
                    </div>

                    {/* Gift Voucher Label */}
                    <div className="my-2">
                      <div className="bg-gray-200 text-gray-700 px-2 py-1 text-[9px] font-bold inline-block rounded">
                        GIFT VOUCHER
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="space-y-1">
                      {/* Voucher Discount Badge */}
                      <div className="flex flex-col items-end">
                        <div className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-right">
                          <p className="text-[9px] font-bold">Voucher</p>
                          <p className="text-xs font-bold">Discount</p>
                        </div>
                      </div>

                      {/* Compact Barcode Vertical */}
                      <div className="bg-gray-100 rounded p-1">
                        <div className="flex gap-[1px] h-8 justify-center">
                          {[...Array(15)].map((_, i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-gray-600"
                              style={{
                                height: Math.random() > 0.5 ? '100%' : '70%',
                                marginTop: Math.random() > 0.5 ? '0' : 'auto'
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>

                      {/* Serial Number */}
                      <p className="text-[9px] text-gray-500 text-right font-mono">{voucher.serialNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Perforation Circles */}
                <div className="absolute top-0 bottom-0 left-[60%] flex flex-col justify-around -translate-x-1/2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Desktop View Design
  const renderDesktopView = () => (
    <div className="w-full bg-white p-6">
      <div className="overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex gap-6 min-w-max">
          {vouchers.map((voucher, index) => (
            <div
              key={voucher.id}
              className="flex-shrink-0 w-96"
            >
              {/* Voucher Ticket */}
              <div className="relative bg-white rounded-2xl border border-gray-300 overflow-hidden hover:shadow-xl transition-all duration-300 h-64">
                <div className="flex h-full">
                  {/* Left Gray Section */}
                  <div className="relative bg-gray-200 w-[60%] p-6">
                    {/* Voucher Header */}
                    <div className="relative mb-4">
                      <h3 className="text-base font-bold text-gray-800">Voucher</h3>
                      <h2 className="text-xl font-bold text-gray-900">Discount</h2>
                    </div>

                    {/* Up to Badge */}
                    <div className="inline-block bg-white/80 rounded-lg px-3 py-1.5 mb-6">
                      <span className="text-xs font-bold text-gray-700">{voucher.upTo}</span>
                    </div>

                    {/* Compact Barcode */}
                    <div className="bg-white rounded p-2 w-40">
                      <div className="flex gap-[1px] h-8">
                        {[...Array(25)].map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gray-600"
                            style={{
                              height: Math.random() > 0.5 ? '100%' : '60%',
                              marginTop: Math.random() > 0.5 ? '0' : 'auto'
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Discount Circle */}
                    <div className="absolute top-1/2 right-4 -translate-y-1/2">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-300">
                        <span className="text-3xl font-bold text-gray-800">
                          {voucher.discount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right White Section */}
                  <div className="relative w-[40%] bg-white p-4 flex flex-col justify-between">
                    {/* Hamburger Menu Icon */}
                    <div className="absolute top-4 right-4">
                      <div className="space-y-0.5">
                        <div className="w-4 h-0.5 bg-gray-600"></div>
                        <div className="w-4 h-0.5 bg-gray-600"></div>
                        <div className="w-4 h-0.5 bg-gray-600"></div>
                      </div>
                    </div>

                    {/* Date Info */}
                    <div className="space-y-0.5 text-right pr-8">
                      <p className="text-gray-500 text-xs font-semibold">Date</p>
                      <p className="font-bold text-lg text-gray-800">
                        {voucher.date}
                      </p>
                      <p className="text-gray-600 text-sm font-bold">{voucher.fullDate}</p>
                      
                      <div className="pt-2">
                        <p className="text-gray-500 text-xs font-semibold">Place Event</p>
                        <p className="text-gray-800 text-sm font-bold">{voucher.event}</p>
                        <p className="text-gray-600 text-sm font-bold">{voucher.time}</p>
                      </div>
                    </div>

                    {/* Gift Voucher Label */}
                    <div className="my-3">
                      <div className="bg-gray-200 text-gray-700 px-3 py-1.5 text-xs font-bold inline-block rounded">
                        GIFT VOUCHER
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="space-y-2">
                      {/* Voucher Discount Badge */}
                      <div className="flex flex-col items-end">
                        <div className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-right">
                          <p className="text-xs font-bold">Voucher</p>
                          <p className="text-sm font-bold">Discount</p>
                        </div>
                      </div>

                      {/* Compact Barcode Vertical */}
                      <div className="bg-gray-100 rounded p-1.5">
                        <div className="flex gap-[1px] h-12 justify-center">
                          {[...Array(15)].map((_, i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-gray-600"
                              style={{
                                height: Math.random() > 0.5 ? '100%' : '70%',
                                marginTop: Math.random() > 0.5 ? '0' : 'auto'
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>

                      {/* Serial Number */}
                      <p className="text-xs text-gray-500 text-right font-mono">{voucher.serialNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Perforation Circles */}
                <div className="absolute top-0 bottom-0 left-[60%] flex flex-col justify-around -translate-x-1/2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
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

// Add this CSS to hide scrollbars
const styles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}