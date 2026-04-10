import {
  GearItemWithCalculated,
  ChartData,
  QuantityDisplayMode,
  ChartScope,
  ChartFocus,
  DonutSegment,
  isBig3Category,
  DUAL_RING_COLORS,
  ChartViewMode
} from './types';
import { COLORS } from './designSystem';
import { convertFromGrams, WeightUnit } from './weightUnit';

/**
 * チャート軸ラベル用コンパクトフォーマット
 * 重量: g モードでは 1000g以上で kg、oz モードでは 16oz 以上で lb 表示
 * コスト: 10000円以上は 万 表示
 */
export const formatChartAxisValue = (value: number, viewMode: ChartViewMode, unit: WeightUnit = 'g'): string => {
  if (viewMode === 'cost') {
    const yen = Math.round(value / 100)
    return yen >= 10000 ? `¥${(yen / 10000).toFixed(1)}万` : `¥${yen.toLocaleString()}`
  }
  if (unit === 'oz') {
    const oz = convertFromGrams(value, 'oz')
    return oz >= 16 ? `${(oz / 16).toFixed(1)}lb` : `${oz}oz`
  }
  return value >= 1000 ? `${(value / 1000).toFixed(1)}kg` : `${value}g`
}

export const getQuantityForDisplayMode = (
  item: GearItemWithCalculated,
  quantityDisplayMode: QuantityDisplayMode
): number => {
  if (quantityDisplayMode === 'owned') return item.ownedQuantity;
  if (quantityDisplayMode === 'all') return item.requiredQuantity;
  return Math.max(0, item.requiredQuantity - item.ownedQuantity);
};

export const calculateChartData = (
  gearItems: GearItemWithCalculated[],
  quantityDisplayMode: QuantityDisplayMode = 'owned'
): ChartData[] => {
  const categoryTotals = gearItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other';
    const categoryColor = item.category?.color || COLORS.gray[500];
    if (!acc[categoryName]) {
      acc[categoryName] = { weight: 0, price: 0, count: 0, items: [], color: categoryColor };
    }

    // 数量表示モードに応じて計算する数量を切り替え
    // owned: 所持数 / need: 不足分 / all: 必要数（総数）
    const quantity = getQuantityForDisplayMode(item, quantityDisplayMode);
    const weight = (item.weightGrams || 0) * quantity;
    const price = (item.priceCents || 0) * quantity;

    acc[categoryName].weight += weight;
    acc[categoryName].price += price;
    acc[categoryName].count += quantity;
    acc[categoryName].items.push(item);
    return acc;
  }, {} as Record<string, { weight: number; price: number; count: number; items: GearItemWithCalculated[]; color: string }>);

  return Object.entries(categoryTotals).map(([name, data]) => ({
    name,
    value: data.weight, // デフォルトは重量
    weight: data.weight,
    cost: data.price,
    itemCount: data.count,
    color: data.color,
    items: data.items || []
  }));
};

export const calculateTotals = (
  gearItems: GearItemWithCalculated[],
  quantityDisplayMode: QuantityDisplayMode = 'owned'
) => {
  return gearItems.reduce(
    (totals, item) => {
      // owned: 所持数 / need: 不足分 / all: 必要数（総数）
      const quantity = getQuantityForDisplayMode(item, quantityDisplayMode);
      const weight = (item.weightGrams || 0) * quantity;
      const price = (item.priceCents || 0) * quantity;

      return {
        weight: totals.weight + weight,
        price: totals.price + price,
        items: totals.items + quantity,
        missing: totals.missing + item.missingQuantity
      };
    },
    { weight: 0, price: 0, items: 0, missing: 0 }
  );
};

// ==================== 二重ドーナツチャート用ヘルパー ====================

/**
 * スコープに基づいてアイテムをフィルタ
 * @param items 全アイテム
 * @param scope 'base' | 'packed' | 'skinout'
 */
export function filterByScope(
  items: GearItemWithCalculated[],
  scope: ChartScope
): GearItemWithCalculated[] {
  switch (scope) {
    case 'base':
      return items.filter(i => i.weightClass === 'base' || !i.weightClass);
    case 'packed':
      return items.filter(i =>
        i.weightClass === 'base' ||
        i.weightClass === 'consumable' ||
        !i.weightClass
      );
    case 'skinout':
      return items; // 全て
  }
}

