import { Router } from 'express';
import { db } from '../database/connection.js';
import { sendError, sendSuccess } from './shared/httpResponse.js';
import { getRequestUserId } from './shared/userContext.js';

const router = Router();

router.get('/summary', async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    const summary = await db.getAnalyticsSummary(userId);

    return sendSuccess(res, {
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return sendError(res, 'Failed to fetch analytics summary', error);
  }
});

/**
 * Weight Breakdown（データモデル仕様準拠）
 * Base/Worn/Consumables/Packed/SkinOut/Big3 の集計
 */
router.get('/weight-breakdown', async (req, res) => {
  try {
    const userId = getRequestUserId(req);
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

    return sendSuccess(res, {
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
    return sendError(res, 'Failed to fetch weight breakdown', error);
  }
});

export default router;
