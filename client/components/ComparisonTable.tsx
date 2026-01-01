import React from 'react';
import { GearItemWithCalculated } from '../utils/types';

interface ComparisonTableProps {
  items: GearItemWithCalculated[];
  onClose: () => void;
  onRemove: (itemId: string) => void;
  onAdopt: (itemId: string) => void;
}

/**
 * 縦型比較テーブルコンポーネント
 * GearViewとGearTableで共有
 */
export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  items,
  onClose,
  onRemove,
  onAdopt
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              比較表示 ({items.length}件)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {items[0]?.category?.name || 'カテゴリ未設定'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← 戻る
          </button>
        </div>
      </div>

      {/* 比較テーブル */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                項目
              </th>
              {items.map(item => (
                <th
                  key={item.id}
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 relative min-w-[200px]"
                >
                  <button
                    onClick={() => onRemove(item.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm transition-colors"
                    title="削除"
                  >
                    ×
                  </button>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</div>
                  {item.brand && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.brand}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* 画像 */}
            {items.some(item => item.imageUrl) && (
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  画像
                </td>
                {items.map(item => (
                  <td key={item.id} className="px-6 py-4 text-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-24 h-24 object-contain rounded mx-auto"
                      />
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                    )}
                  </td>
                ))}
              </tr>
            )}

            {/* 重量 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                重量
              </td>
              {items.map(item => (
                <td key={item.id} className="px-6 py-4 text-center text-gray-900 dark:text-gray-100">
                  {item.weightGrams ? `${item.weightGrams}g` : '-'}
                </td>
              ))}
            </tr>

            {/* 価格 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                価格
              </td>
              {items.map(item => (
                <td key={item.id} className="px-6 py-4 text-center text-gray-900 dark:text-gray-100">
                  {item.priceCents ? `¥${(item.priceCents / 100).toLocaleString()}` : '-'}
                </td>
              ))}
            </tr>

            {/* コスパ (g/¥) */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                コスパ (g/¥)
              </td>
              {items.map(item => {
                const efficiency = item.weightGrams && item.priceCents
                  ? (item.weightGrams / (item.priceCents / 100)).toFixed(2)
                  : null;
                return (
                  <td key={item.id} className="px-6 py-4 text-center text-gray-900 dark:text-gray-100">
                    {efficiency || '-'}
                  </td>
                );
              })}
            </tr>

            {/* 所持数 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                所持数
              </td>
              {items.map(item => (
                <td key={item.id} className="px-6 py-4 text-center text-gray-900 dark:text-gray-100">
                  {item.ownedQuantity}
                </td>
              ))}
            </tr>

            {/* 必要数 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                必要数
              </td>
              {items.map(item => (
                <td key={item.id} className="px-6 py-4 text-center text-gray-900 dark:text-gray-100">
                  {item.requiredQuantity}
                </td>
              ))}
            </tr>

            {/* 季節 */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                季節
              </td>
              {items.map(item => (
                <td key={item.id} className="px-6 py-4 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {item.seasons && item.seasons.length > 0 ? (
                      item.seasons.map(season => (
                        <span
                          key={season}
                          className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {season}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* URL */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                URL
              </td>
              {items.map(item => (
                <td key={item.id} className="px-6 py-4 text-center">
                  {item.productUrl ? (
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      商品ページ
                    </a>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                  )}
                </td>
              ))}
            </tr>

            {/* アクション */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                アクション
              </td>
              {items.map(item => (
                <td key={item.id} className="px-6 py-4 text-center">
                  <button
                    onClick={() => onAdopt(item.id)}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    採用 (+1)
                  </button>
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
