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

// ==================== セッション ====================

// GET /api/v1/advisor/sessions - セッション一覧（最新順）
router.get('/sessions', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const result = await pool.query(
      `SELECT id, pack_id, title, created_at, updated_at
       FROM advisor_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT $2`,
      [req.userId, limit],
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching advisor sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
});

// POST /api/v1/advisor/sessions - セッション作成
router.post('/sessions', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { packId, title } = req.body;
    const sessionTitle = title || `Chat ${new Date().toISOString().slice(0, 10)}`;

    const result = await pool.query(
      `INSERT INTO advisor_sessions (user_id, pack_id, title)
       VALUES ($1, $2, $3)
       RETURNING id, pack_id, title, created_at, updated_at`,
      [req.userId, packId || null, sessionTitle],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating advisor session:', error);
    res.status(500).json({ success: false, message: 'Failed to create session' });
  }
});

// DELETE /api/v1/advisor/sessions/:id - セッション削除（CASCADE で messages も消える）
router.delete('/sessions/:id', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM advisor_sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('Error deleting advisor session:', error);
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
});

// ==================== メッセージ ====================

// GET /api/v1/advisor/sessions/:id/messages - セッション内メッセージ取得
router.get('/sessions/:id/messages', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 所有権チェック
    const sessionCheck = await pool.query(
      'SELECT id FROM advisor_sessions WHERE id = $1 AND user_id = $2',
      [id, req.userId],
    );
    if (sessionCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // TODO: 将来メッセージ数が増えたらページネーション対応
    const result = await pool.query(
      `SELECT id, role, content, suggested_edits, gear_refs, created_at
       FROM advisor_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT 100`,
      [id],
    );

    const messages = result.rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      suggestedEdits: row.suggested_edits,
      gearRefs: row.gear_refs,
      createdAt: row.created_at,
    }));

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching advisor messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// POST /api/v1/advisor/sessions/:id/messages - メッセージ追加
router.post('/sessions/:id/messages', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, content, suggestedEdits, gearRefs } = req.body;

    if (!role || !content) {
      res.status(400).json({ success: false, message: 'role and content are required' });
      return;
    }

    // 所有権チェック
    const sessionCheck = await pool.query(
      'SELECT id FROM advisor_sessions WHERE id = $1 AND user_id = $2',
      [id, req.userId],
    );
    if (sessionCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // メッセージ挿入 + セッション updated_at 更新
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const msgResult = await client.query(
        `INSERT INTO advisor_messages (session_id, role, content, suggested_edits, gear_refs)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, role, content, suggested_edits, gear_refs, created_at`,
        [
          id,
          role,
          content,
          suggestedEdits ? JSON.stringify(suggestedEdits) : null,
          gearRefs ? JSON.stringify(gearRefs) : null,
        ],
      );

      await client.query(
        'UPDATE advisor_sessions SET updated_at = NOW() WHERE id = $1',
        [id],
      );

      await client.query('COMMIT');

      const row = msgResult.rows[0];
      res.status(201).json({
        success: true,
        data: {
          id: row.id,
          role: row.role,
          content: row.content,
          suggestedEdits: row.suggested_edits,
          gearRefs: row.gear_refs,
          createdAt: row.created_at,
        },
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving advisor message:', error);
    res.status(500).json({ success: false, message: 'Failed to save message' });
  }
});

export default router;
