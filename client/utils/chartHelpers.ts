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
    if (!acc[categoryName]) {
      acc[categoryName] = { weight: 0, price: 0, count: 0 };
    }
    acc[categoryName].weight += item.totalWeight;
    acc[categoryName].price += item.totalPrice;
    acc[categoryName].count += item.requiredQuantity;
    return acc;
  }, {} as Record<string, { weight: number; price: number; count: number }>);

  return Object.entries(categoryTotals).map(([name, data]) => ({
    name,
    weight: data.weight,
    price: data.price / 100,
    count: data.count,
    color: getCategoryColor(name)
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