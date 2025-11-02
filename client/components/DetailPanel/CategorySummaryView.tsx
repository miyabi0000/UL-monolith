import React, { useMemo } from 'react';
import { GearItemWithCalculated } from '../../utils/types';
import { COLORS, getCategoryBadgeStyle } from '../../utils/designSystem';

interface CategorySummaryViewProps {
  categoryName: string;
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  onItemClick: (itemId: string) => void;
}

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
  // カテゴリに属するアイテムをフィルタ
  const categoryItems = useMemo(() => {
    return items.filter(item => item.category?.name === categoryName);
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
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* カテゴリ名 */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
          {categoryName}
        </h3>
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
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">STATS</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-gray-500 dark:text-gray-500">Items</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.itemCount}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-500">Avg Weight</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.avgWeight}g</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-500">Weight</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalWeight}g</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-500">Price</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(stats.totalPrice)}</div>
          </div>
          {stats.shortageCount > 0 && (
            <div className="col-span-2">
              <div className="text-gray-500 dark:text-gray-500">Shortage</div>
              <div className="font-semibold text-red-600 dark:text-red-400">{stats.shortageCount}</div>
            </div>
          )}
        </div>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* アイテムリスト */}
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">ITEMS</div>
        <div className="space-y-2">
          {categoryItems.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
              No items in this category
            </p>
          ) : (
            categoryItems.map(item => {
              const imageUrl = item.imageUrl || 'https://via.placeholder.com/60x60?text=No+Image';
              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700
                    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left flex gap-2"
                >
                  {/* 画像 */}
                  <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {item.shortage > 0 && (
                      <div className="absolute top-0 right-0">
                        <span
                          className="text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full"
                          style={{
                            backgroundColor: COLORS.warning,
                            color: COLORS.white,
                          }}
                        >
                          !
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                      {item.name}
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                      <span>{item.totalWeight}g</span>
                      <span>{formatPrice(item.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      <span>Own/Need: {item.ownedQuantity}/{item.requiredQuantity}</span>
                      <span>P{item.priority}</span>
                    </div>
                  </div>
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
