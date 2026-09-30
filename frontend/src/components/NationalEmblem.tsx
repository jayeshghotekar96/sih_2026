import React from 'react';

export const NationalEmblem: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Stylized Lion Capital / Emblem representation */}
      <svg
        viewBox="0 0 100 120"
        fill="currentColor"
        className="w-full h-full text-slate-700"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ashoka Lion Silhouette */}
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
          {/* Top Lions */}
          <path d="M 40 15 Q 50 10 60 15 Q 65 25 60 35 Q 50 40 40 35 Q 35 25 40 15 Z" fill="currentColor" opacity="0.85" />
          <path d="M 22 20 Q 30 15 38 25 Q 32 38 22 35 Q 18 28 22 20 Z" fill="currentColor" opacity="0.75" />
          <path d="M 78 20 Q 70 15 62 25 Q 68 38 78 35 Q 82 28 78 20 Z" fill="currentColor" opacity="0.75" />
          
          {/* Main Pillar Abacus */}
          <rect x="20" y="45" width="60" height="8" rx="2" fill="currentColor" opacity="0.9" />
          
          {/* Ashoka Chakra Wheel */}
          <circle cx="50" cy="65" r="10" strokeWidth="2" />
          <circle cx="50" cy="65" r="2" fill="currentColor" />
          {/* Spokes */}
          <line x1="50" y1="55" x2="50" y2="75" strokeWidth="1" />
          <line x1="40" y1="65" x2="60" y2="65" strokeWidth="1" />
          <line x1="43" y1="58" x2="57" y2="72" strokeWidth="1" />
          <line x1="57" y1="58" x2="43" y2="72" strokeWidth="1" />

          {/* Horse and Bull silhouettes */}
          <path d="M 25 68 Q 30 62 35 68" strokeWidth="2" />
          <path d="M 65 68 Q 70 62 75 68" strokeWidth="2" />

          {/* Lower Base */}
          <path d="M 15 82 L 85 82 L 78 92 L 22 92 Z" fill="currentColor" opacity="0.9" />
        </g>
        <text
          x="50"
          y="108"
          fontSize="9"
          fontWeight="bold"
          fontFamily="serif"
          textAnchor="middle"
          fill="currentColor"
        >
          सत्यमेव जयते
        </text>
      </svg>
    </div>
  );
};
