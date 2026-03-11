import React, { createContext, useContext } from 'react';
import type { QuantityDisplayMode } from '../utils/types';
import type { Currency } from '../components/GearTable/TableHeader';

interface GearListContextValue {
  quantityDisplayMode: QuantityDisplayMode;
  onQuantityDisplayModeChange: () => void;
  currency: Currency;
  onCurrencyChange: () => void;
  showCheckboxes: boolean;
  isEditable: boolean;
}

const GearListContext = createContext<GearListContextValue | null>(null);

interface GearListProviderProps {
  value: GearListContextValue;
  children: React.ReactNode;
}

export function GearListProvider({ value, children }: GearListProviderProps) {
  return <GearListContext.Provider value={value}>{children}</GearListContext.Provider>;
}

export function useGearListContext(): GearListContextValue {
  const ctx = useContext(GearListContext);
  if (!ctx) throw new Error('useGearListContext must be used within GearListProvider');
  return ctx;
}
