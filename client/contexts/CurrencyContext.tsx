import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Currency } from '../utils/formatters';

const STORAGE_KEY = 'ul_currency_v1';

// ブラウザ言語から既定通貨を推定（米国系ロケールは USD、それ以外は JPY）
const detectDefaultCurrency = (): Currency => {
  if (typeof navigator === 'undefined') return 'JPY';
  const lang = (navigator.language || '').toLowerCase();
  if (lang.startsWith('en-us') || lang.startsWith('en-ca')) {
    return 'USD';
  }
  return 'JPY';
};

const readStoredCurrency = (): Currency => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'JPY' || raw === 'USD') return raw;
  } catch {
    // localStorage が使えない環境はフォールバック
  }
  return detectDefaultCurrency();
};

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => readStoredCurrency());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // 保存失敗は無視（プライベートブラウジング等）
    }
  }, [currency]);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
};
