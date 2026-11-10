// components/vendor/LoadingState.tsx
import React from 'react';
import { Sparkles } from 'lucide-react';

if (typeof document !== 'undefined' && !document.getElementById('loading-state-style')) {
  const s = document.createElement('style');
  s.id = 'loading-state-style';
  s.textContent = `
    @keyframes ls-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes ls-pulse-icon {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.12); opacity: 0.75; }
    }
    .ls-shimmer-block {
      background: linear-gradient(90deg, #EEF2FF 0%, #E0E7FF 20%, #EEF2FF 40%, #EEF2FF 100%);
      background-size: 800px 100%;
      animation: ls-shimmer 1.6s linear infinite;
    }
    .ls-icon-pulse { animation: ls-pulse-icon 1.4s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

const LoadingState: React.FC = () => {
  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      className="max-w-4xl mx-auto p-8 bg-white rounded-2xl border border-[#E5EAF2] shadow-[0_2px_16px_rgba(79,70,229,0.08)]"
    >
      {/* Center icon */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="ls-icon-pulse w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', boxShadow: '0 8px 24px rgba(124,58,237,0.3)' }}
        >
          <Sparkles size={24} color="#fff" />
        </div>
        <p className="text-sm font-bold text-slate-500">Loading your data…</p>
      </div>

      {/* Shimmer skeleton blocks */}
      <div className="space-y-5">
        <div className="ls-shimmer-block h-6 rounded-lg w-1/3" />
        <div className="ls-shimmer-block h-4 rounded-lg w-2/3" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="ls-shimmer-block h-24 rounded-2xl" />
          <div className="ls-shimmer-block h-24 rounded-2xl" />
          <div className="ls-shimmer-block h-24 rounded-2xl" />
        </div>

        <div className="ls-shimmer-block h-40 rounded-2xl" />

        <div className="flex justify-end gap-3 pt-2">
          <div className="ls-shimmer-block h-11 w-28 rounded-xl" />
          <div className="ls-shimmer-block h-11 w-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default LoadingState;