/**
 * アイテムの重量合計を計算
 */
export function sumWeight(items: GearItemWithCalculated[]): number {
  return items.reduce((sum, i) => sum + (i.weightGrams || 0) * i.requiredQuantity, 0);
}

/**
 * Inner ring用データを計算（Big3 vs Other）
 */
export function calculateInnerRingData(
  items: GearItemWithCalculated[],
  scope: ChartScope
): DonutSegment[] {
  const scopedItems = filterByScope(items, scope);

  const big3Items = scopedItems.filter(i => isBig3Category(i.category));
  const otherItems = scopedItems.filter(i => !isBig3Category(i.category));

  const big3Weight = sumWeight(big3Items);
  const otherWeight = sumWeight(otherItems);

  return [
    {
      id: 'big3',
      label: 'Big3',
      value: big3Weight,
      color: DUAL_RING_COLORS.big3,
      isBig3: true,
      items: big3Items
    },
    {
      id: 'other',
      label: 'Other',
      value: otherWeight,
      color: DUAL_RING_COLORS.other,
      isBig3: false,
      items: otherItems
    }
  ].filter(s => s.value > 0);
}

/**
 * Big3内訳を計算（Pack/Shelter/Sleep）
 */
export function calculateBig3Breakdown(
  items: GearItemWithCalculated[]
): DonutSegment[] {
  const big3Items = items.filter(i => isBig3Category(i.category));

  const packItems = big3Items.filter(i => i.category?.tags?.includes('big3_pack'));
  const shelterItems = big3Items.filter(i => i.category?.tags?.includes('big3_shelter'));
  const sleepItems = big3Items.filter(i => i.category?.tags?.includes('big3_sleep'));

  return [
    {
      id: 'big3_pack',
      label: 'Pack',
      value: sumWeight(packItems),
      color: DUAL_RING_COLORS.big3_pack,
      isBig3: true,
      items: packItems
    },
    {
      id: 'big3_shelter',
      label: 'Shelter',
      value: sumWeight(shelterItems),
      color: DUAL_RING_COLORS.big3_shelter,
      isBig3: true,
      items: shelterItems
    },
    {
      id: 'big3_sleep',
      label: 'Sleep',
      value: sumWeight(sleepItems),
      color: DUAL_RING_COLORS.big3_sleep,
      isBig3: true,
      items: sleepItems
    }
  ].filter(s => s.value > 0);
}

/**
 * カテゴリ内訳を計算
 */
export function calculateCategoryBreakdown(
  items: GearItemWithCalculated[]
): DonutSegment[] {
  const categoryMap = new Map<string, { items: GearItemWithCalculated[]; color: string; name: string; isBig3: boolean }>();

  for (const item of items) {
    const categoryId = item.categoryId || 'uncategorized';
    const categoryName = item.category?.name || 'Other';
    const categoryColor = item.category?.color || COLORS.gray[500];
    const isBig3 = isBig3Category(item.category);

    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        items: [],
        color: categoryColor,
        name: categoryName,
        isBig3
      });
    }
    categoryMap.get(categoryId)!.items.push(item);
  }

  return Array.from(categoryMap.entries())
    .map(([id, data]) => ({
      id,
      label: data.name,
      value: sumWeight(data.items),
      color: data.color,
      isBig3: data.isBig3,
      items: data.items
    }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

/**
 * Outer ring用データを計算（Focus依存）
 */
export function calculateOuterRingData(
  items: GearItemWithCalculated[],
  scope: ChartScope,
  focus: ChartFocus
): DonutSegment[] {
  const scopedItems = filterByScope(items, scope);

  if (focus === 'big3') {
    return calculateBig3Breakdown(scopedItems);
  }

  if (focus === 'other') {
    const nonBig3Items = scopedItems.filter(i => !isBig3Category(i.category));
    return calculateCategoryBreakdown(nonBig3Items);
  }

  return calculateCategoryBreakdown(scopedItems);
}
