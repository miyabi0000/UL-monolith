import { Router } from 'express';
import { gearItems, categories } from '../data/store';

const router = Router();

// Get analytics summary
router.get('/summary', (req, res) => {
  try {
    let totalWeight = 0;
    let totalPrice = 0;
    let missingItems = 0;
    const categoryMap = new Map();

    gearItems.forEach(item => {
      const weight = (item.weightGrams || 0) * item.requiredQuantity;
      const price = item.priceCents || 0;
      const shortage = item.requiredQuantity - item.ownedQuantity;

      totalWeight += weight;
      totalPrice += price;
      if (shortage > 0) missingItems++;

      // Category aggregation for chart
      const category = categories.find(cat => cat.id === item.categoryId);
      const categoryName = category?.name || 'Other';
      const categoryColor = category?.color || '#6B7280';
      
      const existing = categoryMap.get(categoryName) || { 
        weight: 0, 
        items: [],
        color: categoryColor 
      };
      existing.weight += weight;
      existing.items.push({
        ...item,
        category,
        shortage,
        totalWeight: weight
      });
      categoryMap.set(categoryName, existing);
    });

    const chartData = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      value: data.weight,
      color: data.color,
      items: data.items
    }));

    res.json({
      success: true,
      data: {
        totalWeight,
        totalPrice,
        missingItems,
        totalItems: gearItems.length,
        chartData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;