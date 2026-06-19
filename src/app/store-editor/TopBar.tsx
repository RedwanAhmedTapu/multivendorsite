// components/TopBar.tsx
import React from 'react';
import { Smartphone, Monitor, Send } from 'lucide-react';

interface TopBarProps {
  currentView: 'mobile' | 'desktop';
  onViewChange: (view: 'mobile' | 'desktop') => void;
  onPublish: () => void;
}

export const TopBar = ({ currentView, onViewChange, onPublish }: TopBarProps) => {
  const handleLogoClick = () => {
    // Navigate to homepage - you can replace with your routing logic
    window.location.href = '/';
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Logo */}
      <div 
        className="flex items-center cursor-pointer group"
        onClick={handleLogoClick}
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <span className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
          Finixmart
        </span>
      </div>

      {/* View Toggle Buttons */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onViewChange('mobile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            currentView === 'mobile'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Smartphone size={18} />
          <span className="text-sm font-medium">Mobile</span>
        </button>
        
        <button
          onClick={() => onViewChange('desktop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            currentView === 'desktop'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Monitor size={18} />
          <span className="text-sm font-medium">Desktop</span>
        </button>
      </div>

      {/* Publish Button */}
      <button
        onClick={onPublish}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors shadow-sm"
      >
        <Send size={16} />
        <span className="font-medium">Publish</span>
      </button>
    </div>
  );
};