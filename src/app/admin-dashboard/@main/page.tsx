import React from 'react';
import { DollarSign, Users, ShoppingCart } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { icon: DollarSign, value: '$1k', label: 'Total Sales', change: '+8% from yesterday' },
    { icon: Users, value: '8', label: 'New Customers', change: '0.5% from yesterday' },
    { icon: ShoppingCart, value: '300', label: 'Total Order', change: '+2% from yesterday' }
  ];

  const trafficSources = [
    { name: 'Facebook', value: 37 },
    { name: 'Website', value: 25 },
    { name: 'Fans', value: 10 },
    { name: 'Etsy', value: 7 },
    { name: 'Others', value: 21 }
  ];

  const revenueData = [
    { day: 'Monday', online: 12, offline: 8 },
    { day: 'Tuesday', online: 8, offline: 15 },
    { day: 'Wednesday', online: 20, offline: 10 },
    { day: 'Thursday', online: 15, offline: 6 },
    { day: 'Friday', online: 18, offline: 12 },
    { day: 'Saturday', online: 22, offline: 8 },
    { day: 'Sunday', online: 25, offline: 5 }
  ];

  const topProducts = [
    { id: '01', name: 'Home Decor Range', popularity: 45, sales: '45%' },
    { id: '02', name: 'Disney Princess Pink Bag 18', popularity: 29, sales: '29%' },
    { id: '03', name: 'Bathroom Essentials', popularity: 18, sales: '18%' },
    { id: '04', name: 'Apple Smartwatches', popularity: 25, sales: '25%' }
  ];

  const sessionsByLocation = [
    { id: '01', name: 'Chicago', popularity: 85, sales: '85%', color: 'bg-blue-500' },
    { id: '02', name: 'San Antonio', popularity: 29, sales: '29%', color: 'bg-green-500' },
    { id: '03', name: 'San Francisco', popularity: 18, sales: '18%', color: 'bg-indigo-500' },
    { id: '04', name: 'Portland', popularity: 25, sales: '25%', color: 'bg-orange-500' }
  ];

  return (
    <div className="min-h-screen  ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-md">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1 text-gray-800">{stat.value}</div>
              <div className="text-gray-600 text-sm mb-2 font-medium">{stat.label}</div>
              <div className="text-green-600 text-xs font-semibold">{stat.change}</div>
            </div>
          ))}

          {/* New Traffic Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold mb-1 text-gray-800">121</div>
            <div className="text-gray-600 text-sm mb-4 font-medium">New Traffic</div>
            <div className="text-xs text-gray-500 mb-3">+5% more from last month</div>
            <div className="space-y-2">
              {trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">{source.name}</span>
                  <div className="flex items-center gap-2 flex-1 mx-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${source.value}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-800 font-semibold">{source.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue and Sales Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Total Revenue */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-bold mb-6 text-gray-800">Total Revenue</h3>
            <div className="flex items-end justify-between h-48 gap-4">
              {revenueData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1 h-full justify-end">
                  <div className="w-full flex flex-col gap-1 items-center" style={{ height: '85%' }}>
                    <div className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t shadow-sm hover:shadow-md transition-shadow" style={{ height: `${data.online * 3}%` }}></div>
                    <div className="w-full bg-gradient-to-t from-gray-300 to-gray-400 rounded-t shadow-sm hover:shadow-md transition-shadow" style={{ height: `${data.offline * 3}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-medium">{data.day.slice(0, 3)}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow"></div>
                <span className="text-gray-600 font-medium">Online Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow"></div>
                <span className="text-gray-600 font-medium">Offline Sales</span>
              </div>
            </div>
          </div>

          {/* Sales Overview */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Sales overview</h3>
              <span className="text-xs text-green-600 font-semibold">(+5) more in 2021</span>
            </div>
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgb(6, 182, 212)', stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: 'rgb(6, 182, 212)', stopOpacity: 0.05 }} />
                  </linearGradient>
                  <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.05 }} />
                  </linearGradient>
                </defs>
                
                {/* Background area - cyan */}
                <path
                  d="M0,80 Q50,60 100,70 T200,85 T300,75 T400,90 L400,150 L0,150 Z"
                  fill="url(#grad1)"
                />
                
                {/* Foreground area - blue */}
                <path
                  d="M0,100 Q50,85 100,95 T200,65 T300,80 T400,70 L400,150 L0,150 Z"
                  fill="url(#grad2)"
                />
                
                {/* Cyan line */}
                <path
                  d="M0,80 Q50,60 100,70 T200,85 T300,75 T400,90"
                  fill="none"
                  stroke="rgb(6, 182, 212)"
                  strokeWidth="2.5"
                />
                
                {/* Blue line */}
                <path
                  d="M0,100 Q50,85 100,95 T200,65 T300,80 T400,70"
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 mt-4 font-medium">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Products */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-bold mb-6 text-gray-800">Top Products</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 text-xs text-gray-600 font-semibold pb-2 border-b-2 border-gray-200">
                <div className="col-span-1">#</div>
                <div className="col-span-6">Name</div>
                <div className="col-span-3">Popularity</div>
                <div className="col-span-2 text-right">Sales</div>
              </div>
              {topProducts.map((product) => (
                <div key={product.id} className="grid grid-cols-12 gap-4 items-center text-sm hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="col-span-1 text-gray-500 font-medium">{product.id}</div>
                  <div className="col-span-6 text-gray-800 font-medium">{product.name}</div>
                  <div className="col-span-3">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${product.popularity}%` }}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-gray-800 font-semibold">{product.sales}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Session By State/Zip code */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-bold mb-6 text-gray-800">Session By State/Zip code</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 text-xs text-gray-600 font-semibold pb-2 border-b-2 border-gray-200">
                <div className="col-span-1">#</div>
                <div className="col-span-6">Name</div>
                <div className="col-span-3">Popularity</div>
                <div className="col-span-2 text-right">Sales</div>
              </div>
              {sessionsByLocation.map((location) => (
                <div key={location.id} className="grid grid-cols-12 gap-4 items-center text-sm hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="col-span-1 text-gray-500 font-medium">{location.id}</div>
                  <div className="col-span-6 text-gray-800 font-medium">{location.name}</div>
                  <div className="col-span-3">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`${location.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${location.popularity}%` }}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-gray-800 font-semibold">{location.sales}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}