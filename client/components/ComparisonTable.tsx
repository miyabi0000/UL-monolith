import React from 'react';
import { GearItemWithCalculated } from '../utils/types';
import { Currency, formatPriceWithCurrency, calculateEfficiency } from '../utils/formatters';

interface ComparisonTableProps {
  items: GearItemWithCalculated[];
  currency?: Currency;
  onCurrencyChange?: () => void;
  onClose: () => void;
  onAdopt: (itemId: string) => void;
  onPreviewAdopt?: (itemId: string | null) => void;
  previewItemId?: string | null;
}

/**
 * 縦型比較テーブルコンポーネント
 * GearViewとGearTableで共有
 */
export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  items,
  currency = 'JPY',
  onCurrencyChange,
  onClose,
  onAdopt,
  onPreviewAdopt,
  previewItemId
}) => {
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Compare ({items.length} items)
          </h2>
          {items[0]?.category?.name && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {items[0].category.name}
            </span>
          )}
        </div>
      </div>

      {/* 比較テーブル - 横・縦スクロール可能 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: '600px' }}>
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                Item
              </th>
              {items.map(item => (
                <th
                  key={item.id}
                  className="px-2 py-2 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 min-w-[140px]"
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-xs">{item.name}</div>
                  {item.brand && (
                    <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">{item.brand}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* 画像 */}
            {items.some(item => item.imageUrl) && (
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
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
                      <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                    )}
                  </td>
                ))}
              </tr>
            )}

            {/* 重量 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                Weight
              </td>
              {items.map(item => {
                const isBest = item.weightGrams && item.weightGrams === bestValues.lightestWeight;
                return (
                  <td
                    key={item.id}
                    className={`px-2 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {item.weightGrams ? `${item.weightGrams}g` : '-'}
                  </td>
                );
              })}
            </tr>

            {/* 価格 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                Price
              </td>
              {items.map(item => {
                const isBest = item.priceCents && item.priceCents === bestValues.lowestPrice;
                return (
                  <td
                    key={item.id}
                    className={`px-2 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {formatPriceWithCurrency(item.priceCents, currency)}
                  </td>
                );
              })}
            </tr>

            {/* コスパ */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                (g/{currency === 'JPY' ? '¥' : '$'})
              </td>
              {items.map(item => {
                const effValue = calculateEfficiency(item.weightGrams, item.priceCents, currency);
                const effNum = parseFloat(effValue);
                const isBest = !isNaN(effNum) && effNum === bestValues.bestEfficiency;
                return (
                  <td
                    key={item.id}
                    className={`px-2 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {effValue}
                  </td>
                );
              })}
            </tr>

            {/* 所持数 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                Owned
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center text-xs text-gray-900 dark:text-gray-100">
                  {item.ownedQuantity}
                </td>
              ))}
            </tr>

            {/* 必要数 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                Required
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center text-xs text-gray-900 dark:text-gray-100">
                  {item.requiredQuantity}
                </td>
              ))}
            </tr>

            {/* 季節 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                Season
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center">
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {item.seasons && item.seasons.length > 0 ? (
                      item.seasons.map(season => (
                        <span
                          key={season}
                          className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {season}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* URL */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                Link
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center">
                  {item.productUrl ? (
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                    >
                      Product
                    </a>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                  )}
                </td>
              ))}
            </tr>

            {/* 採用時の影響 */}
            <tr className="bg-amber-50 dark:bg-amber-900/20">
              <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                Impact
              </td>
              {items.map(item => (
                <td key={item.id} className="px-2 py-2 text-center">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Weight:</span>
                      <span className={`text-xs font-medium ${item.weightGrams ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
                        {item.weightGrams ? `+${item.weightGrams}g` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Cost:</span>
                      <span className={`text-xs font-medium ${item.priceCents ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
                        {item.priceCents ? `+${formatPriceWithCurrency(item.priceCents, currency)}` : '-'}
                      </span>
                    </div>
                  </div>
                </td>
              ))}
            </tr>

            {/* アクション */}
            <tr className="bg-blue-50 dark:bg-blue-900/20">
              <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                Action
              </td>
              {items.map(item => {
                const isPreviewing = previewItemId === item.id;
                return (
                  <td key={item.id} className="px-2 py-2 text-center">
                    {isPreviewing ? (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => onAdopt(item.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors shadow-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => onPreviewAdopt?.(null)}
                          className="px-3 py-1 text-[10px] font-medium rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onPreviewAdopt?.(item.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shadow-sm ${
                          previewItemId
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        disabled={!!previewItemId}
                      >
                        Adopt
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
