import { Router, Request, Response } from 'express';
import { db } from '../database/connection.js';
import { cognitoAuth } from '../middleware/cognitoAuth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ==================== セッション ====================

// GET /api/v1/advisor/sessions - セッション一覧（最新順）
router.get('/sessions', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const result = await db.query(
      `SELECT id, pack_id, title, created_at, updated_at
       FROM advisor_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT $2`,
      [req.userId, limit],
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching advisor sessions:');
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
});

// POST /api/v1/advisor/sessions - セッション作成
router.post('/sessions', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { packId, title } = req.body;
    const sessionTitle = title || `Chat ${new Date().toISOString().slice(0, 10)}`;

    const result = await db.query(
      `INSERT INTO advisor_sessions (user_id, pack_id, title)
       VALUES ($1, $2, $3)
       RETURNING id, pack_id, title, created_at, updated_at`,
      [req.userId, packId || null, sessionTitle],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error({ err: error }, 'Error creating advisor session:');
    res.status(500).json({ success: false, message: 'Failed to create session' });
  }
});

// DELETE /api/v1/advisor/sessions/:id - セッション削除（CASCADE で messages も消える）
router.delete('/sessions/:id', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM advisor_sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting advisor session:');
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
});

// ==================== メッセージ ====================

// GET /api/v1/advisor/sessions/:id/messages - セッション内メッセージ取得（カーソルベースページネーション）
//   ?limit=50    : 取得件数（デフォルト 50、最大 100）
//   ?before=<id> : 指定メッセージより前（古い）を取得
//   レスポンス: { messages: 最新→古い順, hasMore, nextCursor }
router.get('/sessions/:id/messages', cognitoAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);
    const before = (req.query.before as string) || null;

    // 所有権チェック
    const sessionCheck = await db.query(
      'SELECT id FROM advisor_sessions WHERE id = $1 AND user_id = $2',
      [id, req.userId],
    );
    if (sessionCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // before カーソルの created_at を取得（同一セッション内のメッセージのみ有効）
    let beforeCreatedAt: Date | null = null;
    if (before) {
      const cursorRes = await db.query(
        'SELECT created_at FROM advisor_messages WHERE id = $1 AND session_id = $2',
        [before, id],
      );
      if (cursorRes.rows.length === 0) {
        res.status(400).json({ success: false, message: 'Invalid cursor' });
        return;
      }
      beforeCreatedAt = cursorRes.rows[0].created_at;
    }

    // limit + 1 件取得して hasMore を判定
    const params: unknown[] = [id];
    let whereClause = 'WHERE session_id = $1';
    if (beforeCreatedAt) {
      params.push(beforeCreatedAt);
      whereClause += ` AND created_at < $${params.length}`;
    }
    params.push(limit + 1);

    const result = await db.query(
      `SELECT id, role, content, suggested_edits, gear_refs, created_at
       FROM advisor_messages
       ${whereClause}
       ORDER BY created_at DESC, id DESC
       LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > limit;
    const sliced = hasMore ? result.rows.slice(0, limit) : result.rows;
    const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

    const messages = sliced.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      suggestedEdits: row.suggested_edits,
      gearRefs: row.gear_refs,
      createdAt: row.created_at,
    }));

    res.json({ success: true, data: { messages, hasMore, nextCursor } });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching advisor messages:');
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
    const sessionCheck = await db.query(
      'SELECT id FROM advisor_sessions WHERE id = $1 AND user_id = $2',
      [id, req.userId],
    );
    if (sessionCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // メッセージ挿入 + セッション updated_at 更新
    const client = await db.connect();
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
    logger.error({ err: error }, 'Error saving advisor message:');
    res.status(500).json({ success: false, message: 'Failed to save message' });
  }
});

export default router;
