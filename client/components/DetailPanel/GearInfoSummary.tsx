import React from 'react';
import { GearItemWithCalculated } from '../../utils/types';
import { COLORS } from '../../utils/designSystem';
import { formatWeight } from '../../utils/weightUnit';
import { formatPrice } from '../../utils/formatters';
import { useWeightUnit } from '../../contexts/WeightUnitContext';

/** テーブルと同じ優先度スタイル (1-5 の数字表示) */
const PRIORITY_STYLE: Record<number, { color: string; bg: string; border: string }> = {
  1: { color: '#166534', bg: '#dcfce7', border: '#86efac' },
  2: { color: '#0f766e', bg: '#ccfbf1', border: '#5eead4' },
  3: { color: '#a16207', bg: '#fef9c3', border: '#fde047' },
  4: { color: '#b45309', bg: '#ffedd5', border: '#fdba74' },
  5: { color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
};

const formatSeasons = (seasons?: string[]): string => {
  if (!seasons || seasons.length === 0) return '—';
  return seasons.join(', ');
};

interface GearInfoSummaryProps {
  item: GearItemWithCalculated;
}

/**
 * ギアの概要を表示する読み取り専用コンポーネント
 *
 * 情報の表示順はギアテーブルの列順に従う:
 *   name → category → type(weightClass) → quantity → weight → priority → price → season
 */
const GearInfoSummary: React.FC<GearInfoSummaryProps> = ({ item }) => {
  const { unit: weightUnit } = useWeightUnit();
  const pStyle = PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE[3];

  return (
    <div>
      {/* 1. name */}
      <span className="text-xs font-medium truncate block" style={{ color: COLORS.text.primary }}>
        {item.name}
      </span>

      {/* 2. category + 3. type(weightClass) */}
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-2xs truncate" style={{ color: COLORS.text.secondary }}>
          {item.category?.name ?? '—'}
        </span>
        <span className="text-2xs font-medium" style={{ color: COLORS.text.muted }}>
          {item.weightClass}
        </span>
      </div>

      {/* 4. quantity + 5. weight */}
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-2xs" style={{ color: COLORS.text.muted }}>
          {item.ownedQuantity}/{item.requiredQuantity}
        </span>
        <span className="text-xs font-semibold" style={{ color: COLORS.text.primary }}>
          {formatWeight(item.weightGrams, weightUnit)}
        </span>
      </div>

      {/* 6. priority + 7. price */}
      <div className="flex items-center justify-between mt-0.5">
        <span
          className="text-2xs font-bold h-5 w-5 inline-flex items-center justify-center"
          style={{
            color: pStyle.color,
            backgroundColor: pStyle.bg,
            border: `1px solid ${pStyle.border}`,
          }}
        >
          {item.priority}
        </span>
        <span className="text-xs" style={{ color: COLORS.text.secondary }}>
          {formatPrice(item.priceCents)}
        </span>
      </div>

      {/* 8. season */}
      <div className="mt-0.5">
        <span className="text-2xs" style={{ color: COLORS.text.muted }}>
          {formatSeasons(item.seasons)}
        </span>
      </div>
    </div>
  );
};

export default React.memo(GearInfoSummary);
