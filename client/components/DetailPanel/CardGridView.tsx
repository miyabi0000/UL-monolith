import React, { useMemo, useState, useCallback } from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { COLORS, SHADOW, COMPONENT_RADIUS, getPriorityColor } from '../../utils/designSystem';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';
import { formatWeight } from '../../utils/weightUnit';
import { formatPrice } from '../../utils/formatters';
import { useWeightUnit } from '../../contexts/WeightUnitContext';

interface CardGridViewProps {
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  quantityDisplayMode: QuantityDisplayMode;
  selectedItemId?: string | null;
  hoveredItemId?: string | null;
  onItemSelect?: (id: string | null) => void;
  onItemHover?: (id: string | null) => void;
  disableSort?: boolean;
  activePackName?: string;
  activePackItemIds?: string[];
  onTogglePackItem?: (itemId: string) => void;
  onEdit?: (item: GearItemWithCalculated) => void;
}

// --- モジュールレベル定数・ヘルパー ---

const EXPAND_MAX_HEIGHT = '200px';
const PRIORITY_BG_OPACITY = '18'; // hex ~9%

/** シーズン配列をカンマ区切り文字列にフォーマット */
const formatSeasons = (seasons?: string[]): string => {
  if (!seasons || seasons.length === 0) return '—';
  return seasons.join(', ');
};

/** 展開セクションの詳細行 */
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-2xs leading-relaxed">
    <span style={{ color: COLORS.text.muted }}>{label}</span>
    <span style={{ color: COLORS.text.secondary }}>{value}</span>
  </div>
);

/** Edit / Link ボタンの共通スタイル */
const actionButtonStyle = {
  color: COLORS.text.secondary,
  border: `1px solid ${COLORS.gray[200]}`,
  borderRadius: COMPONENT_RADIUS.control,
} as const;

const actionButtonClass = 'text-2xs font-medium px-2 py-0.5 rounded transition-colors hover:bg-gray-100';

/** コンパクトテキストカードのグリッド表示 */
const CardGridView: React.FC<CardGridViewProps> = ({
  items,
  viewMode,
  quantityDisplayMode,
  selectedItemId,
  hoveredItemId,
  onItemSelect,
  onItemHover,
  disableSort,
  activePackName,
  activePackItemIds = [],
  onTogglePackItem,
  onEdit,
}) => {
  const { unit: weightUnit } = useWeightUnit();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // アイテムを表示値（weight/cost）昇順でソート
  const sortedItems = useMemo(() => {
    if (disableSort) return items;
    return [...items].sort((a, b) => {
      const qA = getQuantityForDisplayMode(a, quantityDisplayMode);
      const qB = getQuantityForDisplayMode(b, quantityDisplayMode);
      const valA = viewMode === 'cost' ? (a.priceCents || 0) * qA : (a.weightGrams || 0) * qA;
      const valB = viewMode === 'cost' ? (b.priceCents || 0) * qB : (b.weightGrams || 0) * qB;
      return valA - valB;
    });
  }, [items, quantityDisplayMode, viewMode, disableSort]);

  const handleToggle = useCallback((itemId: string) => {
    setExpandedId(prev => (prev === itemId ? null : itemId));
  }, []);

  return (
    <div className="p-2 sm:p-3 space-y-2 w-full min-w-0">
      <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-2">
        <span>ITEMS</span>
        <span className="font-semibold text-gray-900">{items.length}</span>
      </div>

      {sortedItems.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No items</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {sortedItems.map(item => {
            const isExpanded = expandedId === item.id;
            const isHighlighted = selectedItemId === item.id;
            const isHovered = hoveredItemId === item.id;
            const isInActivePack = activePackItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="relative overflow-hidden select-none"
                onMouseEnter={() => onItemHover?.(item.id)}
                onMouseLeave={() => onItemHover?.(null)}
                style={{
                  borderRadius: COMPONENT_RADIUS.surface,
                  boxShadow: isHighlighted
                    ? `0 0 0 2px ${COLORS.gray[500]}`
                    : isHovered
                      ? `0 0 0 1px ${COLORS.gray[400]}`
                      : SHADOW,
                  backgroundColor: COLORS.surface,
                  transition: 'box-shadow 120ms ease',
                }}
              >
                {/* パックトグル */}
                {activePackName && onTogglePackItem && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onTogglePackItem(item.id); }}
                    className={[
                      'absolute top-1 right-1 z-10 h-5 min-w-[34px] rounded-md px-1.5 text-3xs font-semibold transition-colors',
                      isInActivePack ? 'bg-gray-800 text-white' : 'bg-white/90 text-gray-600',
                    ].join(' ')}
                    title={`${isInActivePack ? 'Remove from' : 'Add to'} ${activePackName}`}
                  >
                    {isInActivePack ? 'IN' : 'OUT'}
                  </button>
                )}

                {/* 上カバー画像（imageUrl 無しはグレー無地フォールバック） */}
                <div className="w-full h-20 bg-gray-100 dark:bg-slate-700 flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                {/* タップ領域: 展開トグル + Chart へ selection 通知 */}
                <button
                  type="button"
                  onClick={() => {
                    handleToggle(item.id);
                    onItemSelect?.(item.id);
                  }}
                  className="w-full text-left px-2.5 py-2 focus:outline-none"
                >
                  {/* 1行目: 名前 + 優先度 */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium truncate flex-1" style={{ color: COLORS.text.primary }}>
                      {item.name}
                    </span>
                    <span
                      className="text-2xs font-bold flex-shrink-0 px-1 rounded"
                      style={{
                        color: getPriorityColor(item.priority),
                        backgroundColor: `${getPriorityColor(item.priority)}${PRIORITY_BG_OPACITY}`,
                        borderRadius: COMPONENT_RADIUS.badge,
                      }}
                    >
                      P{item.priority}
                    </span>
                  </div>

                  {/* 2行目: 重量 + 価格 */}
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-semibold" style={{ color: COLORS.text.primary }}>
                      {formatWeight(item.weightGrams, weightUnit)}
                    </span>
                    <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                      {formatPrice(item.priceCents)}
                    </span>
                  </div>

                  {/* 3行目: weightClass + カテゴリ + 所持/必要 */}
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-2xs font-medium" style={{ color: COLORS.text.muted }}>
                        {item.weightClass}
                      </span>
                      <span className="text-2xs truncate" style={{ color: COLORS.text.secondary }}>
                        {item.category?.name ?? '—'}
                      </span>
                    </div>
                    <span className="text-2xs flex-shrink-0" style={{ color: COLORS.text.muted }}>
                      {item.ownedQuantity}/{item.requiredQuantity}
                    </span>
                  </div>
                </button>

                {/* 展開セクション */}
                <div style={{ maxHeight: isExpanded ? EXPAND_MAX_HEIGHT : '0px', transition: 'max-height 0.3s ease', overflow: 'hidden' }}>
                  <div className="px-2.5 pb-2">
                    <div className="mb-1.5" style={{ borderTop: `1px dashed ${COLORS.gray[200]}` }} />
                    <DetailRow label="Brand" value={item.brand || '—'} />
                    <DetailRow label="Seasons" value={formatSeasons(item.seasons)} />
                    <DetailRow label="Source" value={`${item.weightSource} (${item.weightConfidence})`} />

                    <div className="flex items-center gap-2 mt-1.5">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                          className={actionButtonClass}
                          style={actionButtonStyle}
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
                          className={actionButtonClass}
                          style={actionButtonStyle}
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
  );
};

export default React.memo(CardGridView);
