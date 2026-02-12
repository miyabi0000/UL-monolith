import { GearItemWithCalculated, ChartData, QuantityDisplayMode } from './types';

export const getQuantityForDisplayMode = (
  item: GearItemWithCalculated,
  quantityDisplayMode: QuantityDisplayMode
): number => {
  if (quantityDisplayMode === 'owned') return item.ownedQuantity;
  if (quantityDisplayMode === 'all') return item.requiredQuantity;
  return Math.max(0, item.requiredQuantity - item.ownedQuantity);
};

export const getCategoryColor = (systemName: string): string => {
  const colorMap: { [key: string]: string } = {
    'Clothing': '#FF6B6B',
    'Sleep': '#4ECDC4',
    'Pack': '#FFE66D',
    'Electronics': '#4D96FF',
    'Hygiene': '#A66DFF'
  };
  return colorMap[systemName] || '#6B7280';
};

export const calculateChartData = (
  gearItems: GearItemWithCalculated[],
  quantityDisplayMode: QuantityDisplayMode = 'owned'
): ChartData[] => {
  const categoryTotals = gearItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other';
    const categoryColor = item.category?.color || '#6B7280';
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
