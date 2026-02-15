import React, { useMemo, useState } from 'react';
import { GearItemWithCalculated } from '../../utils/types';
import { COLORS, STATUS_TONES, getCategoryBadgeStyle } from '../../utils/designSystem';
import { formatPrice } from '../../utils/formatters';
import TruncatedText from '../TruncatedText';

interface CompareViewProps {
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  onEdit: (item: GearItemWithCalculated) => void;
  onDelete: (id: string) => void;
}

const CompareView: React.FC<CompareViewProps> = ({ items, viewMode, onEdit, onDelete }) => {
  const successTone = STATUS_TONES.success;
  const errorTone = STATUS_TONES.error;

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Sort items by weight ascending
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (a.totalWeight || 0) - (b.totalWeight || 0));
  }, [items]);

  const handleToggleSelect = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        // Max 4 items can be selected
        if (prev.length >= 4) {
          return [...prev.slice(1), itemId];
        }
        return [...prev, itemId];
      }
    });
  };

  const comparedItems = useMemo(() => {
    return selectedItems.map(id => items.find(item => item.id === id)).filter(Boolean) as GearItemWithCalculated[];
  }, [selectedItems, items]);

  // Analysis for highlighting (lightest, cheapest, etc.)
  const analysis = useMemo(() => {
    if (comparedItems.length < 2) return null;

    const weights = comparedItems.map(item => item.totalWeight || 0);
    const prices = comparedItems.map(item => item.totalPrice || 0);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      minWeight,
      maxWeight,
      minPrice,
      maxPrice,
      weightDiff: maxWeight - minWeight,
      priceDiff: maxPrice - minPrice,
    };
  }, [comparedItems]);

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full w-full min-w-0">
      {/* Comparison table (when items are selected) */}
      {comparedItems.length > 0 && (
        <>
          <div className="flex justify-between items-center text-xs font-medium text-gray-500">
            <span>COMPARISON</span>
            <span className="font-semibold text-gray-900">{selectedItems.length} items</span>
          </div>

          {/* Horizontally scrollable comparison table */}
          <div className="overflow-x-auto -mx-3 px-3">
            <table className="w-full min-w-max text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 pr-2 text-gray-500 font-medium w-14"></th>
                  {comparedItems.map(item => (
                    <th key={item.id} className="text-center px-2 py-1.5 min-w-[72px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                          <img
                            src={item.imageUrl || 'https://via.placeholder.com/40x40?text=No+Image'}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <TruncatedText
                          text={item.name}
                          maxLength={10}
                          className="font-medium text-gray-900 text-[10px]"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Weight row */}
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 text-gray-500">Weight</td>
                  {comparedItems.map(item => {
                    const weight = item.totalWeight || 0;
                    const isMin = analysis && weight === analysis.minWeight;
                    const isMax = analysis && weight === analysis.maxWeight;
                    return (
                      <td key={item.id} className="text-center px-2 py-1.5">
                        <span
                          className="font-semibold text-gray-900"
                          style={isMin ? { color: successTone.text } : isMax ? { color: errorTone.text } : undefined}
                        >
                          {weight}g
                          {isMin && <span className="ml-0.5 text-[9px]">★</span>}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {/* Price row */}
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 text-gray-500">Price</td>
                  {comparedItems.map(item => {
                    const price = item.totalPrice || 0;
                    const isMin = analysis && price === analysis.minPrice;
                    const isMax = analysis && price === analysis.maxPrice;
                    return (
                      <td key={item.id} className="text-center px-2 py-1.5">
                        <span
                          className="font-semibold text-gray-900"
                          style={isMin ? { color: successTone.text } : isMax ? { color: errorTone.text } : undefined}
                        >
                          {formatPrice(price)}
                          {isMin && <span className="ml-0.5 text-[9px]">★</span>}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {/* Priority row */}
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 text-gray-500">Priority</td>
                  {comparedItems.map(item => (
                    <td key={item.id} className="text-center px-2 py-1.5">
                      <span className="font-medium text-gray-900">
                        P{item.priority}
                      </span>
                    </td>
                  ))}
                </tr>
                {/* Category row */}
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 text-gray-500">Category</td>
                  {comparedItems.map(item => (
                    <td key={item.id} className="text-center px-2 py-1.5">
                      {item.category ? (
                        <span
                          className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={getCategoryBadgeStyle(item.category.color || COLORS.gray[500])}
                        >
                          {item.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                {/* Brand row */}
                <tr>
                  <td className="py-1.5 pr-2 text-gray-500">Brand</td>
                  {comparedItems.map(item => (
                    <td key={item.id} className="text-center px-2 py-1.5">
                      <span className="text-gray-700 text-[10px]">
                        {item.brand || '-'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Difference summary */}
          {analysis && (
            <div className="flex gap-3 text-xs text-gray-500">
              <span>Δ Weight: <span className="font-semibold text-gray-700">{analysis.weightDiff}g</span></span>
              <span>Δ Price: <span className="font-semibold text-gray-700">{formatPrice(analysis.priceDiff)}</span></span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200" />
        </>
      )}

      {/* Selectable item list */}
      <div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-2">
          <span>ITEMS</span>
          <span className="font-semibold text-gray-900">{selectedItems.length} / 4</span>
        </div>
        <div className="space-y-1.5">
          {sortedItems.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No items
            </p>
          ) : (
            sortedItems.map(item => {
              const isSelected = selectedItems.includes(item.id);
              const imageUrl = item.imageUrl || 'https://via.placeholder.com/48x48?text=No+Image';

              return (
                <button
                  key={item.id}
                  onClick={() => handleToggleSelect(item.id)}
                  className={`w-full px-3 py-3 rounded border transition-all text-left ${
                    isSelected
                      ? 'border-gray-500 bg-gray-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="grid gap-3" style={{ gridTemplateColumns: '20px 48px minmax(100px, 1fr) 80px' }}>
                    {/* Checkbox */}
                    <div className="flex items-center justify-center">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-gray-700 bg-gray-700'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>

                    {/* Name and brand */}
                    <div className="min-w-0 flex flex-col justify-center">
                      <TruncatedText
                        text={item.name}
                        maxLength={25}
                        className="text-xs font-medium text-gray-900 leading-tight"
                      />
                      {item.brand && (
                        <div className="text-xs text-gray-500 mt-1 truncate leading-tight opacity-75">
                          {item.brand}
                        </div>
                      )}
                    </div>

                    {/* Weight and price */}
                    <div className="text-right flex flex-col justify-center">
                      <div className="text-xs font-semibold text-gray-900 leading-tight whitespace-nowrap">
                        {item.totalWeight}g
                      </div>
                      <div className="text-xs text-gray-500 mt-1 leading-tight whitespace-nowrap">
                        {formatPrice(item.totalPrice || 0)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CompareView);
