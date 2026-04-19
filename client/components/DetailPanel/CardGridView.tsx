import React, { useMemo, useRef, useState, useCallback } from 'react';
import { GearItemWithCalculated, QuantityDisplayMode } from '../../utils/types';
import { COLORS, BORDERS } from '../../utils/designSystem';
import { getQuantityForDisplayMode } from '../../utils/chartHelpers';
import { useOutsideClick } from '../../hooks/useOutsideClick';
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
  /** 展開パネルの ⋯ → Edit: 行を highlight (Table view に切替えて ⋯ → Edit で per-row 編集する誘導) */
  onEdit?: (item: GearItemWithCalculated) => void;
  /** 展開パネルの ⋯ → Delete */
  onDelete?: (id: string) => void;
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

/** 画像なし/読込失敗時のプレースホルダー */
const ImagePlaceholder: React.FC<{ name: string; className?: string; style?: React.CSSProperties }> = ({
  name,
  className = '',
  style,
}) => (
  <div
    className={`w-full flex items-center justify-center ${className}`}
    style={{ backgroundColor: COLORS.gray[100], ...style }}
  >
    <span className="text-xs text-center px-2 truncate" style={{ color: COLORS.text.muted }}>
      {name}
    </span>
  </div>
);

/**
 * 展開パネルの ⋯ メニュー
 * - Edit: 行 highlight のみ (Card では inline 編集不可。Table view に切替えて
 *         ⋯ → Edit で per-row 編集する UX を誘導)
 * - Delete: window.confirm 付きで onDelete を呼ぶ
 */
const CardActionMenu: React.FC<{
  item: GearItemWithCalculated;
  onEdit?: (item: GearItemWithCalculated) => void;
  onDelete?: (id: string) => void;
}> = ({ item, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false), open);

  if (!onEdit && !onDelete) return null;

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={actionButtonClass}
        style={actionButtonStyle}
        aria-label="Card actions"
        aria-haspopup="menu"
        aria-expanded={open}
        title="More actions"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 w-32 rounded-md bg-white dark:bg-gray-800 shadow-sm overflow-hidden z-50 border border-gray-100 dark:border-gray-700"
        >
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => { setOpen(false); onEdit(item); }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => {
                setOpen(false);
                if (window.confirm('このギアを削除しますか?')) onDelete(item.id);
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/** フルワイド展開パネル */
const ExpandedPanel: React.FC<{
  item: GearItemWithCalculated;
  onEdit?: (item: GearItemWithCalculated) => void;
  onDelete?: (id: string) => void;
}> = ({ item, onEdit, onDelete }) => (
  <div
    className="animate-fade-in overflow-hidden"
    style={{
      gridColumn: '1 / -1',
      gridRow: 'span 2',
      borderTop: BORDERS.divider,
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
          <CardActionMenu item={item} onEdit={onEdit} onDelete={onDelete} />
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
  onDelete,
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
    <div className="p-1 sm:p-3 space-y-2 w-full min-w-0">
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

                  {/* 画像（object-contain で見切れ防止、ロード失敗時は name プレースホルダーに差替え） */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full aspect-[4/3] object-contain bg-gray-50"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = '';
                      }}
                    />
                  ) : null}
                  {/* img が表示されない / 失敗した場合のフォールバック */}
                  <ImagePlaceholder
                    name={item.name}
                    className="aspect-[4/3]"
                    style={item.imageUrl ? { display: 'none' } : undefined}
                  />
                </div>

                {/* フルワイド展開パネル（行の下に挿入） */}
                {isExpanded && (
                  <ExpandedPanel item={item} onEdit={onEdit} onDelete={onDelete} />
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
