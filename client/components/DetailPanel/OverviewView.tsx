import React, { useMemo } from 'react';
import { GearItemWithCalculated } from '../../utils/types';
import { COLORS } from '../../utils/designSystem';

interface OverviewViewProps {
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
}

// formatPrice関数をコンポーネント外に移動してmemo化の恩恵を受ける
const formatPrice = (priceCents?: number) => {
  if (!priceCents) return '-';
  const price = priceCents / 100;
  return `¥${Math.round(price).toLocaleString()}`;
};

const OverviewView: React.FC<OverviewViewProps> = ({ items, viewMode }) => {
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

    const totalWeight = items.reduce((sum, item) => sum + (item.totalWeight || 0), 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const shortageCount = items.reduce((sum, item) => sum + (item.shortage || 0), 0);
    const highPriorityCount = items.filter(item => item.priority === 1).length;

    let maxWeightItem = items[0];
    let maxPriceItem = items[0];

    items.forEach(item => {
      if ((item.totalWeight || 0) > (maxWeightItem.totalWeight || 0)) {
        maxWeightItem = item;
      }
      if ((item.totalPrice || 0) > (maxPriceItem.totalPrice || 0)) {
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
  }, [items]);

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full w-full min-w-0">
      {/* 統計 */}
      <div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-500">Weight</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalWeight}g</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-500">Price</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(stats.totalPrice)}</span>
          </div>
          {stats.highPriorityCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-500">Priority 1</span>
              <span className="font-semibold" style={{ color: COLORS.danger }}>{stats.highPriorityCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* 詳細統計 */}
      <div>
        <div className="space-y-2 text-xs">
          {stats.maxWeightItem && (
            <div>
              <div className="text-gray-500 dark:text-gray-500">Heaviest</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {stats.maxWeightItem.name} - {stats.maxWeightItem.totalWeight}g
              </div>
            </div>
          )}
          {stats.maxPriceItem && (
            <div>
              <div className="text-gray-500 dark:text-gray-500">Most Expensive</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {stats.maxPriceItem.name} - {formatPrice(stats.maxPriceItem.totalPrice)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(OverviewView);
