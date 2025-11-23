import React from 'react';

export const VoucherDemo = () => {
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
      serialNumber: 'No. 0000123',
      gradient: 'from-red-500 to-rose-600'
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
      serialNumber: 'No. 0000124',
      gradient: 'from-purple-500 to-purple-700'
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
      serialNumber: 'No. 0000125',
      gradient: 'from-blue-500 to-blue-700'
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
      serialNumber: 'No. 0000126',
      gradient: 'from-orange-500 to-orange-700'
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
      serialNumber: 'No. 0000127',
      gradient: 'from-green-500 to-green-700'
    }
  ];

  return (
    <div className="  flex items-center justify-center p-6">
      <div className="w-full max-w-7xl">
      
        {/* Horizontal Scrollable Container */}
        <div className="overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <div className="flex gap-6 min-w-max">
            {vouchers.map((voucher, index) => (
              <div
                key={voucher.id}
                className="flex-shrink-0 w-[500px]"
                style={{
                  animation: `slideIn 0.6s ease-out ${index * 0.1}s backwards`
                }}
              >
                <style>{`
                  @keyframes slideIn {
                    from {
                      opacity: 0;
                      transform: translateX(50px);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }
                `}</style>

                {/* Compact Voucher Ticket */}
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-500 hover:scale-105 h-64">
                  <div className="flex h-full">
                    {/* Left Colored Section - More Compact */}
                    <div className={`relative bg-gradient-to-br ${voucher.gradient} w-[60%] p-6 text-white`}>
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full -ml-8 -mb-8"></div>

                      {/* Voucher Header */}
                      <div className="relative mb-4">
                        <h3 className="text-xl font-black tracking-wide">Voucher</h3>
                        <h2 className="text-3xl font-black tracking-tight">Discount</h2>
                      </div>

                      {/* Up to Badge */}
                      <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 mb-6">
                        <span className="text-xs font-bold">{voucher.upTo}</span>
                      </div>

                      {/* Compact Barcode */}
                      <div className="bg-white rounded p-2 w-40">
                        <div className="flex gap-[1px] h-8">
                          {[...Array(25)].map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-gray-800"
                              style={{
                                height: Math.random() > 0.5 ? '100%' : '60%',
                                marginTop: Math.random() > 0.5 ? '0' : 'auto'
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>

                      {/* Discount Circle - Smaller */}
                      <div className="absolute top-1/2 right-4 -translate-y-1/2">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <span className={`text-4xl font-black bg-gradient-to-br ${voucher.gradient} text-transparent bg-clip-text`}>
                            {voucher.discount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right White Section - More Compact */}
                    <div className="relative w-[40%] bg-white p-4 flex flex-col justify-between">
                      {/* Hamburger Menu Icon */}
                      <div className="absolute top-4 right-4">
                        <div className="space-y-0.5">
                          <div className="w-4 h-0.5 bg-gray-800"></div>
                          <div className="w-4 h-0.5 bg-gray-800"></div>
                          <div className="w-4 h-0.5 bg-gray-800"></div>
                        </div>
                      </div>

                      {/* Date Info */}
                      <div className="space-y-0.5 text-right pr-8">
                        <p className="text-gray-500 text-[10px] font-semibold">Date</p>
                        <p className={`font-black text-lg bg-gradient-to-r ${voucher.gradient} text-transparent bg-clip-text`}>
                          {voucher.date}
                        </p>
                        <p className="text-gray-600 text-xs font-bold">{voucher.fullDate}</p>
                        
                        <div className="pt-2">
                          <p className="text-gray-500 text-[10px] font-semibold">Place Event</p>
                          <p className="text-gray-800 text-xs font-bold">{voucher.event}</p>
                          <p className="text-gray-600 text-xs font-bold">{voucher.time}</p>
                        </div>
                      </div>

                      {/* Gift Voucher Label */}
                      <div className="my-3">
                        <div className={`bg-gradient-to-r ${voucher.gradient} text-white px-2 py-1 text-[10px] font-bold inline-block`}>
                          GIFT VOUCHER
                        </div>
                      </div>

                      {/* Bottom Section */}
                      <div className="space-y-2">
                        {/* Voucher Discount Badge */}
                        <div className="flex flex-col items-end">
                          <div className={`bg-gradient-to-br ${voucher.gradient} text-white px-3 py-1.5 rounded text-right`}>
                            <p className="text-[10px] font-bold">Voucher</p>
                            <p className="text-sm font-black">Discount</p>
                          </div>
                        </div>

                        {/* Compact Barcode Vertical */}
                        <div className="bg-gray-100 rounded p-1.5">
                          <div className="flex gap-[1px] h-12 justify-center">
                            {[...Array(15)].map((_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-gray-800"
                                style={{
                                  height: Math.random() > 0.5 ? '100%' : '70%',
                                  marginTop: Math.random() > 0.5 ? '0' : 'auto'
                                }}
                              ></div>
                            ))}
                          </div>
                        </div>

                        {/* Serial Number */}
                        <p className="text-[10px] text-gray-500 text-right font-mono">{voucher.serialNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Perforation Circles - Smaller */}
                  <div className="absolute top-0 bottom-0 left-[60%] flex flex-col justify-around -translate-x-1/2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-gradient-to-br from-red-600 to-rose-600 rounded-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Hint */}
        <div className="mt-4 flex items-center justify-center gap-2 text-white/70">
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span className="text-xs font-semibold">Swipe to see more vouchers</span>
        </div>
      </div>
    </div>
  );
};