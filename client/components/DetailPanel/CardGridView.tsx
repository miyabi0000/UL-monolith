import React, { useMemo, useState, useCallback } from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { COLORS, SHADOW, COMPONENT_RADIUS, getPriorityColor } from '../../utils/designSystem';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';
import { formatWeight } from '../../utils/weightUnit';
import { formatPrice } from '../../utils/formatters';

interface CardGridViewProps {
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  quantityDisplayMode: QuantityDisplayMode;
  selectedItemId?: string | null;
  disableSort?: boolean;
  activePackName?: string;
  activePackItemIds?: string[];
  onTogglePackItem?: (itemId: string) => void;
  onEdit?: (item: GearItemWithCalculated) => void;
}

/** コンパクトテキストカードのグリッド表示 */
const CardGridView: React.FC<CardGridViewProps> = ({
  items,
  viewMode,
  quantityDisplayMode,
  selectedItemId,
  disableSort,
  activePackName,
  activePackItemIds = [],
  onTogglePackItem,
  onEdit,
}) => {
  // 展開中のカードID（同時に1つだけ展開）
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // カードタップで展開/閉じる（他を閉じる）
  const handleToggle = useCallback((itemId: string) => {
    setExpandedId(prev => (prev === itemId ? null : itemId));
  }, []);

  // シーズン表示用フォーマット
  const formatSeasons = (seasons?: string[]): string => {
    if (!seasons || seasons.length === 0) return '—';
    return seasons.join(', ');
  };

  return (
    <div className="p-2 sm:p-3 space-y-2 w-full min-w-0">
      {/* ヘッダー */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {sortedItems.map(item => {
              const isExpanded = expandedId === item.id;
              const isHighlighted = selectedItemId === item.id;
              const isInActivePack = activePackItemIds.includes(item.id);
              const categoryName = item.category?.name ?? '—';
              const weightClassLabel = item.weightClass;
              const quantityText = `${item.ownedQuantity}/${item.requiredQuantity}`;

              return (
                <div
                  key={item.id}
                  className="relative overflow-hidden select-none"
                  style={{
                    borderRadius: COMPONENT_RADIUS.surface,
                    boxShadow: isHighlighted ? `0 0 0 2px ${COLORS.gray[500]}` : SHADOW,
                    backgroundColor: COLORS.surface,
                  }}
                >
                  {/* パックトグルボタン */}
                  {activePackName && onTogglePackItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePackItem(item.id);
                      }}
                      className={[
                        'absolute top-1 right-1 z-10 h-5 min-w-[34px] rounded-md px-1.5 text-[9px] font-semibold transition-colors',
                        isInActivePack
                          ? 'bg-gray-800 text-white'
                          : 'bg-white/90 text-gray-600',
                      ].join(' ')}
                      title={`${isInActivePack ? 'Remove from' : 'Add to'} ${activePackName}`}
                    >
                      {isInActivePack ? 'IN' : 'OUT'}
                    </button>
                  )}

                  {/* タップ領域：コンパクト表示部分 */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className="w-full text-left px-2.5 py-2 focus:outline-none"
                  >
                    {/* 1行目: 名前 + 優先度バッジ */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-xs font-medium truncate flex-1"
                        style={{ color: COLORS.text.primary }}
                      >
                        {item.name}
                      </span>
                      <span
                        className="text-[10px] font-bold flex-shrink-0 px-1 rounded"
                        style={{
                          color: getPriorityColor(item.priority),
                          backgroundColor: `${getPriorityColor(item.priority)}18`,
                          borderRadius: COMPONENT_RADIUS.badge,
                        }}
                      >
                        P{item.priority}
                      </span>
                    </div>

                    {/* 2行目: 重量 + 価格 */}
                    <div className="flex items-center justify-between mt-0.5">
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: COLORS.text.primary }}
                      >
                        {formatWeight(item.weightGrams, 'g')}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: COLORS.text.secondary }}
                      >
                        {formatPrice(item.priceCents)}
                      </span>
                    </div>

                    {/* 3行目: weightClass + カテゴリ + 所持/必要 */}
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: COLORS.text.muted }}
                        >
                          {weightClassLabel}
                        </span>
                        <span
                          className="text-[10px] truncate"
                          style={{ color: COLORS.text.secondary }}
                        >
                          {categoryName}
                        </span>
                      </div>
                      <span
                        className="text-[10px] flex-shrink-0"
                        style={{ color: COLORS.text.muted }}
                      >
                        {quantityText}
                      </span>
                    </div>
                  </button>

                  {/* 展開セクション（CSS max-height アニメーション） */}
                  <div
                    style={{
                      maxHeight: isExpanded ? '200px' : '0px',
                      transition: 'max-height 0.3s ease',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="px-2.5 pb-2">
                      {/* 区切り線 */}
                      <div
                        className="mb-1.5"
                        style={{
                          borderTop: `1px dashed ${COLORS.gray[200]}`,
                        }}
                      />

                      {/* ブランド */}
                      <div className="flex justify-between text-[10px] leading-relaxed">
                        <span style={{ color: COLORS.text.muted }}>Brand</span>
                        <span style={{ color: COLORS.text.secondary }}>
                          {item.brand || '—'}
                        </span>
                      </div>

                      {/* シーズン */}
                      <div className="flex justify-between text-[10px] leading-relaxed">
                        <span style={{ color: COLORS.text.muted }}>Seasons</span>
                        <span style={{ color: COLORS.text.secondary }}>
                          {formatSeasons(item.seasons)}
                        </span>
                      </div>

                      {/* 重量ソース・信頼度 */}
                      <div className="flex justify-between text-[10px] leading-relaxed">
                        <span style={{ color: COLORS.text.muted }}>Source</span>
                        <span style={{ color: COLORS.text.secondary }}>
                          {item.weightSource} ({item.weightConfidence})
                        </span>
                      </div>

                      {/* ボタン行 */}
                      <div className="flex items-center gap-2 mt-1.5">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item);
                            }}
                            className="text-[10px] font-medium px-2 py-0.5 rounded transition-colors hover:bg-gray-100"
                            style={{
                              color: COLORS.text.secondary,
                              border: `1px solid ${COLORS.gray[200]}`,
                              borderRadius: COMPONENT_RADIUS.control,
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {item.productUrl && (
                          <a
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-medium px-2 py-0.5 rounded transition-colors hover:bg-gray-100"
                            style={{
                              color: COLORS.text.secondary,
                              border: `1px solid ${COLORS.gray[200]}`,
                              borderRadius: COMPONENT_RADIUS.control,
                            }}
                          >
                            Link →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
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
