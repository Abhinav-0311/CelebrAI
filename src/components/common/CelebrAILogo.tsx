import React from 'react';

interface CelebrAILogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const CelebrAILogoIcon: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-lg shadow-brand-500/25 shrink-0 transition-transform duration-300 hover:scale-105 ${sizeClasses[size]} ${className}`}
      role="img"
      aria-label="CelebrAI Logo"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="45%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#c026d3" />
          </linearGradient>

          <linearGradient id="logo-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="35%" stopColor="#ec4899" />
            <stop offset="70%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <linearGradient id="logo-star" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle Emblem Container */}
        <rect width="64" height="64" rx="16" fill="url(#logo-bg)" />
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="15"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />

        {/* Celebration Ribbon Arc (Fluid 'C' Monogram) */}
        <path
          d="M 46 16.5 C 38 9, 21 10, 14 21 C 8 30.5, 11 44, 23 50 C 33 55, 45 49, 47 41.5 C 47.8 38.5, 43.5 37, 41.5 39 C 37 43.5, 28.5 45, 21.5 41 C 15.5 37.5, 14 29.5, 18 22.5 C 22.5 15, 34 13.5, 41.5 18.5 C 43.5 20, 47.5 18.5, 46 16.5 Z"
          fill="url(#logo-ribbon)"
          filter="url(#logo-glow)"
        />

        {/* Radiant AI Nova Star (Center) */}
        <path
          d="M 33 16 C 33 23, 36 26.5, 43 27 C 44.5 27.2, 44.5 30.8, 43 31 C 36 31.5, 33 35, 33 42 C 32.5 43.5, 29.5 43.5, 29 42 C 29 35, 26 31.5, 19 31 C 17.5 30.8, 17.5 27.2, 19 27 C 26 26.5, 29 23, 29 16 C 29.5 14.5, 32.5 14.5, 33 16 Z"
          fill="url(#logo-star)"
          filter="url(#logo-glow)"
        />

        {/* Specular Shimmer Center Point */}
        <circle cx="31" cy="29" r="2.8" fill="#ffffff" />

        {/* Celebration Champagne Accents */}
        <path
          d="M 50 8 C 50 11, 51.5 12.5, 54 13 C 51.5 13.5, 50 15, 50 18 C 50 15, 48.5 13.5, 46 13 C 48.5 12.5, 50 11, 50 8 Z"
          fill="#fef08a"
        />
        <circle cx="50" cy="13" r="1" fill="#ffffff" />

        {/* Floating Micro Spheres (Effervescence) */}
        <circle cx="16" cy="14" r="2" fill="#38bdf8" fillOpacity="0.9" />
        <circle cx="51" cy="48" r="2.2" fill="#fb7185" fillOpacity="0.9" />
        <circle cx="28" cy="10" r="1.2" fill="#fef08a" fillOpacity="0.8" />
        <circle cx="48" cy="33" r="1.4" fill="#a7f3d0" fillOpacity="0.8" />
      </svg>
    </div>
  );
};

export const CelebrAILogo: React.FC<CelebrAILogoProps> = ({
  size = 'md',
  showWordmark = true,
  showSubtitle = true,
  showBadge = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 shrink-0 select-none ${className}`}>
      <CelebrAILogoIcon size={size} />

      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center">
              Celebr
              <span className="bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 bg-clip-text text-transparent drop-shadow-sm font-black">
                AI
              </span>
            </span>

            {showBadge && (
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-100 to-fuchsia-100 dark:from-brand-950 dark:to-fuchsia-950 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60 shadow-xs hidden sm:inline-block">
                v1.0
              </span>
            )}
          </div>

          {showSubtitle && (
            <p className="text-[10.5px] sm:text-[11px] font-medium tracking-tight text-slate-500 dark:text-slate-400 hidden lg:block">
              Intelligent Celebration & Event Architect
            </p>
          )}
        </div>
      )}
    </div>
  );
};
