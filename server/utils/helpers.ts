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
  const requiredQuantity = item.requiredQuantity || 1;
  const ownedQuantity = item.ownedQuantity || 0;
  const weightGrams = item.weightGrams || 0;
  const priceCents = item.priceCents || 0;

  return {
    ...item,
    shortage: requiredQuantity - ownedQuantity,
    totalWeight: weightGrams * requiredQuantity,
    totalPrice: priceCents * requiredQuantity,
    missingQuantity: Math.max(0, requiredQuantity - ownedQuantity)
  };
};