import React from 'react';
import SegmentedControl, { SegmentedOption } from './SegmentedControl';
import { useWeightUnit } from '../../contexts/WeightUnitContext';

interface WeightUnitToggleProps {
  className?: string;
}

const WeightUnitToggle: React.FC<WeightUnitToggleProps> = ({ className }) => {
  const { unit, setUnit } = useWeightUnit();

  const options: SegmentedOption[] = [
    {
      key: 'g',
      label: 'g',
      onClick: () => setUnit('g'),
      isActive: unit === 'g',
      ariaLabel: 'グラム表示に切り替え',
      title: 'グラム表示',
    },
    {
      key: 'oz',
      label: 'oz',
      onClick: () => setUnit('oz'),
      isActive: unit === 'oz',
      ariaLabel: 'オンス表示に切り替え',
      title: 'オンス表示',
    },
  ];

  return <SegmentedControl options={options} className={className} />;
};

export default WeightUnitToggle;
