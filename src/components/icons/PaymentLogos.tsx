import React from 'react';
import sslcommerzLogo from "@/assets/payment/sslcommerz-logo.png";
import bkashLogo from "@/assets/payment/bkash-logo.svg";
import nagadLogo from "@/assets/payment/nagad-logo.svg";

export const BkashLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <img 
    src={bkashLogo} 
    alt="bKash" 
    className={`object-contain ${className}`}
  />
);

export const NagadLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <img 
    src={nagadLogo} 
    alt="Nagad" 
    className={`object-contain ${className}`}
  />
);

export const SSLCommerzLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <img 
    src={sslcommerzLogo} 
    alt="SSLCommerz" 
    className={`object-contain ${className}`}
  />
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
    nagad: { bg: 'bg-[#F7941D]', text: 'Nagad', textColor: 'text-white' },
    sslcommerz: { bg: 'bg-[#3366CC]', text: 'SSL', textColor: 'text-white' },
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
