import { Router, Request, Response } from 'express';
import { cognitoAuth, optionalAuth } from '../middleware/cognitoAuth.js';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ==================== パック CRUD ====================

// GET /api/v1/packs - ユーザーのパック一覧
router.get('/', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT p.*,
              COUNT(pi.gear_id)::int AS item_count,
              COALESCE(SUM(g.weight_grams * g.required_quantity), 0)::int AS total_weight
       FROM packs p
       LEFT JOIN pack_items pi ON p.id = pi.pack_id
       LEFT JOIN gear_items g ON pi.gear_id = g.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.updated_at DESC`,
      [req.userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching packs:');
    res.status(500).json({ success: false, message: 'Failed to fetch packs' });
  }
});

// POST /api/v1/packs - パック作成
router.post('/', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, routeName, isPublic } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Pack name is required' });
      return;
    }

    const result = await db.query(
      `INSERT INTO packs (user_id, name, description, route_name, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, name, description || null, routeName || null, isPublic || false]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error({ err: error }, 'Error creating pack:');
    res.status(500).json({ success: false, message: 'Failed to create pack' });
  }
});

// PUT /api/v1/packs/:id - パック更新
router.put('/:id', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, routeName, isPublic } = req.body;

    const result = await db.query(
      `UPDATE packs SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         route_name = COALESCE($3, route_name),
         is_public = COALESCE($4, is_public)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, description, routeName, isPublic, id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pack not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error({ err: error }, 'Error updating pack:');
    res.status(500).json({ success: false, message: 'Failed to update pack' });
  }
});

// DELETE /api/v1/packs/:id - パック削除
router.delete('/:id', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM packs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pack not found' });
      return;
    }

    res.json({ success: true, message: 'Pack deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting pack:');
    res.status(500).json({ success: false, message: 'Failed to delete pack' });
  }
});

// ==================== パックアイテム ====================

// GET /api/v1/packs/:id/items - パック内のアイテム一覧
router.get('/:id/items', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // パックの所有者チェック
    const packCheck = await db.query(
      'SELECT id FROM packs WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (packCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pack not found' });
      return;
    }

    const result = await db.query(
      'SELECT gear_id FROM pack_items WHERE pack_id = $1',
      [id]
    );

    res.json({ success: true, data: result.rows.map(r => r.gear_id) });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching pack items:');
    res.status(500).json({ success: false, message: 'Failed to fetch pack items' });
  }
});

// PUT /api/v1/packs/:id/items - パック内アイテム全置換
router.put('/:id/items', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { gearIds } = req.body;

    if (!Array.isArray(gearIds)) {
      res.status(400).json({ success: false, message: 'gearIds must be an array' });
      return;
    }

    // パックの所有者チェック
    const packCheck = await db.query(
      'SELECT id FROM packs WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (packCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pack not found' });
      return;
    }

    // トランザクションで全置換
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM pack_items WHERE pack_id = $1', [id]);

      if (gearIds.length > 0) {
        const values = gearIds.map((gearId: string, i: number) => `($1, $${i + 2})`).join(',');
        await client.query(
          `INSERT INTO pack_items (pack_id, gear_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          [id, ...gearIds]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true, data: gearIds });
  } catch (error) {
    logger.error({ err: error }, 'Error updating pack items:');
    res.status(500).json({ success: false, message: 'Failed to update pack items' });
  }
});

// ==================== 公開パック（認証不要） ====================

// GET /api/v1/packs/public/:id - 公開パック取得
router.get('/public/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const packResult = await db.query(
      `SELECT p.*, u.display_name AS author_name, u.handle AS author_handle
       FROM packs p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.is_public = true`,
      [id]
    );

    if (packResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pack not found or not public' });
      return;
    }

    // パック内のギアアイテムも取得
    const itemsResult = await db.query(
      `SELECT g.id, g.name, g.brand, g.weight_grams, g.price_cents,
              g.required_quantity, g.image_url, g.product_url,
              c.name AS category_name, c.color AS category_color
       FROM pack_items pi
       JOIN gear_items g ON pi.gear_id = g.id
       LEFT JOIN categories c ON g.category_id = c.id
       WHERE pi.pack_id = $1
       ORDER BY g.name`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...packResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching public pack:');
    res.status(500).json({ success: false, message: 'Failed to fetch public pack' });
  }
});

// ==================== 一括インポート（localStorage移行用） ====================

// POST /api/v1/packs/import - localStorage からの一括移行
router.post('/import', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { packs } = req.body;
    if (!Array.isArray(packs)) {
      res.status(400).json({ success: false, message: 'packs must be an array' });
      return;
    }

    const client = await db.connect();
    const importedPacks: any[] = [];

    try {
      await client.query('BEGIN');

      for (const pack of packs) {
        const packResult = await client.query(
          `INSERT INTO packs (user_id, name, description, route_name, is_public)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [req.userId, pack.name, pack.description || null, pack.routeName || null, pack.isPublic || false]
        );

        const newPack = packResult.rows[0];

        // パックアイテムの挿入
        if (Array.isArray(pack.itemIds) && pack.itemIds.length > 0) {
          const values = pack.itemIds.map((_: string, i: number) => `($1, $${i + 2})`).join(',');
          await client.query(
            `INSERT INTO pack_items (pack_id, gear_id) VALUES ${values} ON CONFLICT DO NOTHING`,
            [newPack.id, ...pack.itemIds]
          );
        }

        importedPacks.push(newPack);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.status(201).json({ success: true, data: importedPacks, message: `${importedPacks.length} packs imported` });
  } catch (error) {
    logger.error({ err: error }, 'Error importing packs:');
    res.status(500).json({ success: false, message: 'Failed to import packs' });
  }
});

export default router;
