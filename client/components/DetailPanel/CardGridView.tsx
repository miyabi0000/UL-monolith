import React, { useMemo, useState, useCallback } from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { COLORS, BORDERS } from '../../utils/designSystem';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';
import GearInfoSummary from './GearInfoSummary';

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

/** 展開セクションの詳細行（Brand / Source） */
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-2xs leading-relaxed">
    <span style={{ color: COLORS.text.muted }}>{label}</span>
    <span style={{ color: COLORS.text.secondary }}>{value}</span>
  </div>
);

/** Edit / Link ボタン */
const actionButtonStyle = {
  color: COLORS.text.secondary,
  border: BORDERS.default,
} as const;

const actionButtonClass = 'text-2xs font-medium px-2 py-0.5 rounded transition-colors hover:bg-gray-100';

/** 画像なし時のプレースホルダー */
const ImagePlaceholder: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
  <div
    className={`w-full flex items-center justify-center ${className}`}
    style={{ backgroundColor: COLORS.gray[100] }}
  >
    <span className="text-xs text-center px-2 truncate" style={{ color: COLORS.text.muted }}>
      {name}
    </span>
  </div>
);

/** フルワイド展開パネル */
const ExpandedPanel: React.FC<{
  item: GearItemWithCalculated;
  onEdit?: (item: GearItemWithCalculated) => void;
}> = ({ item, onEdit }) => (
  <div
    className="animate-fade-in overflow-hidden"
    style={{
      gridColumn: '1 / -1',
      gridRow: 'span 2',
      borderTop: `1px solid ${COLORS.gray[200]}`,
      backgroundColor: COLORS.gray[50],
    }}
  >
    <div className="flex gap-3 p-3 h-full overflow-y-auto">
      {/* 左: 大きい画像 */}
      <div className="flex-shrink-0 w-40 sm:w-52">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full max-h-64 object-contain rounded bg-white"
          />
        ) : (
          <ImagePlaceholder name={item.name} className="h-40 rounded" />
        )}
      </div>

      {/* 右: 詳細情報 */}
      <div className="flex-1 min-w-0">
        <GearInfoSummary item={item} />

        <div className="mt-2 mb-1" style={{ borderTop: `1px dashed ${COLORS.gray[200]}` }} />
        <DetailRow label="Brand" value={item.brand || '—'} />
        <DetailRow label="Source" value={`${item.weightSource} (${item.weightConfidence})`} />

        <div className="flex items-center gap-2 mt-2">
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

/** 通常時は画像のみ、タップで行下にフルワイド展開するカードグリッド */
const CardGridView: React.FC<CardGridViewProps> = ({
  items,
  viewMode,
  quantityDisplayMode,
  hoveredItemId,
  onItemHover,
  disableSort,
  activePackName,
  activePackItemIds = [],
  onTogglePackItem,
  onEdit,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    if (disableSort) return items;
    return [...items].sort((a, b) => {
      const qA = getQuantityForDisplayMode(a, quantityDisplayMode);
      const qB = getQuantityForDisplayMode(b, quantityDisplayMode);
      const valA = viewMode === 'cost' ? (a.priceCents || 0) * qA : (a.weightGrams || 0) * qA;
      const valB = viewMode === 'cost' ? (b.priceCents || 0) * qB : (b.weightGrams || 0) * qB;
      return valB - valA;
    });
  }, [items, quantityDisplayMode, viewMode, disableSort]);

  // 展開はローカル UI 状態に閉じる。
  // onItemSelect を発火させると親の selectedItemId 経由で ChartPanel のカテゴリ自動選択
  // 副作用が走り、他カードが画面から消える不具合があるため呼ばない。
  // Chart↔Card の視覚連動は onItemHover が担う。
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
        <div className="grid grid-cols-3 sm:grid-cols-4 grid-flow-row-dense gap-1">
          {sortedItems.map(item => {
            const isExpanded = expandedId === item.id;
            const isInActivePack = activePackItemIds.includes(item.id);

            return (
              <React.Fragment key={item.id}>
                {/* カード本体 */}
                <div
                  className="relative overflow-hidden select-none cursor-pointer"
                  onMouseEnter={() => onItemHover?.(item.id)}
                  onMouseLeave={() => onItemHover?.(null)}
                  onClick={() => handleToggle(item.id)}
                  style={{
                    boxShadow: hoveredItemId === item.id
                      ? `0 0 0 1px ${COLORS.gray[400]}`
                      : 'none',
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
                        'absolute top-1 right-1 z-10 h-5 min-w-[34px] px-1.5 text-3xs font-semibold transition-colors',
                        isInActivePack ? 'bg-gray-800 text-white' : 'bg-white text-gray-600',
                      ].join(' ')}
                      title={`${isInActivePack ? 'Remove from' : 'Add to'} ${activePackName}`}
                    >
                      {isInActivePack ? 'IN' : 'OUT'}
                    </button>
                  )}

                  {/* 画像（object-contain で見切れ防止） */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full aspect-[4/3] object-contain bg-gray-50"
                      loading="lazy"
                    />
                  ) : (
                    <ImagePlaceholder name={item.name} className="aspect-[4/3]" />
                  )}
                </div>

                {/* フルワイド展開パネル（行の下に挿入） */}
                {isExpanded && (
                  <ExpandedPanel item={item} onEdit={onEdit} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(CardGridView);
