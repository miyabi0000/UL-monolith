import React, { useMemo, useCallback } from 'react';
import { GearItemWithCalculated } from '../../utils/types';
import { COLORS, getCategoryBadgeStyle } from '../../utils/designSystem';

interface CategorySummaryViewProps {
  categoryName: string;
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  onItemClick: (itemId: string) => void;
}

// formatPrice関数をコンポーネント外に移動してmemo化の恩恵を受ける
const formatPrice = (priceCents?: number) => {
  if (!priceCents) return '-';
  const price = priceCents / 100;
  return `¥${Math.round(price).toLocaleString()}`;
};

const CategorySummaryView: React.FC<CategorySummaryViewProps> = ({
  categoryName,
  items,
  viewMode,
  onItemClick,
}) => {
  // カテゴリに属するアイテムをフィルタして重さ昇順でソート
  const categoryItems = useMemo(() => {
    return items
      .filter(item => item.category?.name === categoryName)
      .sort((a, b) => (a.totalWeight || 0) - (b.totalWeight || 0));
  }, [items, categoryName]);

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

    const totalWeight = categoryItems.reduce((sum, item) => sum + (item.totalWeight || 0), 0);
    const totalPrice = categoryItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const shortageCount = categoryItems.reduce((sum, item) => sum + (item.shortage || 0), 0);

    return {
      itemCount: categoryItems.length,
      totalWeight,
      totalPrice,
      avgWeight: Math.round(totalWeight / categoryItems.length),
      shortageCount,
    };
  }, [categoryItems]);

  // カテゴリの色を取得
  const categoryColor = categoryItems[0]?.category?.color || '#6B7280';

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full w-full min-w-0">
      {/* カテゴリバッジ */}
      <div>
        <span
          className="inline-block text-xs font-semibold px-2 py-1 rounded"
          style={getCategoryBadgeStyle(categoryColor)}
        >
          {categoryName}
        </span>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

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
        </div>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* アイテムリスト */}
      <div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          <span>ITEMS</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.itemCount}</span>
        </div>
        <div className="space-y-1">
          {categoryItems.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
              No items in this category
            </p>
          ) : (
            categoryItems.map(item => {
              const imageUrl = item.imageUrl || 'https://via.placeholder.com/40x40?text=No+Image';
              const weightPercentage = stats.totalWeight > 0
                ? Math.round((item.totalWeight / stats.totalWeight) * 100)
                : 0;
              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700
                    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left flex items-center gap-2"
                >
                  {/* 画像 */}
                  <div className="relative w-8 h-8 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* 情報 */}
                  <div className="flex-1 min-w-0 text-[10px]">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-right text-gray-500 dark:text-gray-500 mt-0.5 space-x-2">
                      <span>{item.totalWeight}g</span>
                      <span className="font-semibold">{weightPercentage}%</span>
                      <span>P{item.priority}</span>
                    </div>
                  </div>

                  {/* 不足インジケーター */}
                  {item.shortage > 0 && (
                    <div className="flex-shrink-0">
                      <span
                        className="text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
                        style={{
                          backgroundColor: COLORS.warning,
                          color: COLORS.white,
                        }}
                      >
                        !
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CategorySummaryView);
