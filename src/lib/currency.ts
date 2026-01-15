// Currency configuration for BDT (Bangladeshi Taka)
export const CURRENCY = {
  code: "BDT",
  symbol: "৳",
  name: "Bangladeshi Taka",
  locale: "bn-BD",
};

/**
 * Format a number as BDT currency
 */
export const formatCurrency = (amount: number): string => {
  return `${CURRENCY.symbol}${amount.toLocaleString("en-BD")}`;
};

/**
 * Format a number as BDT currency with full label
 */
export const formatCurrencyFull = (amount: number): string => {
  return `${CURRENCY.symbol}${amount.toLocaleString("en-BD")} ${CURRENCY.code}`;
};
