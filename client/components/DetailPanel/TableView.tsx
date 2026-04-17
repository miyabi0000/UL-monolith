import React, { useMemo } from 'react';
import { GearItemWithCalculated } from '../../utils/types';
import { COLORS } from '../../utils/designSystem';
import { formatPrice } from '../../utils/formatters';
import { formatWeight } from '../../utils/weightUnit';
import { useWeightUnit } from '../../contexts/WeightUnitContext';
import TruncatedText from '../TruncatedText';

interface TableViewProps {
  items: GearItemWithCalculated[];
  viewMode: 'weight' | 'cost';
  onEdit: (item: GearItemWithCalculated) => void;
  onDelete: (id: string) => void;
  onItemClick?: (itemId: string) => void;
}

const TableView: React.FC<TableViewProps> = ({ items, viewMode, onEdit, onDelete, onItemClick }) => {
  const { unit } = useWeightUnit();
  // アイテムを重さ昇順でソート
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (a.totalWeight || 0) - (b.totalWeight || 0));
  }, [items]);

  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        totalWeight: 0,
        totalPrice: 0,
        itemCount: 0,
        shortageCount: 0,
        avgWeight: 0,
        maxWeightItem: null as GearItemWithCalculated | null,
        maxPriceItem: null as GearItemWithCalculated | null,
        highPriorityCount: 0,
      };
    }

    const totalWeight = items.reduce((sum, item) => sum + (item.totalWeight || 0), 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const shortageCount = items.reduce((sum, item) => sum + (item.shortage || 0), 0);
    const highPriorityCount = items.filter(item => item.priority === 1).length;

    let maxWeightItem = items[0];
    let maxPriceItem = items[0];

    items.forEach(item => {
      if ((item.totalWeight || 0) > (maxWeightItem.totalWeight || 0)) {
        maxWeightItem = item;
      }
      if ((item.totalPrice || 0) > (maxPriceItem.totalPrice || 0)) {
        maxPriceItem = item;
      }
    });

    return {
      totalWeight,
      totalPrice,
      itemCount: items.length,
      shortageCount,
      avgWeight: Math.round(totalWeight / items.length),
      maxWeightItem,
      maxPriceItem,
      highPriorityCount,
    };
  }, [items]);

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full w-full min-w-0">
      {/* 統計 */}
      <div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Weight</span>
            <span className="font-semibold text-gray-900">{formatWeight(stats.totalWeight, unit)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Price</span>
            <span className="font-semibold text-gray-900">{formatPrice(stats.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* 区切り線 */}
      <div className="border-b border-gray-200" />

      {/* アイテムリスト */}
      <div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-2">
          <span>ITEMS</span>
          <span className="font-semibold text-gray-900">{stats.itemCount}</span>
        </div>
        <div className="space-y-1.5">
          {sortedItems.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No items
            </p>
          ) : (
            sortedItems.map(item => {
              const imageUrl = item.imageUrl || 'https://via.placeholder.com/40x40?text=No+Image';
              const totalWeight = stats.totalWeight;
              const weightPercentage = totalWeight > 0
                ? Math.round((item.totalWeight / totalWeight) * 100)
                : 0;
              return (
                <div
                  key={item.id}
                  className="w-full px-3 py-3 rounded shadow-sm
                    hover:bg-gray-50 transition-colors"
                >
                  {/* Grid layout: Image | Name+Brand | Weight+Meta | Edit */}
                  <div className="grid gap-3 items-center grid-cols-[48px_minmax(100px,1fr)_80px_24px]">
                    {/* Image - clickable */}
                    <button
                      onClick={() => onItemClick?.(item.id)}
                      className="relative w-12 h-12 rounded overflow-hidden bg-gray-100"
                    >
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </button>

                    {/* Name and brand - clickable */}
                    <button
                      onClick={() => onItemClick?.(item.id)}
                      className="min-w-0 flex flex-col justify-center text-left"
                    >
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
                    </button>

                    {/* Weight and meta */}
                    <div className="text-right flex flex-col justify-center">
                      <div className="text-xs font-semibold text-gray-900 leading-tight whitespace-nowrap">
                        {formatWeight(item.totalWeight, unit)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 leading-tight whitespace-nowrap">
                        <span className="font-medium">{weightPercentage}%</span>
                        <span className="ml-1.5">P{item.priority}</span>
                      </div>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TableView);
