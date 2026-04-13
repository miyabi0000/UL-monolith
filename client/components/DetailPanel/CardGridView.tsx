import React, { useMemo, useState, useCallback } from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { COLORS, SHADOW } from '../../utils/designSystem';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';
import GearInfoSummary from './GearInfoSummary';

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
  border: `1px solid ${COLORS.gray[200]}`,
} as const;

const actionButtonClass = 'text-2xs font-medium px-2 py-0.5 rounded transition-colors hover:bg-gray-100';

/** 画像なし時のプレースホルダー */
const ImagePlaceholder: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="w-full aspect-square flex items-center justify-center"
    style={{ backgroundColor: COLORS.gray[100] }}
  >
    <span className="text-xs text-center px-2 truncate" style={{ color: COLORS.text.muted }}>
      {name}
    </span>
  </div>
);

/** 通常時は画像のみ、タップで詳細が出るカードグリッド */
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
          {sortedItems.map(item => {
            const isExpanded = expandedId === item.id;
            const isHighlighted = selectedItemId === item.id;
            const isInActivePack = activePackItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="relative overflow-hidden select-none"
                style={{
                  boxShadow: isHighlighted ? `0 0 0 2px ${COLORS.gray[500]}` : SHADOW,
                  backgroundColor: COLORS.surface,
                }}
              >
                {/* パックトグル */}
                {activePackName && onTogglePackItem && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onTogglePackItem(item.id); }}
                    className={[
                      'absolute top-1 right-1 z-10 h-5 min-w-[34px] px-1.5 text-3xs font-semibold transition-colors',
                      isInActivePack ? 'bg-gray-800 text-white' : 'bg-white/90 text-gray-600',
                    ].join(' ')}
                    title={`${isInActivePack ? 'Remove from' : 'Add to'} ${activePackName}`}
                  >
                    {isInActivePack ? 'IN' : 'OUT'}
                  </button>
                )}

                {/* タップ領域: 画像のみ */}
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  className="w-full focus:outline-none"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <ImagePlaceholder name={item.name} />
                  )}
                </button>

                {/* 展開セクション: 共通コンポーネント GearInfoSummary + 補足情報 */}
                <div
                  style={{
                    maxHeight: isExpanded ? '300px' : '0px',
                    transition: 'max-height 0.3s ease',
                    overflow: 'hidden',
                  }}
                >
                  <div className="px-2 py-1.5">
                    <GearInfoSummary item={item} />

                    {/* 区切り線 + 補足情報 (Brand / Source) + アクション */}
                    <div className="mt-1.5 mb-1" style={{ borderTop: `1px dashed ${COLORS.gray[200]}` }} />
                    <DetailRow label="Brand" value={item.brand || '—'} />
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
