// components/TopBar.tsx
import React from 'react';
import { Smartphone, Monitor, Send, Loader2 } from 'lucide-react';

interface TopBarProps {
  currentView: 'mobile' | 'desktop';
  onViewChange: (view: 'mobile' | 'desktop') => void;
  onPublish: () => void;
  /** Disables the button and shows a spinner while the publish request is
   *  in flight — prevents double-clicks firing the mutation twice. */
  isPublishing?: boolean;
}

// Restyled to match AddProductForm.tsx's palette (soft blue-grey surfaces,
// navy text, blue→purple accent, 'Plus Jakarta Sans') and made noticeably
// more compact — shorter bar, tighter paddings, smaller type — to match the
// same design pass applied to ConfigurationForm.tsx.
export const TopBar = ({ currentView, onViewChange, onPublish, isPublishing = false }: TopBarProps) => {
  const handleLogoClick = () => {
    // Navigate to homepage - you can replace with your routing logic
    window.location.href = '/';
  };

  return (
    <div
      className="w-full bg-white border-b border-[#E5EAF2] px-4 py-2 flex items-center justify-between"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", boxShadow: "0 1px 3px rgba(13,27,46,0.04)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center cursor-pointer group"
        onClick={handleLogoClick}
      >
        <div className="w-7 h-7 bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED] rounded-lg flex items-center justify-center mr-2.5 shadow-sm shadow-[#7C3AED]/25">
          <span className="text-white font-extrabold text-[12px]">F</span>
        </div>
        <span className="text-[15px] font-bold text-[#0D1B2E] tracking-[-0.2px] group-hover:text-[#1D4ED8] transition-colors">
          Finixmart
        </span>
      </div>

      {/* View Toggle Buttons */}
      <div className="flex items-center bg-[#F0F4FA] rounded-lg p-0.5">
        <button
          onClick={() => onViewChange('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
            currentView === 'mobile'
              ? 'bg-white text-[#1D4ED8] shadow-sm'
              : 'text-[#7A90AB] hover:text-[#3D5068]'
          }`}
        >
          <Smartphone size={15} />
          <span className="text-[12.5px] font-semibold">Mobile</span>
        </button>

        <button
          onClick={() => onViewChange('desktop')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
            currentView === 'desktop'
              ? 'bg-white text-[#1D4ED8] shadow-sm'
              : 'text-[#7A90AB] hover:text-[#3D5068]'
          }`}
        >
          <Monitor size={15} />
          <span className="text-[12.5px] font-semibold">Desktop</span>
        </button>
      </div>

      {/* Publish Button */}
      <button
        onClick={onPublish}
        disabled={isPublishing}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all text-white ${
          isPublishing
            ? "bg-[#9BAABB] cursor-not-allowed"
            : "bg-gradient-to-r from-[#1D4ED8] to-[#7C3AED] hover:brightness-110 shadow-sm shadow-[#7C3AED]/25"
        }`}
      >
        {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        <span className="text-[12.5px] font-bold">{isPublishing ? "Publishing…" : "Publish"}</span>
      </button>
    </div>
  );
};