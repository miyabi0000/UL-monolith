import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { WeightUnit } from '../utils/weightUnit';

const STORAGE_KEY = 'ul_weight_unit_v1';

// ブラウザ言語から既定単位を推定（米国系ロケールは oz、それ以外は g）
const detectDefaultUnit = (): WeightUnit => {
  if (typeof navigator === 'undefined') return 'g';
  const lang = (navigator.language || '').toLowerCase();
  // 米国・リベリア・ミャンマー（imperial 圏）
  if (lang.startsWith('en-us') || lang.startsWith('en-lr') || lang.startsWith('my')) {
    return 'oz';
  }
  return 'g';
};

const readStoredUnit = (): WeightUnit => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'oz' || raw === 'g') return raw;
  } catch {
    // localStorage が使えない環境はフォールバック
  }
  return detectDefaultUnit();
};

interface WeightUnitContextValue {
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
}

const WeightUnitContext = createContext<WeightUnitContextValue | undefined>(undefined);

export const WeightUnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unit, setUnitState] = useState<WeightUnit>(() => readStoredUnit());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, unit);
    } catch {
      // 保存失敗は無視（プライベートブラウジング等）
    }
  }, [unit]);

  const setUnit = useCallback((next: WeightUnit) => {
    setUnitState(next);
  }, []);

  return (
    <WeightUnitContext.Provider value={{ unit, setUnit }}>
      {children}
    </WeightUnitContext.Provider>
  );
};

export const useWeightUnit = (): WeightUnitContextValue => {
  const ctx = useContext(WeightUnitContext);
  if (!ctx) {
    throw new Error('useWeightUnit must be used within a WeightUnitProvider');
  }
  return ctx;
};
