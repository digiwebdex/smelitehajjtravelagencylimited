import React from 'react';

export const BkashLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 200" 
    className={className}
    fill="none"
  >
    <circle cx="100" cy="100" r="95" fill="#E2136E"/>
    <path 
      d="M65 60h30c15 0 25 10 25 25s-10 25-25 25H80v30H65V60zm15 40h15c6 0 10-4 10-10s-4-10-10-10H80v20z" 
      fill="white"
    />
    <path 
      d="M110 85h25l15 35h.5L165 85h25l-30 55h-20L110 85z" 
      fill="white"
    />
  </svg>
);

export const NagadLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 200 80" 
    className={className}
    fill="none"
  >
    <rect width="200" height="80" rx="8" fill="#FF6B00"/>
    <text 
      x="100" 
      y="50" 
      textAnchor="middle" 
      fill="white" 
      fontSize="36" 
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      Nagad
    </text>
  </svg>
);

export const SSLCommerzLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 240 80" 
    className={className}
    fill="none"
  >
    <rect width="240" height="80" rx="8" fill="#00B050"/>
    <text 
      x="120" 
      y="35" 
      textAnchor="middle" 
      fill="white" 
      fontSize="20" 
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      SSLCommerz
    </text>
    <text 
      x="120" 
      y="55" 
      textAnchor="middle" 
      fill="white" 
      fontSize="12"
      fontFamily="Arial, sans-serif"
    >
      Payment Gateway
    </text>
  </svg>
);

// Simple colored badges for payment methods
export const PaymentMethodBadge = ({ 
  method, 
  className = "" 
}: { 
  method: 'bkash' | 'nagad' | 'sslcommerz' | 'bank_transfer' | 'cash';
  className?: string;
}) => {
  const configs = {
    bkash: { bg: 'bg-[#E2136E]', text: 'bKash', textColor: 'text-white' },
    nagad: { bg: 'bg-[#FF6B00]', text: 'Nagad', textColor: 'text-white' },
    sslcommerz: { bg: 'bg-[#00B050]', text: 'SSL', textColor: 'text-white' },
    bank_transfer: { bg: 'bg-blue-600', text: 'Bank', textColor: 'text-white' },
    cash: { bg: 'bg-gray-600', text: 'Cash', textColor: 'text-white' },
  };

  const config = configs[method] || configs.cash;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.textColor} ${className}`}>
      {config.text}
    </span>
  );
};

export default {
  BkashLogo,
  NagadLogo,
  SSLCommerzLogo,
  PaymentMethodBadge,
};