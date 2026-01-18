import React from "react";

interface MadinahIconProps {
  className?: string;
  size?: number;
}

const MadinahIcon: React.FC<MadinahIconProps> = ({ className = "", size = 64 }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main Dome - Green Dome of the Prophet's Mosque */}
      <ellipse cx="32" cy="28" rx="16" ry="12" />
      
      {/* Dome base */}
      <rect x="16" y="28" width="32" height="28" />
      
      {/* Crescent on dome */}
      <path d="M32 12 L34 16 L32 14 L30 16 Z" />
      <circle cx="32" cy="10" r="2" />
      
      {/* Left Minaret */}
      <rect x="4" y="20" width="5" height="36" rx="1" />
      <circle cx="6.5" cy="18" r="3" />
      <polygon points="6.5,12 3.5,18 9.5,18" />
      <rect x="5" y="30" width="3" height="2" opacity="0.6" />
      <rect x="5" y="38" width="3" height="2" opacity="0.6" />
      
      {/* Right Minaret */}
      <rect x="55" y="20" width="5" height="36" rx="1" />
      <circle cx="57.5" cy="18" r="3" />
      <polygon points="57.5,12 54.5,18 60.5,18" />
      <rect x="56" y="30" width="3" height="2" opacity="0.6" />
      <rect x="56" y="38" width="3" height="2" opacity="0.6" />
      
      {/* Arches at base */}
      <path d="M18 56 Q22 48 26 56" fill="currentColor" opacity="0.5" />
      <path d="M26 56 Q32 46 38 56" fill="currentColor" opacity="0.5" />
      <path d="M38 56 Q42 48 46 56" fill="currentColor" opacity="0.5" />
      
      {/* Door */}
      <rect x="28" y="42" width="8" height="14" rx="4" fill="currentColor" opacity="0.6" />
    </svg>
  );
};

export default MadinahIcon;
