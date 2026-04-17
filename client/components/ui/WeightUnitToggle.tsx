import React from 'react';
import { useWeightUnit } from '../../contexts/WeightUnitContext';

interface WeightUnitToggleProps {
  className?: string;
}

const WeightUnitToggle: React.FC<WeightUnitToggleProps> = ({ className = '' }) => {
  const { unit, setUnit } = useWeightUnit();
  const next = unit === 'g' ? 'oz' : 'g';
  return (
    <button
      type="button"
      onClick={() => setUnit(next)}
      className={`icon-btn text-xs font-medium ${className}`}
      aria-label={`${unit === 'g' ? 'グラム' : 'オンス'}表示中 (クリックで${next === 'g' ? 'グラム' : 'オンス'}に切替)`}
      title={`${next} に切り替え`}
    >
      {unit}
    </button>
  );
};

export default WeightUnitToggle;
