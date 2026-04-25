import React, { useMemo } from 'react';
import type { GearItemWithCalculated } from '../utils/types';
import { formatWeight } from '../utils/weightUnit';
import { formatPrice } from '../utils/formatters';

/**
 * ChatSidebar 内に差し込まれる 2〜4 件のギア比較パネル。
 * 幅 400px のサイドバーを想定した縦型。最軽量・最安値セルを微強調。
 */
interface Props {
  items: GearItemWithCalculated[];
  weightUnit: 'g' | 'oz';
  onFocusGear?: (gearId: string) => void;
}

const CompactComparisonPanel: React.FC<Props> = ({ items, weightUnit, onFocusGear }) => {
  const { minWeight, minPrice } = useMemo(() => {
    const weights = items
      .map((i) => i.weightGrams)
      .filter((w): w is number => typeof w === 'number' && w > 0);
    const prices = items
      .map((i) => i.priceCents)
      .filter((p): p is number => typeof p === 'number' && p > 0);
    return {
      minWeight: weights.length ? Math.min(...weights) : null,
      minPrice: prices.length ? Math.min(...prices) : null,
    };
  }, [items]);

  if (items.length < 2) return null;

  return (
    <div className="card mt-2 overflow-hidden">
      <div
        className="px-3 py-1.5 text-2xs uppercase tracking-wide"
        style={{
          background: 'var(--surface-level-1)',
          color: 'var(--ink-muted)',
          borderBottom: 'var(--border-divider)',
        }}
      >
        Comparison ({items.length})
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ color: 'var(--ink-muted)' }}>
            <th className="text-left font-medium px-3 py-1.5">Item</th>
            <th className="text-right font-medium px-2 py-1.5 w-16">Weight</th>
            <th className="text-right font-medium px-3 py-1.5 w-20">Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const isLightest =
              minWeight !== null && item.weightGrams === minWeight;
            const isCheapest =
              minPrice !== null && item.priceCents === minPrice;
            const clickable = !!onFocusGear;
            return (
              <tr
                key={item.id}
                className={clickable ? 'cursor-pointer transition-colors' : ''}
                style={{ borderTop: idx === 0 ? undefined : 'var(--border-divider)' }}
                onClick={clickable ? () => onFocusGear!(item.id) : undefined}
                onMouseEnter={clickable ? (e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-level-1)'; } : undefined}
                onMouseLeave={clickable ? (e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; } : undefined}
              >
                <td className="px-3 py-1.5 truncate max-w-[180px]" style={{ color: 'var(--ink-primary)' }}>
                  {item.name}
                </td>
                <td
                  className={`px-2 py-1.5 text-right tabular-nums ${isLightest ? 'font-semibold' : ''}`}
                  style={{ color: isLightest ? 'var(--ink-primary)' : 'var(--ink-secondary)' }}
                >
                  {typeof item.weightGrams === 'number'
                    ? formatWeight(item.weightGrams, weightUnit)
                    : '—'}
                </td>
                <td
                  className={`px-3 py-1.5 text-right tabular-nums ${isCheapest ? 'font-semibold' : ''}`}
                  style={{ color: isCheapest ? 'var(--ink-primary)' : 'var(--ink-secondary)' }}
                >
                  {typeof item.priceCents === 'number'
                    ? formatPrice(item.priceCents)
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CompactComparisonPanel;
