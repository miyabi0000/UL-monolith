import { Router } from 'express';
import { db } from '../database/connection';

const router = Router();

router.get('/summary', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
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

export default router;
