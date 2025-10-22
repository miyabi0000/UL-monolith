import { GearItemWithCalculated, ChartData } from './types';

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

export const calculateChartData = (gearItems: GearItemWithCalculated[]): ChartData[] => {
  const categoryTotals = gearItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other';
    const categoryColor = item.category?.color || '#6B7280';
    if (!acc[categoryName]) {
      acc[categoryName] = { weight: 0, price: 0, count: 0, items: [], color: categoryColor };
    }
    acc[categoryName].weight += item.totalWeight;
    acc[categoryName].price += item.totalPrice;
    acc[categoryName].count += item.requiredQuantity;
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

export const calculateTotals = (gearItems: GearItemWithCalculated[]) => {
  return gearItems.reduce(
    (totals, item) => ({
      weight: totals.weight + item.totalWeight,
      price: totals.price + item.totalPrice,
      items: totals.items + item.requiredQuantity,
      missing: totals.missing + item.missingQuantity
    }),
    { weight: 0, price: 0, items: 0, missing: 0 }
  );
};