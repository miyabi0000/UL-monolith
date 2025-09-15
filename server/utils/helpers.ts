// Helper functions
export const sanitizeGearData = (data: any) => {
  return {
    name: data.name?.trim() || '',
    brand: data.brand?.trim() || undefined,
    productUrl: data.productUrl?.trim() || undefined,
    categoryId: data.categoryId?.trim() || undefined,
    requiredQuantity: Math.max(1, Math.min(10, parseInt(data.requiredQuantity) || 1)),
    ownedQuantity: Math.max(0, Math.min(10, parseInt(data.ownedQuantity) || 0)),
    weightGrams: data.weightGrams ? Math.max(0, parseInt(data.weightGrams)) : undefined,
    priceCents: data.priceCents ? Math.max(0, parseInt(data.priceCents)) : undefined,
    season: data.season?.trim() || undefined,
    priority: Math.max(1, Math.min(5, parseInt(data.priority) || 3))
  };
};

export const calculateGearFields = (item: any) => {
  return {
    ...item,
    shortage: item.requiredQuantity - item.ownedQuantity,
    totalWeight: (item.weightGrams || 0) * item.requiredQuantity
  };
};