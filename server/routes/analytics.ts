import { Router } from 'express';
import { db } from '../database/connection';

const router = Router();

// デモユーザーID（認証実装までの仮ID）- gearルートと統一
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440100';

router.get('/summary', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || DEMO_USER_ID;
    const summary = await db.getAnalyticsSummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Weight Breakdown（データモデル仕様準拠）
 * Base/Worn/Consumables/Packed/SkinOut/Big3 の集計
 */
router.get('/weight-breakdown', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || DEMO_USER_ID;
    const breakdown = await db.getWeightBreakdown(userId);

    // UL分類を判定
    let classification: 'ultralight' | 'lightweight' | 'traditional';
    if (breakdown.baseWeight < 4500) {
      classification = 'ultralight';
    } else if (breakdown.baseWeight < 9000) {
      classification = 'lightweight';
    } else {
      classification = 'traditional';
    }

    res.json({
      success: true,
      data: {
        ...breakdown,
        ulStatus: {
          classification,
          baseWeight: breakdown.baseWeight,
          threshold: classification === 'ultralight' ? 4500 : 9000
        }
      }
    });
  } catch (error) {
    console.error('Error fetching weight breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weight breakdown',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
