import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface CurrencyToggleProps {
  className?: string;
}

const SYMBOL = { JPY: '¥', USD: '$' } as const;
const LABEL = { JPY: '円', USD: 'ドル' } as const;

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ className = '' }) => {
  const { currency, setCurrency } = useCurrency();
  const next = currency === 'JPY' ? 'USD' : 'JPY';
  return (
    <button
      type="button"
      onClick={() => setCurrency(next)}
      className={`icon-btn text-xs font-medium ${className}`}
      aria-label={`${LABEL[currency]}表示中 (クリックで${LABEL[next]}に切替)`}
      title={`${SYMBOL[next]} に切り替え`}
    >
      {SYMBOL[currency]}
    </button>
  );
};

export default CurrencyToggle;
