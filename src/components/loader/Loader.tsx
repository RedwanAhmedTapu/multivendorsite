'use client';

import { useEffect, useState } from 'react';

interface FinixmartLoaderProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

export default function FinixmartLoader({ 
  onLoadingComplete, 
  duration = 3500 
}: FinixmartLoaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        setIsVisible(false);
        onLoadingComplete?.();
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center  transition-opacity duration-300`}
      style={{ opacity: opacity / 100 }}
    >
      <div className="relative w-[400px] h-[200px] max-w-[90vw]">
        <svg
          viewBox="0 0 400 200"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <style>{`
            @keyframes drawText {
              0% {
                stroke-dashoffset: 1000;
              }
              80% {
                stroke-dashoffset: 0;
                fill: transparent;
              }
              100% {
                stroke-dashoffset: 0;
                fill: #20c997;
              }
            }

            @keyframes drawCircle {
              0% {
                stroke-dashoffset: 314;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }

            @keyframes fadeDots {
              0% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }

            .loader-text {
              font-size: 48px;
              font-weight: 700;
              letter-spacing: 2px;
              fill: none;
              stroke: #20c997;
              stroke-width: 2;
              stroke-dasharray: 1000;
              stroke-dashoffset: 1000;
              animation: drawText 3s ease-in-out forwards;
            }

            .loader-circle {
              fill: none;
              stroke: #20c997;
              stroke-width: 2;
              stroke-dasharray: 314;
              stroke-dashoffset: 314;
              animation: drawCircle 2s ease-in-out 0.5s forwards;
            }

            .loader-dots {
              fill: #20c997;
              opacity: 0;
              animation: fadeDots 1.5s ease-in-out 1.5s forwards;
            }

            @media (max-width: 768px) {
              .loader-text {
                font-size: 36px;
              }
            }
          `}</style>

          {/* Background circle */}
          <circle cx="200" cy="100" r="50" className="loader-circle" />

          {/* Text path */}
          <text x="200" y="110" textAnchor="middle" className="loader-text">
            Finixmart
          </text>

          {/* Decorative dots */}
          <circle cx="150" cy="70" r="4" className="loader-dots" />
          <circle cx="170" cy="60" r="3" className="loader-dots" />
          <circle cx="230" cy="60" r="3" className="loader-dots" />
          <circle cx="250" cy="70" r="4" className="loader-dots" />
          <circle cx="140" cy="130" r="3" className="loader-dots" />
          <circle cx="260" cy="130" r="3" className="loader-dots" />
        </svg>
      </div>
    </div>
  );
}