import React from "react";

interface MakkahIconProps {
  className?: string;
  size?: number;
}

const MakkahIcon: React.FC<MakkahIconProps> = ({ className = "", size = 64 }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Kaaba Structure */}
      <rect x="12" y="20" width="40" height="36" rx="2" />
      
      {/* Kiswa decoration band */}
      <rect x="12" y="32" width="40" height="8" fill="currentColor" opacity="0.7" />
      
      {/* Door */}
      <rect x="26" y="38" width="12" height="18" rx="1" fill="currentColor" opacity="0.5" />
      
      {/* Minarets */}
      <rect x="4" y="24" width="4" height="32" rx="1" />
      <circle cx="6" cy="22" r="3" />
      <polygon points="6,16 3,22 9,22" />
      
      <rect x="56" y="24" width="4" height="32" rx="1" />
      <circle cx="58" cy="22" r="3" />
      <polygon points="58,16 55,22 61,22" />
      
      {/* Hajar al-Aswad corner indicator */}
      <circle cx="14" cy="54" r="2" fill="currentColor" opacity="0.8" />
    </svg>
  );
};

export default MakkahIcon;
