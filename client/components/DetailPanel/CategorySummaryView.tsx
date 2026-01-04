import React, { useMemo, useCallback } from 'react';
import { GearItemWithCalculated } from '../../utils/types';
import { COLORS, getCategoryBadgeStyle } from '../../utils/designSystem';
import { formatPrice } from '../../utils/formatters';
import TruncatedText from '../TruncatedText';

interface CategorySummaryViewProps {
  categoryName: string;
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  onItemClick: (itemId: string) => void;
}

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
    <div className="p-3 space-y-3 overflow-y-auto h-full w-full min-w-0">
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
        <div className="space-y-1.5">
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
                  className="w-full px-3 py-3 rounded border border-gray-200 dark:border-gray-700
                    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  {/* グリッドレイアウト: 画像 | 名前+ブランド | 重量+メタ情報 | 不足インジケーター */}
                  <div className="grid gap-3" style={{ gridTemplateColumns: '48px minmax(0, 1fr) 120px 24px' }}>
                    {/* 画像 */}
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>

                    {/* 名前とブランド */}
                    <div className="min-w-0 flex flex-col justify-center">
                      <TruncatedText
                        text={item.name}
                        maxLength={30}
                        className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-tight"
                      />
                      {item.brand && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate leading-tight opacity-75">
                          {item.brand}
                        </div>
                      )}
                    </div>

                    {/* 重量とメタ情報 - 固定幅120pxで右揃え */}
                    <div className="text-right flex flex-col justify-center w-full">
                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight whitespace-nowrap">
                        {item.totalWeight}g
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight whitespace-nowrap">
                        <span className="font-medium">{weightPercentage}%</span>
                        <span className="ml-1.5">P{item.priority}</span>
                      </div>
                    </div>

                    {/* 不足インジケーター - 固定幅24px */}
                    <div className="flex items-center justify-center w-6">
                      {item.shortage > 0 && (
                        <span
                          className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: COLORS.warning,
                            color: COLORS.white,
                          }}
                          title={`${item.shortage}個不足`}
                        >
                          !
                        </span>
                      )}
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
