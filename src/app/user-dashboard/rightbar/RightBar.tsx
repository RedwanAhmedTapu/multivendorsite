'use client';

import React from 'react';

interface RightbarProps {
  isRightbarOpen: boolean;
  toggleRightbar: () => void;
  closeRightbar: () => void;
}

export default function Rightbar({ isRightbarOpen, toggleRightbar, closeRightbar }: RightbarProps) {
  const recentActivities = [
    { id: 1, text: 'Order #ORD-7842 shipped', time: '2 min ago', icon: '🚚', color: 'blue' },
    { id: 2, text: 'Payment received $249.99', time: '15 min ago', icon: '💳', color: 'green' },
    { id: 3, text: 'New user registered', time: '1 hour ago', icon: '👤', color: 'purple' },
    { id: 4, text: 'Product review added', time: '2 hours ago', icon: '⭐', color: 'yellow' },
  ];

  const quickStats = [
    { label: "Today's Orders", value: '42', change: '+12%', trend: 'up' },
    { label: 'Pending Returns', value: '7', change: '-2%', trend: 'down' },
    { label: 'Active Vouchers', value: '3', change: '+1', trend: 'up' },
    { label: 'Wishlist Items', value: '18', change: '+3', trend: 'up' },
  ];

  return (
    <aside className={`
      fixed md:static
      top-0 right-0
      h-full
      w-72 md:w-64
      bg-white
      border-l
      shadow-xl md:shadow-none
      z-50 md:z-auto
      transform transition-transform duration-500 ease-out
      ${isRightbarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
    `}>
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b md:hidden">
        <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        <button
          onClick={closeRightbar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Rightbar Content */}
      <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4.5rem)] overflow-y-auto p-4 md:p-6">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-6 pb-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          <button
            onClick={toggleRightbar}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Activities */}
        <div className="space-y-4 mb-8">
          {recentActivities.map((activity) => (
            <div 
              key={activity.id} 
              className="p-3 bg-white border rounded-xl hover:shadow-md transition-shadow duration-300 animate-slideIn"
              style={{ animationDelay: `${activity.id * 100}ms` }}
            >
              <div className="flex items-start">
                <div className={`w-8 h-8 rounded-lg ${activity.color === 'blue' ? 'bg-blue-100' : activity.color === 'green' ? 'bg-green-100' : activity.color === 'purple' ? 'bg-purple-100' : 'bg-yellow-100'} flex items-center justify-center mr-3`}>
                  <span className="text-lg">{activity.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border hover:shadow-md transition-shadow duration-300 animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <span className={`ml-2 text-xs font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Status */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white mr-3">
              💬
            </div>
            <div>
              <h5 className="font-semibold text-gray-800">Live Chat Support</h5>
              <p className="text-xs text-gray-600">Available 24/7</p>
            </div>
          </div>
          <button className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Start Chat
          </button>
        </div>
      </div>
    </aside>
  );
}