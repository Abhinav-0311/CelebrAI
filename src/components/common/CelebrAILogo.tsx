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
      className={`relative rounded-xl overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105 border border-amber-900/20 dark:border-amber-400/20 shadow-sm ${sizeClasses[size]} ${className}`}
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
          {/* Deep Charcoal / Obsidian Canvas */}
          <linearGradient id="logo-bg-atelier" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1C1917" />
            <stop offset="50%" stopColor="#18181B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Champagne Gold & Warm Amber Ribbon */}
          <linearGradient id="logo-ribbon-atelier" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="40%" stopColor="#EAB308" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Radiant Ivory Starburst */}
          <linearGradient id="logo-star-atelier" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          <filter id="logo-subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Squircle Container */}
        <rect width="64" height="64" rx="14" fill="url(#logo-bg-atelier)" />
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="13"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1"
          strokeOpacity="0.35"
        />

        {/* Architectural Atelier Framing Notch */}
        <line x1="8" y1="8" x2="14" y2="8" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="8" y1="8" x2="8" y2="14" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="56" y1="56" x2="50" y2="56" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="56" y1="56" x2="56" y2="50" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.4" />

        {/* Celebration Ribbon Arc (Fluid 'C' Monogram) */}
        <path
          d="M 46 16.5 C 38 9, 21 10, 14 21 C 8 30.5, 11 44, 23 50 C 33 55, 45 49, 47 41.5 C 47.8 38.5, 43.5 37, 41.5 39 C 37 43.5, 28.5 45, 21.5 41 C 15.5 37.5, 14 29.5, 18 22.5 C 22.5 15, 34 13.5, 41.5 18.5 C 43.5 20, 47.5 18.5, 46 16.5 Z"
          fill="url(#logo-ribbon-atelier)"
          filter="url(#logo-subtle-glow)"
        />

        {/* Radiant Nova Star (Center) */}
        <path
          d="M 33 16 C 33 23, 36 26.5, 43 27 C 44.5 27.2, 44.5 30.8, 43 31 C 36 31.5, 33 35, 33 42 C 32.5 43.5, 29.5 43.5, 29 42 C 29 35, 26 31.5, 19 31 C 17.5 30.8, 17.5 27.2, 19 27 C 26 26.5, 29 23, 29 16 C 29.5 14.5, 32.5 14.5, 33 16 Z"
          fill="url(#logo-star-atelier)"
          filter="url(#logo-subtle-glow)"
        />

        {/* Center Point */}
        <circle cx="31" cy="29" r="2.4" fill="#FFFFFF" />

        {/* Refined Gold Sparkles */}
        <path
          d="M 50 10 C 50 12, 51.5 13.5, 53.5 14 C 51.5 14.5, 50 16, 50 18 C 50 16, 48.5 14.5, 46.5 14 C 48.5 13.5, 50 12, 50 10 Z"
          fill="#FEF3C7"
        />
        <circle cx="17" cy="16" r="1.5" fill="#FDE68A" fillOpacity="0.8" />
        <circle cx="50" cy="46" r="1.6" fill="#F59E0B" fillOpacity="0.8" />
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
            <span className="font-serif font-black text-lg sm:text-xl tracking-tight text-stone-900 dark:text-stone-100 flex items-center">
              Celebr
              <span className="text-amber-600 dark:text-amber-400 font-sans font-black ml-0.5">
                AI
              </span>
            </span>
            <span className="sr-only">CelebrAI</span>

            {showBadge && (
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hidden sm:inline-block">
                Atelier
              </span>
            )}
          </div>

          {showSubtitle && (
            <p className="text-[10px] sm:text-[10.5px] font-mono tracking-tight text-stone-500 dark:text-stone-400 hidden lg:block uppercase">
              Intelligent Event Architect
            </p>
          )}
        </div>
      )}
    </div>
  );
};
