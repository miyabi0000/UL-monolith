import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// pg の Pool をモック
const mockQuery = vi.fn();
const mockClientQuery = vi.fn();
const mockClientRelease = vi.fn();

vi.mock('pg', () => {
  return {
    Pool: class MockPool {
      query = mockQuery;
      connect = async () => ({
        query: mockClientQuery,
        release: mockClientRelease,
      });
    },
  };
});

// cognitoAuth をモック
vi.mock('../../middleware/cognitoAuth', () => ({
  cognitoAuth: (req: any, _res: any, next: any) => {
    req.userId = '550e8400-e29b-41d4-a716-446655440100';
    next();
  },
}));

const { default: advisorRoutes } = await import('../advisor');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/advisor', advisorRoutes);
  return app;
}

describe('Advisor API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/advisor/sessions', () => {
    it('セッション一覧を最新順で返す', async () => {
      const sessions = [
        { id: 'session-1', pack_id: null, title: 'Chat 2026-04-12', created_at: '2026-04-12', updated_at: '2026-04-12' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: sessions });

      const app = createApp();
      const res = await request(app).get('/api/v1/advisor/sessions?limit=1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('session-1');
    });

    it('limit は最大 50 に制限される', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const app = createApp();
      await request(app).get('/api/v1/advisor/sessions?limit=999');

      const params = mockQuery.mock.calls[0][1] as unknown[];
      expect(params[1]).toBe(50);
    });
  });

  describe('POST /api/v1/advisor/sessions', () => {
    it('新しいセッションを作成する', async () => {
      const session = { id: 'session-new', pack_id: null, title: 'Chat 2026-04-12', created_at: '2026-04-12', updated_at: '2026-04-12' };
      mockQuery.mockResolvedValueOnce({ rows: [session] });

      const app = createApp();
      const res = await request(app)
        .post('/api/v1/advisor/sessions')
        .send({ title: 'My Chat' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('session-new');
    });

    it('title 未指定時はデフォルトタイトルが設定される', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', pack_id: null, title: 'Chat 2026-04-12', created_at: '', updated_at: '' }] });

      const app = createApp();
      await request(app).post('/api/v1/advisor/sessions').send({});

      const params = mockQuery.mock.calls[0][1] as unknown[];
      expect((params[2] as string)).toMatch(/^Chat \d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('DELETE /api/v1/advisor/sessions/:id', () => {
    it('セッションを削除する', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] });

      const app = createApp();
      const res = await request(app).delete('/api/v1/advisor/sessions/session-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('存在しないセッションは 404 を返す', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const app = createApp();
      const res = await request(app).delete('/api/v1/advisor/sessions/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/advisor/sessions/:id/messages', () => {
    it('セッション内メッセージを最新→古い順で返す（hasMore=false）', async () => {
      // 所有権チェック
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] });
      // メッセージ取得（DESC、limit+1=51 件のうち 2 件返却）
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'msg-2', role: 'assistant', content: 'Hi!', suggested_edits: null, gear_refs: null, created_at: '2026-04-12T00:01:00Z' },
          { id: 'msg-1', role: 'user', content: 'Hello', suggested_edits: null, gear_refs: null, created_at: '2026-04-12T00:00:00Z' },
        ],
      });

      const app = createApp();
      const res = await request(app).get('/api/v1/advisor/sessions/session-1/messages');

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(2);
      expect(res.body.data.messages[0].id).toBe('msg-2');
      expect(res.body.data.hasMore).toBe(false);
      expect(res.body.data.nextCursor).toBeNull();
    });

    it('limit を超えたら hasMore=true と nextCursor を返す', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] });
      // limit=2 に対し 3 件返ったケース
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'msg-3', role: 'assistant', content: 'c', suggested_edits: null, gear_refs: null, created_at: '2026-04-12T00:02:00Z' },
          { id: 'msg-2', role: 'user', content: 'b', suggested_edits: null, gear_refs: null, created_at: '2026-04-12T00:01:00Z' },
          { id: 'msg-1', role: 'user', content: 'a', suggested_edits: null, gear_refs: null, created_at: '2026-04-12T00:00:00Z' },
        ],
      });

      const app = createApp();
      const res = await request(app).get('/api/v1/advisor/sessions/session-1/messages?limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(2);
      expect(res.body.data.hasMore).toBe(true);
      expect(res.body.data.nextCursor).toBe('msg-2');

      // クエリの limit パラメータは limit + 1 (=3) で渡されること
      const params = mockQuery.mock.calls[1][1] as unknown[];
      expect(params[params.length - 1]).toBe(3);
    });

    it('limit は最大 100 に制限される', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const app = createApp();
      await request(app).get('/api/v1/advisor/sessions/session-1/messages?limit=999');

      const params = mockQuery.mock.calls[1][1] as unknown[];
      expect(params[params.length - 1]).toBe(101); // 100 + 1
    });

    it('before カーソル指定時は created_at < cursor で絞り込む', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] }); // 所有権
      mockQuery.mockResolvedValueOnce({ rows: [{ created_at: '2026-04-12T00:01:00Z' }] }); // カーソル lookup
      mockQuery.mockResolvedValueOnce({ rows: [] }); // メッセージ取得

      const app = createApp();
      const res = await request(app).get('/api/v1/advisor/sessions/session-1/messages?before=msg-2&limit=10');

      expect(res.status).toBe(200);
      const sql = mockQuery.mock.calls[2][0] as string;
      expect(sql).toMatch(/created_at < \$2/);
      const params = mockQuery.mock.calls[2][1] as unknown[];
      expect(params[1]).toBe('2026-04-12T00:01:00Z');
    });

    it('不正な before カーソル（他セッションや存在しない ID）は 400 を返す', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // カーソル lookup 空

      const app = createApp();
      const res = await request(app).get('/api/v1/advisor/sessions/session-1/messages?before=bogus');

      expect(res.status).toBe(400);
    });

    it('他ユーザーのセッションは 404 を返す', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // 所有権チェック失敗

      const app = createApp();
      const res = await request(app).get('/api/v1/advisor/sessions/other-session/messages');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/advisor/sessions/:id/messages', () => {
    it('メッセージを保存する', async () => {
      // 所有権チェック
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] });
      // トランザクション
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 'msg-new', role: 'user', content: 'Test', suggested_edits: null, gear_refs: null, created_at: '2026-04-12T00:00:00Z' }],
        }) // INSERT
        .mockResolvedValueOnce(undefined) // UPDATE session
        .mockResolvedValueOnce(undefined); // COMMIT

      const app = createApp();
      const res = await request(app)
        .post('/api/v1/advisor/sessions/session-1/messages')
        .send({ role: 'user', content: 'Test' });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Test');
    });

    it('role / content なしは 400 を返す', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/v1/advisor/sessions/session-1/messages')
        .send({ role: 'user' }); // content 無し

      expect(res.status).toBe(400);
    });
  });
});
