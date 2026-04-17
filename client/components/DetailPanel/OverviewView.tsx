import React, { useMemo } from 'react';
import { GearItemWithCalculated } from '../../utils/types';
import { formatPrice } from '../../utils/formatters';
import ItemListCard from './ItemListCard';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';
import { QuantityDisplayMode } from '../../utils/types';

interface OverviewViewProps {
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  onItemClick?: (itemId: string) => void;
  quantityDisplayMode: QuantityDisplayMode;
}

const OverviewView: React.FC<OverviewViewProps> = ({ items, viewMode, onItemClick, quantityDisplayMode }) => {
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
  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        totalWeight: 0,
        totalPrice: 0,
        itemCount: 0,
        shortageCount: 0,
        avgWeight: 0,
        maxWeightItem: null as GearItemWithCalculated | null,
        maxPriceItem: null as GearItemWithCalculated | null,
        highPriorityCount: 0,
      };
    }

    const totalWeight = items.reduce((sum, item) => sum + (item.weightGrams || 0) * getQuantityForDisplayMode(item, quantityDisplayMode), 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.priceCents || 0) * getQuantityForDisplayMode(item, quantityDisplayMode), 0);
    const shortageCount = items.reduce((sum, item) => sum + (item.shortage || 0), 0);
    const highPriorityCount = items.filter(item => item.priority === 1).length;

    let maxWeightItem = items[0];
    let maxPriceItem = items[0];

    items.forEach(item => {
      const itemWeight = (item.weightGrams || 0) * getQuantityForDisplayMode(item, quantityDisplayMode);
      const maxWeight = (maxWeightItem.weightGrams || 0) * getQuantityForDisplayMode(maxWeightItem, quantityDisplayMode);
      if (itemWeight > maxWeight) {
        maxWeightItem = item;
      }
      const itemPrice = (item.priceCents || 0) * getQuantityForDisplayMode(item, quantityDisplayMode);
      const maxPrice = (maxPriceItem.priceCents || 0) * getQuantityForDisplayMode(maxPriceItem, quantityDisplayMode);
      if (itemPrice > maxPrice) {
        maxPriceItem = item;
      }
    });

    return {
      totalWeight,
      totalPrice,
      itemCount: items.length,
      shortageCount,
      avgWeight: Math.round(totalWeight / items.length),
      maxWeightItem,
      maxPriceItem,
      highPriorityCount,
    };
  }, [items, quantityDisplayMode]);

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full w-full min-w-0">
      {/* 統計 */}
      <div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Weight:</span>
            <span className="font-semibold text-gray-900">{stats.totalWeight}g</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Price:</span>
            <span className="font-semibold text-gray-900">{formatPrice(stats.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* 区切り線 */}
      <div className="border-b border-gray-200" />

      {/* アイテムリスト */}
      <div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-2">
          <span>ITEMS</span>
          <span className="font-semibold text-gray-900">{stats.itemCount}</span>
        </div>
        <div className="space-y-1.5">
          {sortedItems.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No items
            </p>
          ) : (
            sortedItems.map(item => {
              const total = viewMode === 'cost' ? stats.totalPrice : stats.totalWeight;
              const itemValue = getItemValue(item);
              const percentage = total > 0
                ? Math.round((itemValue / total) * 100)
                : 0;
              return (
                <ItemListCard
                  key={item.id}
                  item={item}
                  percentage={percentage}
                  quantityDisplayMode={quantityDisplayMode}
                  viewMode={viewMode}
                  onClick={(itemId) => onItemClick?.(itemId)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(OverviewView);
