import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const SSLCommerzLogo: React.FC<LogoProps> = ({ className = "", size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="12" fill="#1A1A2E" />
    <text
      x="50"
      y="38"
      textAnchor="middle"
      fill="#00D4AA"
      fontSize="14"
      fontWeight="bold"
      fontFamily="system-ui, sans-serif"
    >
      SSL
    </text>
    <text
      x="50"
      y="58"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="10"
      fontWeight="600"
      fontFamily="system-ui, sans-serif"
    >
      COMMERZ
    </text>
    <rect x="20" y="68" width="60" height="4" rx="2" fill="#00D4AA" />
  </svg>
);

export const BkashLogo: React.FC<LogoProps> = ({ className = "", size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="12" fill="#E2136E" />
    <text
      x="50"
      y="42"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="18"
      fontWeight="bold"
      fontFamily="system-ui, sans-serif"
    >
      bKash
    </text>
    <text
      x="50"
      y="62"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="10"
      fontFamily="system-ui, sans-serif"
      opacity="0.9"
    >
      Mobile Banking
    </text>
  </svg>
);

export const NagadLogo: React.FC<LogoProps> = ({ className = "", size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="12" fill="#F6921E" />
    <text
      x="50"
      y="42"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="18"
      fontWeight="bold"
      fontFamily="system-ui, sans-serif"
    >
      নগদ
    </text>
    <text
      x="50"
      y="62"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="12"
      fontWeight="600"
      fontFamily="system-ui, sans-serif"
    >
      Nagad
    </text>
  </svg>
);

export const CashLogo: React.FC<LogoProps> = ({ className = "", size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="12" fill="#22C55E" />
    <circle cx="50" cy="45" r="20" fill="#16A34A" />
    <text
      x="50"
      y="52"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="24"
      fontWeight="bold"
      fontFamily="system-ui, sans-serif"
    >
      ৳
    </text>
    <text
      x="50"
      y="78"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="11"
      fontWeight="600"
      fontFamily="system-ui, sans-serif"
    >
      CASH
    </text>
  </svg>
);

export const BankTransferLogo: React.FC<LogoProps> = ({ className = "", size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="12" fill="#1E40AF" />
    <path
      d="M50 18L20 35V40H80V35L50 18Z"
      fill="#60A5FA"
    />
    <rect x="25" y="45" width="10" height="25" fill="#FFFFFF" />
    <rect x="45" y="45" width="10" height="25" fill="#FFFFFF" />
    <rect x="65" y="45" width="10" height="25" fill="#FFFFFF" />
    <rect x="20" y="72" width="60" height="8" rx="2" fill="#60A5FA" />
    <text
      x="50"
      y="92"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="8"
      fontWeight="600"
      fontFamily="system-ui, sans-serif"
    >
      BANK
    </text>
  </svg>
);

// Map slug to logo component
export const paymentLogoMap: Record<string, React.FC<LogoProps>> = {
  sslcommerz: SSLCommerzLogo,
  bkash: BkashLogo,
  nagad: NagadLogo,
  cash: CashLogo,
  bank_transfer: BankTransferLogo,
};
