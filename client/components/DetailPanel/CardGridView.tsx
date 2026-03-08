import React, { useMemo } from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';

interface CardGridViewProps {
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  quantityDisplayMode: QuantityDisplayMode;
  selectedItemId?: string | null;
  disableSort?: boolean;
}

const CardGridView: React.FC<CardGridViewProps> = ({ items, viewMode, quantityDisplayMode, selectedItemId, disableSort }) => {
  const getItemValue = (item: GearItemWithCalculated) => {
    const quantity = getQuantityForDisplayMode(item, quantityDisplayMode);
    return viewMode === 'cost'
      ? (item.priceCents || 0) * quantity
      : (item.weightGrams || 0) * quantity;
  };

  // アイテムを表示値（weight/cost）昇順でソート（編集中は無効）
  const sortedItems = useMemo(() => {
    if (disableSort) return items;
    return [...items].sort((a, b) => getItemValue(a) - getItemValue(b));
  }, [items, quantityDisplayMode, viewMode, disableSort]);

  return (
    <div className="p-2 sm:p-3 space-y-2 w-full min-w-0">
      {/* アイテムグリッド */}
      <div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-2">
          <span>ITEMS</span>
          <span className="font-semibold text-gray-900">{items.length}</span>
        </div>
        {sortedItems.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            No items
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {sortedItems.map(item => {
              const imageUrl = item.imageUrl || null;
              const isHighlighted = selectedItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`aspect-square relative overflow-hidden bg-white transition-all flex items-center justify-center ${
                    isHighlighted
                      ? 'ring-2 ring-gray-500/70'
                      : ''
                  }`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-1 bg-white">
                      <span className="text-[9px] text-gray-400 text-center leading-tight line-clamp-2">
                        {item.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CardGridView);
