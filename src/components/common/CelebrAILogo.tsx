import React from 'react';

interface CelebrAILogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}

export const CelebrAILogoIcon: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden shrink-0 bg-stone-900 dark:bg-stone-100 flex items-center justify-center ${sizeClasses[size]} ${className}`}
      role="img"
      aria-label="CelebrAI Logo"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 text-white dark:text-stone-900"
      >
        {/* Crisp Geometric Monogram C + Celebration Ray */}
        <path
          d="M 23 9 C 19 5.5, 11 6, 8 11 C 4.5 17, 6 24, 12 26.5 C 17 28.5, 22.5 26, 24 21.5 C 24.5 19.5, 21.5 19, 20.5 20.5 C 18.5 23.5, 14 24, 11 21.5 C 7.5 18.5, 7.5 13, 11 10 C 14.5 7.5, 19.5 8, 22 10.5 C 23 11.5, 24.5 10.5, 23 9 Z"
          fill="currentColor"
        />
        {/* Modern Nova Diamond */}
        <polygon
          points="20,11 22,7 24,11 28,13 24,15 22,19 20,15 16,13"
          fill="#ec7048"
        />
      </svg>
    </div>
  );
};

export const CelebrAILogo: React.FC<CelebrAILogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 shrink-0 select-none ${className}`}>
      <CelebrAILogoIcon size={size} />

      {showWordmark && (
        <span className="font-display font-semibold text-xl tracking-tight text-stone-900 dark:text-stone-100">
          Celebr<span className="text-brand-700 dark:text-brand-300">AI</span>
        </span>
      )}
    </div>
  );
};
