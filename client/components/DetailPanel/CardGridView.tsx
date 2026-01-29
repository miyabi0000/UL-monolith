import React, { useMemo } from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';

interface CardGridViewProps {
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  onItemClick?: (itemId: string) => void;
  quantityDisplayMode: QuantityDisplayMode;
}

const CardGridView: React.FC<CardGridViewProps> = ({ items, viewMode, onItemClick, quantityDisplayMode }) => {
  const getItemValue = (item: GearItemWithCalculated) => {
    const quantity = getQuantityForDisplayMode(item, quantityDisplayMode);
    return viewMode === 'cost'
      ? (item.priceCents || 0) * quantity
      : (item.weightGrams || 0) * quantity;
  };

  // アイテムを表示値（weight/cost）昇順でソート
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => getItemValue(a) - getItemValue(b));
  }, [items, quantityDisplayMode, viewMode]);

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full w-full min-w-0">
      {/* アイテムグリッド */}
      <div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          <span>ITEMS</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{items.length}</span>
        </div>
        {sortedItems.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
            No items
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-px bg-gray-200 dark:bg-gray-700">
            {sortedItems.map(item => {
              const imageUrl = item.imageUrl || 'https://via.placeholder.com/100x100?text=No+Image';

              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick?.(item.id)}
                  className="aspect-square relative overflow-hidden bg-white dark:bg-gray-900
                    hover:opacity-80 transition-opacity flex items-center justify-center"
                >
                  {/* 画像 */}
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="w-[90%] h-[90%] object-contain"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CardGridView);
