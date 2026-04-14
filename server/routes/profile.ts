import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { cognitoAuth } from '../middleware/cognitoAuth.js';

const router = Router();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'gear_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// GET /api/v1/profile - 自分のプロフィール取得
router.get('/', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT display_name, handle, bio, header_image_url, header_title
       FROM users WHERE id = $1`,
      [req.userId],
    );

    if (result.rows.length === 0) {
      // ユーザー行が存在しない場合も空データを返す（client でデフォルト値を当てる）
      res.json({ success: true, data: null });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        displayName: row.display_name,
        handle: row.handle,
        bio: row.bio,
        headerImageUrl: row.header_image_url,
        headerTitle: row.header_title,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PUT /api/v1/profile - プロフィール部分更新
router.put('/', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { displayName, handle, bio, headerImageUrl, headerTitle } = req.body;

    const result = await pool.query(
      `UPDATE users SET
         display_name = COALESCE($1, display_name),
         handle = COALESCE($2, handle),
         bio = COALESCE($3, bio),
         header_image_url = COALESCE($4, header_image_url),
         header_title = COALESCE($5, header_title)
       WHERE id = $6
       RETURNING display_name, handle, bio, header_image_url, header_title`,
      [
        displayName ?? null,
        handle ?? null,
        bio ?? null,
        headerImageUrl ?? null,
        headerTitle ?? null,
        req.userId,
      ],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        displayName: row.display_name,
        handle: row.handle,
        bio: row.bio,
        headerImageUrl: row.header_image_url,
        headerTitle: row.header_title,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// POST /api/v1/profile/import - localStorage からの一括移行
router.post('/import', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { displayName, handle, bio, headerImageUrl, headerTitle } = req.body;

    console.info(`[Profile Import] user=${req.userId} — localStorage → DB 移行`);

    const result = await pool.query(
      `UPDATE users SET
         display_name = $1,
         handle = $2,
         bio = $3,
         header_image_url = $4,
         header_title = $5
       WHERE id = $6
       RETURNING display_name, handle, bio, header_image_url, header_title`,
      [
        displayName || null,
        handle || null,
        bio || null,
        headerImageUrl || null,
        headerTitle || null,
        req.userId,
      ],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        displayName: row.display_name,
        handle: row.handle,
        bio: row.bio,
        headerImageUrl: row.header_image_url,
        headerTitle: row.header_title,
      },
      message: 'Profile imported from localStorage',
    });
  } catch (error) {
    console.error('Error importing profile:', error);
    res.status(500).json({ success: false, message: 'Failed to import profile' });
  }
});

export default router;
