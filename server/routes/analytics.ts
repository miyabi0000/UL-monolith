import { Router } from 'express';

// 暫定的なin-memoryデータ（テスト用）
let gearItems: any[] = [];

const router = Router();

// Get analytics summary - 暫定実装
router.get('/summary', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const userItems = gearItems.filter(item => item.userId === userId);
    
    const summary = {
      totalWeight: userItems.reduce((sum, item) => sum + (item.weightGrams || 0), 0),
      totalPrice: userItems.reduce((sum, item) => sum + (item.priceCents || 0), 0),
      totalItems: userItems.length,
      missingItems: userItems.filter(item => item.ownedQuantity < item.requiredQuantity).length,
      chartData: []
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;