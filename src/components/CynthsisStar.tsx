import React from 'react';

interface CynthsisStarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CynthsisStar: React.FC<CynthsisStarProps> = ({
  size = 'md',
  className = '',
}) => {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const starDimension = isLarge ? 56 : isSmall ? 28 : 44;
  const beamWidth = isLarge ? 'w-56 sm:w-72' : isSmall ? 'w-24' : 'w-44 sm:w-60';
  const verticalBeamHeight = isLarge ? 'h-24 sm:h-28' : isSmall ? 'h-10' : 'h-16 sm:h-20';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
      id="cynthsis-shining-star"
    >
      {/* 1. Outer Omnidirectional Blue Glowing Aura (हर जगह से शाइन) */}
      <div className="absolute inset-0 m-auto w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-radial from-cyan-400/35 via-blue-600/20 to-transparent blur-2xl animate-pulse pointer-events-none" />

      {/* 2. Rotating 360-degree Celestial Ray Flare */}
      <div className="absolute inset-0 m-auto w-24 h-24 sm:w-36 sm:h-36 flex items-center justify-center animate-[spin_20s_linear_infinite] opacity-60">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-cyan-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diagonal 45-deg shine rays */}
          <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          {/* 30 & 60-degree ambient sparkling micro-rays */}
          <line x1="30" y1="15" x2="70" y2="85" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.35" />
          <line x1="70" y1="15" x2="30" y2="85" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.35" />
        </svg>
      </div>

      {/* 3. The Pure White Light Beam Line (एक लाइन जानी चाहिए वाइट की) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${beamWidth} h-[2px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_12px_#ffffff,0_0_24px_#38bdf8] z-10`}
      />

      {/* 4. Vertical White & Cyan Accent Beam */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.5px] ${verticalBeamHeight} bg-gradient-to-b from-transparent via-white/90 to-transparent shadow-[0_0_10px_#ffffff,0_0_18px_#38bdf8] z-10`}
      />

      {/* 5. Blue Star SVG (ब्लू कलर का एक स्टार) */}
      <div className="relative z-20 flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]">
        <svg
          width={starDimension}
          height={starDimension}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-[0_0_15px_rgba(14,165,233,0.95)] drop-shadow-[0_0_30px_rgba(59,130,246,0.8)]"
        >
          <defs>
            {/* Primary Blue to Electric Cyan Gradient */}
            <linearGradient id="blueStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#0284c7" />
              <stop offset="70%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            {/* Inner Core Bright Specular Gradient */}
            <radialGradient id="starCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#7dd3fc" />
              <stop offset="75%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#1e40af" />
            </radialGradient>

            <filter id="starBloom" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Secondary 8-point Blue Star Background Points */}
          <path
            d="M 50 18 L 56 44 L 82 50 L 56 56 L 50 82 L 44 56 L 18 50 L 44 44 Z"
            fill="url(#blueStarGrad)"
            opacity="0.85"
            transform="rotate(45 50 50)"
          />

          {/* Primary 4-Point High-Faceted Blue Star Body */}
          <path
            d="M 50 5 Q 50 45 95 50 Q 50 55 50 95 Q 50 55 5 50 Q 50 45 50 5 Z"
            fill="url(#blueStarGrad)"
            stroke="#93c5fd"
            strokeWidth="0.8"
            filter="url(#starBloom)"
          />

          {/* Facet Highlighting (Left/Top facets lighter, Right/Bottom darker for 3D gem shine) */}
          <path
            d="M 50 5 Q 50 45 95 50 L 50 50 Z"
            fill="#60a5fa"
            opacity="0.5"
          />
          <path
            d="M 50 95 Q 50 55 5 50 L 50 50 Z"
            fill="#1e3a8a"
            opacity="0.6"
          />

          {/* Inner Diamond Shimmer */}
          <polygon
            points="50,26 62,50 50,74 38,50"
            fill="url(#starCoreGlow)"
            opacity="0.95"
          />

          {/* Sparkling White Core Specular Center */}
          <circle cx="50" cy="50" r="4.5" fill="#ffffff" className="animate-ping opacity-75" />
          <circle cx="50" cy="50" r="3.2" fill="#ffffff" />
        </svg>
      </div>

      {/* 6. Multi-directional ambient sparkle stars floating around */}
      <span className="absolute -top-3 left-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-ping" />
      <span className="absolute -bottom-2.5 right-6 w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_5px_#38bdf8] animate-pulse" />
      <span className="absolute top-2 -right-4 w-1.5 h-1.5 rounded-full bg-blue-300 shadow-[0_0_6px_#60a5fa]" />
      <span className="absolute bottom-1 -left-5 w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
    </div>
  );
};
