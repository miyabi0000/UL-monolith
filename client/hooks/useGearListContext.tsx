import React, { createContext, useContext } from 'react';
import type { QuantityDisplayMode } from '../utils/types';
import type { Currency } from '../components/GearTable/TableHeader';

interface GearListContextValue {
  quantityDisplayMode: QuantityDisplayMode;
  onQuantityDisplayModeChange: () => void;
  currency: Currency;
  onCurrencyChange: () => void;
  /** Compare モード時の bulk 選択 checkbox を表示するか */
  showCheckboxes: boolean;
  /** 現在 inline 編集中の行 ID (1 行だけ編集可能)。null なら編集中なし */
  editingItemId: string | null;
  /** 行の ⋯ メニューから Edit を押した時の callback */
  onStartEdit: (itemId: string) => void;
  /** 編集を Save (変更は即時保存済みなので state をクリアするのみ) */
  onSaveEdit: () => void;
  /** 編集を Cancel (changedFields をロールバックしつつ state をクリア) */
  onCancelEdit: () => void;
  /** 行の ⋯ メニューから Delete を押した時の callback */
  onDeleteItem: (itemId: string) => void;
  activePackName?: string;
  onAddAllToPack?: () => void;
  isAllVisibleInPack?: boolean;
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
