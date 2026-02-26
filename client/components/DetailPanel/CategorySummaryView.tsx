import React, { useMemo } from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { COLORS } from '../../utils/designSystem';
import { formatPrice } from '../../utils/formatters';
import ItemListCard from './ItemListCard';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';
import CategoryBadge from '../ui/CategoryBadge';

interface CategorySummaryViewProps {
  categoryName: string;
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  onItemClick: (itemId: string) => void;
  quantityDisplayMode: QuantityDisplayMode;
}

const CategorySummaryView: React.FC<CategorySummaryViewProps> = ({
  categoryName,
  items,
  viewMode,
  onItemClick,
  quantityDisplayMode,
}) => {
  const getItemValue = (item: GearItemWithCalculated) => {
    const quantity = getQuantityForDisplayMode(item, quantityDisplayMode);
    return viewMode === 'cost'
      ? (item.priceCents || 0) * quantity
      : (item.weightGrams || 0) * quantity;
  };

  // カテゴリに属するアイテムをフィルタして重さ昇順でソート
  const categoryItems = useMemo(() => {
    return items
      .filter(item => item.category?.name === categoryName)
      .sort((a, b) => getItemValue(a) - getItemValue(b));
  }, [items, categoryName, quantityDisplayMode, viewMode]);

  // カテゴリ統計を計算
  const stats = useMemo(() => {
    if (categoryItems.length === 0) {
      return {
        itemCount: 0,
        totalWeight: 0,
        totalPrice: 0,
        avgWeight: 0,
        shortageCount: 0,
      };
    }

    const totalWeight = categoryItems.reduce(
      (sum, item) => sum + (item.weightGrams || 0) * getQuantityForDisplayMode(item, quantityDisplayMode),
      0
    );
    const totalPrice = categoryItems.reduce(
      (sum, item) => sum + (item.priceCents || 0) * getQuantityForDisplayMode(item, quantityDisplayMode),
      0
    );
    const shortageCount = categoryItems.reduce((sum, item) => sum + (item.shortage || 0), 0);

    return {
      itemCount: categoryItems.length,
      totalWeight,
      totalPrice,
      avgWeight: Math.round(totalWeight / categoryItems.length),
      shortageCount,
    };
  }, [categoryItems, quantityDisplayMode]);

  // カテゴリの色を取得
  const categoryColor = categoryItems[0]?.category?.color || COLORS.gray[500];

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full w-full min-w-0">
      {/* カテゴリバッジ */}
      <div>
        <CategoryBadge name={categoryName} color={categoryColor} className="text-xs font-semibold px-2 py-1" />
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-200" />

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
      <div className="border-t border-gray-200" />

      {/* アイテムリスト */}
      <div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-2">
          <span>ITEMS</span>
          <span className="font-semibold text-gray-900">{stats.itemCount}</span>
        </div>
        <div className="space-y-1.5">
          {categoryItems.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No items in this category
            </p>
          ) : (
            categoryItems.map(item => {
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
                  onClick={onItemClick}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CategorySummaryView);
