import React from 'react';
import { GearItemWithCalculated } from '../../utils/types';
import { COLORS, BORDERS, mondrian } from '../../utils/designSystem';
import { alpha, primitiveColors } from '../../styles/tokens';
import { formatWeight } from '../../utils/weightUnit';
import { formatPrice } from '../../utils/formatters';
import { useWeightUnit } from '../../contexts/WeightUnitContext';

/** テーブルと同じ優先度スタイル — Mondrian 縮退 (赤/黄/黒) */
const PRIORITY_STYLE: Record<number, { color: string; bg: string; border: string }> = {
  1: { color: mondrian.red,    bg: alpha(mondrian.red, 0.12),    border: mondrian.red },
  2: { color: mondrian.red,    bg: alpha(mondrian.red, 0.06),    border: alpha(mondrian.red, 0.4) },
  3: { color: mondrian.black,  bg: alpha(mondrian.yellow, 0.22), border: mondrian.yellow },
  4: { color: primitiveColors.gray[700], bg: primitiveColors.gray[100], border: primitiveColors.gray[300] },
  5: { color: primitiveColors.gray[600], bg: primitiveColors.gray[50],  border: primitiveColors.gray[200] },
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
            border: BORDERS.default,
            borderColor: pStyle.border,
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
