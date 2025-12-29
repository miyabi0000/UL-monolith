import React from 'react';
import { GearItemWithCalculated } from '../utils/types';
import { COLORS, SPACING_SCALE, FONT_SCALE, RADIUS_SCALE } from '../utils/designSystem';
import Card from './ui/Card';

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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: COLORS.background,
        padding: `${SPACING_SCALE.lg}px`
      }}
    >
      {/* ヘッダー */}
      <Card variant="default">
        <div
          className="flex items-center justify-between"
          style={{
            padding: `${SPACING_SCALE.lg}px`
          }}
        >
          <div>
            <h2
              className="font-bold"
              style={{
                fontSize: `${FONT_SCALE.lg}px`,
                marginBottom: `${SPACING_SCALE.xs}px`,
                color: COLORS.text.primary
              }}
            >
              Comparison View ({items.length} items)
            </h2>
            <p
              style={{
                fontSize: `${FONT_SCALE.sm}px`,
                color: COLORS.text.secondary
              }}
            >
              {items[0]?.category?.name || 'No category'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-medium transition-colors"
            style={{
              padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.lg}px`,
              fontSize: `${FONT_SCALE.base}px`,
              borderRadius: `${RADIUS_SCALE.base}px`,
              backgroundColor: COLORS.gray[200],
              color: COLORS.gray[700]
            }}
          >
            ← Back
          </button>
        </div>
      </Card>

      {/* 比較テーブル（縦型レイアウト） */}
      <div style={{ marginTop: `${SPACING_SCALE.lg}px`, overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            minWidth: `${Math.max(600, items.length * 250)}px`,
            borderCollapse: 'separate',
            borderSpacing: 0,
            tableLayout: 'fixed' // 均等割り付け
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: COLORS.gray[50]
              }}
            >
              <th
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: COLORS.gray[50],
                  padding: `${SPACING_SCALE.md}px`,
                  textAlign: 'center',
                  fontSize: `${FONT_SCALE.sm}px`,
                  fontWeight: 600,
                  color: COLORS.text.secondary,
                  borderBottom: `1px solid ${COLORS.gray[200]}`,
                  width: '150px',
                  zIndex: 10
                }}
              >
                Item
              </th>
              {items.map(item => (
                <th
                  key={item.id}
                  style={{
                    padding: `${SPACING_SCALE.md}px`,
                    textAlign: 'center',
                    fontSize: `${FONT_SCALE.base}px`,
                    fontWeight: 600,
                    color: COLORS.text.primary,
                    borderBottom: `1px solid ${COLORS.gray[200]}`,
                    position: 'relative'
                  }}
                >
                  <button
                    onClick={() => onRemove(item.id)}
                    style={{
                      position: 'absolute',
                      top: `${SPACING_SCALE.xs}px`,
                      right: `${SPACING_SCALE.xs}px`,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: COLORS.gray[700],
                      color: COLORS.white,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: `${FONT_SCALE.base}px`,
                      lineHeight: '1'
                    }}
                    title="削除"
                  >
                    ×
                  </button>
                  <div style={{ paddingRight: '30px' }}>
                    {item.name}
                  </div>
                  {item.brand && (
                    <div
                      style={{
                        fontSize: `${FONT_SCALE.sm}px`,
                        color: COLORS.text.secondary,
                        fontWeight: 400,
                        marginTop: `${SPACING_SCALE.xs}px`
                      }}
                    >
                      {item.brand}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 画像 */}
            <tr>
              <td
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: COLORS.surface,
                  padding: `${SPACING_SCALE.md}px`,
                  fontSize: `${FONT_SCALE.sm}px`,
                  fontWeight: 600,
                  color: COLORS.text.primary,
                  borderBottom: `1px solid ${COLORS.gray[200]}`,
                  textAlign: 'center'
                }}
              >
                Image
              </td>
              {items.map(item => (
                <td
                  key={item.id}
                  style={{
                    padding: `${SPACING_SCALE.md}px`,
                    textAlign: 'center',
                    borderBottom: `1px solid ${COLORS.gray[200]}`
                  }}
                >
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/200x200?text=No+Image'}
                    alt={item.name}
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      height: 'auto',
                      borderRadius: `${RADIUS_SCALE.base}px`,
                      margin: '0 auto',
                      display: 'block'
                    }}
                  />
                </td>
              ))}
            </tr>

            {/* カテゴリ */}
            <tr style={{ backgroundColor: COLORS.gray[50] }}>
              <td
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: COLORS.gray[50],
                  padding: `${SPACING_SCALE.md}px`,
                  fontSize: `${FONT_SCALE.sm}px`,
                  fontWeight: 600,
                  color: COLORS.text.primary,
                  borderBottom: `1px solid ${COLORS.gray[200]}`,
                  textAlign: 'center'
                }}
              >
                Category
              </td>
              {items.map(item => (
                <td
                  key={item.id}
                  style={{
                    padding: `${SPACING_SCALE.md}px`,
                    textAlign: 'center',
                    fontSize: `${FONT_SCALE.base}px`,
                    color: COLORS.text.primary,
                    borderBottom: `1px solid ${COLORS.gray[200]}`
                  }}
                >
                  {item.category?.name || '—'}
                </td>
              ))}
            </tr>

            {/* 価格 */}
            <tr>
              <td
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: COLORS.surface,
                  padding: `${SPACING_SCALE.md}px`,
                  fontSize: `${FONT_SCALE.sm}px`,
                  fontWeight: 600,
                  color: COLORS.text.primary,
                  borderBottom: `1px solid ${COLORS.gray[200]}`,
                  textAlign: 'center'
                }}
              >
                Price
              </td>
              {items.map(item => (
                <td
                  key={item.id}
                  style={{
                    padding: `${SPACING_SCALE.md}px`,
                    textAlign: 'center',
                    fontSize: `${FONT_SCALE.lg}px`,
                    fontWeight: 700,
                    color: COLORS.text.primary,
                    borderBottom: `1px solid ${COLORS.gray[200]}`
                  }}
                >
                  {item.priceCents ? `¥${Math.round(item.priceCents / 100).toLocaleString()}` : '—'}
                </td>
              ))}
            </tr>

            {/* 重量 */}
            <tr style={{ backgroundColor: COLORS.gray[50] }}>
              <td
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: COLORS.gray[50],
                  padding: `${SPACING_SCALE.md}px`,
                  fontSize: `${FONT_SCALE.sm}px`,
                  fontWeight: 600,
                  color: COLORS.text.primary,
                  borderBottom: `1px solid ${COLORS.gray[200]}`,
                  textAlign: 'center'
                }}
              >
                Weight
              </td>
              {items.map(item => (
                <td
                  key={item.id}
                  style={{
                    padding: `${SPACING_SCALE.md}px`,
                    textAlign: 'center',
                    fontSize: `${FONT_SCALE.lg}px`,
                    fontWeight: 700,
                    color: COLORS.text.primary,
                    borderBottom: `1px solid ${COLORS.gray[200]}`
                  }}
                >
                  {item.weightGrams ? `${item.weightGrams}g` : '—'}
                </td>
              ))}
            </tr>

            {/* 効率 */}
            <tr>
              <td
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: COLORS.surface,
                  padding: `${SPACING_SCALE.md}px`,
                  fontSize: `${FONT_SCALE.sm}px`,
                  fontWeight: 600,
                  color: COLORS.text.primary,
                  borderBottom: `1px solid ${COLORS.gray[200]}`,
                  textAlign: 'center'
                }}
              >
                Efficiency (g/¥)
              </td>
              {items.map(item => {
                const efficiency = item.weightGrams && item.priceCents
                  ? (item.weightGrams / (item.priceCents / 100))
                  : null;
                return (
                  <td
                    key={item.id}
                    style={{
                      padding: `${SPACING_SCALE.md}px`,
                      textAlign: 'center',
                      fontSize: `${FONT_SCALE.lg}px`,
                      fontWeight: 700,
                      color: COLORS.text.primary,
                      borderBottom: `1px solid ${COLORS.gray[200]}`,
                      backgroundColor: COLORS.surface
                    }}
                  >
                    {efficiency ? efficiency.toFixed(3) : '—'}
                  </td>
                );
              })}
            </tr>

            {/* 季節 */}
            <tr style={{ backgroundColor: COLORS.gray[50] }}>
              <td
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: COLORS.gray[50],
                  padding: `${SPACING_SCALE.md}px`,
                  fontSize: `${FONT_SCALE.sm}px`,
                  fontWeight: 600,
                  color: COLORS.text.primary,
                  borderBottom: `1px solid ${COLORS.gray[200]}`,
                  textAlign: 'center'
                }}
              >
                Season
              </td>
              {items.map(item => (
                <td
                  key={item.id}
                  style={{
                    padding: `${SPACING_SCALE.md}px`,
                    textAlign: 'center',
                    fontSize: `${FONT_SCALE.base}px`,
                    color: COLORS.text.primary,
                    borderBottom: `1px solid ${COLORS.gray[200]}`
                  }}
                >
                  {item.seasons && item.seasons.length > 0 ? item.seasons.join(', ') : '—'}
                </td>
              ))}
            </tr>

            {/* 所持/必要 */}
            <tr>
              <td
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: COLORS.surface,
                  padding: `${SPACING_SCALE.md}px`,
                  fontSize: `${FONT_SCALE.sm}px`,
                  fontWeight: 600,
                  color: COLORS.text.primary,
                  borderBottom: `1px solid ${COLORS.gray[200]}`,
                  textAlign: 'center'
                }}
              >
                Owned/Required
              </td>
              {items.map(item => (
                <td
                  key={item.id}
                  style={{
                    padding: `${SPACING_SCALE.md}px`,
                    textAlign: 'center',
                    fontSize: `${FONT_SCALE.base}px`,
                    fontWeight: 600,
                    color: COLORS.text.primary,
                    borderBottom: `1px solid ${COLORS.gray[200]}`
                  }}
                >
                  {item.ownedQuantity} / {item.requiredQuantity}
                </td>
              ))}
            </tr>

            {/* アクション */}
            <tr style={{ backgroundColor: COLORS.gray[50] }}>
              <td
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: COLORS.gray[50],
                  padding: `${SPACING_SCALE.md}px`,
                  fontSize: `${FONT_SCALE.sm}px`,
                  fontWeight: 600,
                  color: COLORS.text.primary,
                  textAlign: 'center'
                }}
              >
                Actions
              </td>
              {items.map(item => (
                <td
                  key={item.id}
                  style={{
                    padding: `${SPACING_SCALE.md}px`,
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: `${SPACING_SCALE.sm}px`,
                      alignItems: 'stretch'
                    }}
                  >
                    <button
                      onClick={() => onAdopt(item.id)}
                      style={{
                        padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.md}px`,
                        fontSize: `${FONT_SCALE.base}px`,
                        fontWeight: 600,
                        borderRadius: `${RADIUS_SCALE.base}px`,
                        backgroundColor: COLORS.gray[700],
                        color: COLORS.white,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Adopt
                    </button>
                    {item.productUrl && (
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.md}px`,
                          fontSize: `${FONT_SCALE.base}px`,
                          fontWeight: 600,
                          borderRadius: `${RADIUS_SCALE.base}px`,
                          backgroundColor: COLORS.gray[100],
                          color: COLORS.gray[700],
                          textDecoration: 'none',
                          display: 'block',
                          textAlign: 'center'
                        }}
                      >
                        View
                      </a>
                    )}
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
