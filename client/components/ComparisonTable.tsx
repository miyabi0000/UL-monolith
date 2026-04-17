import React from 'react';
import { GearItemWithCalculated } from '../utils/types';
import { Currency, formatPriceWithCurrency, calculateEfficiency } from '../utils/formatters';
import { STATUS_TONES } from '../utils/designSystem';
import { formatWeight } from '../utils/weightUnit';
import { useWeightUnit } from '../contexts/WeightUnitContext';

interface ComparisonTableProps {
  items: GearItemWithCalculated[];
  currency?: Currency;
  onCurrencyChange?: () => void;
  onClose: () => void;
  onDelete: (itemId: string) => void;
  onRaisePriority: (itemId: string) => Promise<void>;
  onRemove?: (itemId: string) => void;
}

// A/B/C/D ラベル
const ITEM_LABELS = ['A', 'B', 'C', 'D'];

/**
 * 縦型比較テーブルコンポーネント
 * GearViewとGearTableで共有
 */
export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  items,
  currency = 'JPY',
  onCurrencyChange,
  onClose,
  onDelete,
  onRaisePriority,
  onRemove
}) => {
  const successTone = STATUS_TONES.success;
  const { unit } = useWeightUnit();

  // 最良値を計算
  const bestValues = React.useMemo(() => {
    const weights = items.map(i => i.weightGrams).filter(Boolean) as number[];
    const prices = items.map(i => i.priceCents).filter(Boolean) as number[];
    const efficiencies = items
      .filter(i => i.weightGrams && i.priceCents)
      .map(i => parseFloat(calculateEfficiency(i.weightGrams, i.priceCents, currency)))
      .filter(e => !isNaN(e));

    return {
      lightestWeight: weights.length > 0 ? Math.min(...weights) : null,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
      bestEfficiency: efficiencies.length > 0 ? Math.max(...efficiencies) : null,
    };
  }, [items, currency]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            ← Back
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            Compare ({items.length} items)
          </h2>
          {items[0]?.category?.name && (
            <span className="text-xs text-gray-500">
              {items[0].category.name}
            </span>
          )}
        </div>
      </div>

      {/* 比較テーブル - 横・縦スクロール可能、均等割付 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 border-b border-gray-200 w-20">
                Item
              </th>
              {items.map((item, index) => (
                <th
                  key={item.id}
                  className="px-2 py-2 text-center text-xs font-semibold text-gray-900 border-b border-gray-200"
                >
                  <div className="flex items-start justify-between gap-1">
                    {/* A/B/C/D ラベル */}
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-2xs font-bold flex-shrink-0">
                      {ITEM_LABELS[index] || index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-xs truncate">{item.name}</div>
                      {item.brand && (
                        <div className="text-2xs text-gray-600 mt-0.5 truncate">{item.brand}</div>
                      )}
                    </div>
                    {/* 削除ボタン */}
                    {onRemove && items.length > 2 && (
                      <button
                        onClick={() => onRemove(item.id)}
                        className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
                        title="Remove from comparison"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 画像 */}
            {items.some(item => item.imageUrl) && (
              <tr className="hover:bg-gray-50">
                <td className="px-2 py-2 text-xs font-medium text-gray-900">
                  Image
                </td>
                {items.map(item => (
                  <td key={item.id} className="px-2 py-2 text-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 object-contain rounded mx-auto"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                ))}
              </tr>
            )}

            {/* 重量 */}
            <tr className="hover:bg-gray-50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                Weight
              </td>
              {items.map(item => {
                const isBest = item.weightGrams && item.weightGrams === bestValues.lightestWeight;
                return (
                  <td
                    key={item.id}
                    className={`px-2 py-2 text-center text-xs ${isBest ? 'font-semibold' : 'text-gray-900'}`}
                    style={isBest ? { backgroundColor: successTone.background, color: successTone.text } : undefined}
                  >
                    {item.weightGrams ? formatWeight(item.weightGrams, unit) : '-'}
                  </td>
                );
              })}
            </tr>

            {/* 価格 */}
            <tr className="hover:bg-gray-50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                Price
              </td>
              {items.map(item => {
                const isBest = item.priceCents && item.priceCents === bestValues.lowestPrice;
                return (
                  <td
                    key={item.id}
                    className={`px-2 py-2 text-center text-xs ${isBest ? 'font-semibold' : 'text-gray-900'}`}
                    style={isBest ? { backgroundColor: successTone.background, color: successTone.text } : undefined}
                  >
                    {formatPriceWithCurrency(item.priceCents, currency)}
                  </td>
                );
              })}
            </tr>

            {/* コスパ */}
            <tr className="hover:bg-gray-50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                (g/{currency === 'JPY' ? '¥' : '$'})
              </td>
              {items.map(item => {
                const effValue = calculateEfficiency(item.weightGrams, item.priceCents, currency);
                const effNum = parseFloat(effValue);
                const isBest = !isNaN(effNum) && effNum === bestValues.bestEfficiency;
                return (
                  <td
                    key={item.id}
                    className={`px-2 py-2 text-center text-xs ${isBest ? 'font-semibold' : 'text-gray-900'}`}
                    style={isBest ? { backgroundColor: successTone.background, color: successTone.text } : undefined}
                  >
                    {effValue}
                  </td>
                );
              })}
            </tr>

            {/* 所持数 */}
            <tr className="hover:bg-gray-50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                Owned
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center text-xs text-gray-900">
                  {item.ownedQuantity}
                </td>
              ))}
            </tr>

            {/* 必要数 */}
            <tr className="hover:bg-gray-50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                Required
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center text-xs text-gray-900">
                  {item.requiredQuantity}
                </td>
              ))}
            </tr>

            {/* 季節 */}
            <tr className="hover:bg-gray-50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                Season
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center">
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {item.seasons && item.seasons.length > 0 ? (
                      item.seasons.map(season => (
                        <span
                          key={season}
                          className="px-1.5 py-0.5 text-2xs rounded-full bg-gray-200 text-gray-700"
                        >
                          {season}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* URL */}
            <tr className="hover:bg-gray-50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                Link
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center">
                  {item.productUrl ? (
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:underline text-xs"
                    >
                      Product
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
              ))}
            </tr>

            {/* アクション: 削除 / 優先度を上げる */}
            <tr className="bg-gray-50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                Action
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center">
                  <div className="flex flex-col gap-1.5 items-center">
                    {/* 優先度を最高に上げる */}
                    <button
                      onClick={() => onRaisePriority(item.id)}
                      disabled={item.priority === 1}
                      className="w-full px-2 py-1.5 text-xs font-semibold rounded-md transition-colors shadow-sm bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      title="優先度を最高(P1)に設定"
                    >
                      {item.priority === 1 ? 'P1 ✓' : '↑ Priority'}
                    </button>
                    {/* ギアリストから削除 */}
                    <button
                      onClick={() => onDelete(item.id)}
                      className="w-full px-2 py-1.5 text-xs font-medium rounded-md transition-colors bg-white shadow-sm text-gray-600 hover:bg-red-50 hover:text-red-600"
                      title="ギアリストから削除"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
