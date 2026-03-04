import React, { useMemo } from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';

interface CardGridViewProps {
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  quantityDisplayMode: QuantityDisplayMode;
  selectedItemId?: string | null;
}

const CardGridView: React.FC<CardGridViewProps> = ({ items, viewMode, quantityDisplayMode, selectedItemId }) => {
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
        <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-2">
          <span>ITEMS</span>
          <span className="font-semibold text-gray-900">{items.length}</span>
        </div>
        {sortedItems.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            No items
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-1.5">
            {sortedItems.map(item => {
              const imageUrl = item.imageUrl || null;
              const isHighlighted = selectedItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`aspect-square relative overflow-hidden rounded-md border transition-all flex items-center justify-center ${
                    isHighlighted
                      ? 'border-gray-500 ring-2 ring-gray-400/50 shadow-md'
                      : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                  } bg-white`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-1">
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
