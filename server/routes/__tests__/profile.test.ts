import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// pg の Pool をモック
const mockQuery = vi.fn();
vi.mock('pg', () => {
  return {
    Pool: class MockPool {
      query = mockQuery;
    },
  };
});

// cognitoAuth をモック（DEMO_USER_ID をセット）
vi.mock('../../middleware/cognitoAuth', () => ({
  cognitoAuth: (req: any, _res: any, next: any) => {
    req.userId = '550e8400-e29b-41d4-a716-446655440100';
    next();
  },
}));

const { default: profileRoutes } = await import('../profile');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/profile', profileRoutes);
  return app;
}

describe('Profile API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/profile', () => {
    it('プロフィールデータを正常に返す', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          display_name: 'Test User',
          handle: '@test',
          bio: 'Hiker',
          header_image_url: null,
          header_title: 'My Board',
        }],
      });

      const app = createApp();
      const res = await request(app).get('/api/v1/profile');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        displayName: 'Test User',
        handle: '@test',
        bio: 'Hiker',
        headerImageUrl: null,
        headerTitle: 'My Board',
      });
    });

    it('ユーザー行が無い場合は data: null を返す', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const app = createApp();
      const res = await request(app).get('/api/v1/profile');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('DB エラー時は 500 を返す', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB down'));

      const app = createApp();
      const res = await request(app).get('/api/v1/profile');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/profile', () => {
    it('プロフィールを部分更新する', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          display_name: 'Updated',
          handle: '@test',
          bio: 'Hiker',
          header_image_url: null,
          header_title: null,
        }],
      });

      const app = createApp();
      const res = await request(app)
        .put('/api/v1/profile')
        .send({ displayName: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Updated');

      // COALESCE パターンの SQL を確認
      const sql = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain('COALESCE');
      expect(sql).toContain('WHERE id = $6');
    });

    it('存在しないユーザーの場合は 404 を返す', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const app = createApp();
      const res = await request(app)
        .put('/api/v1/profile')
        .send({ displayName: 'Nobody' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/profile/import', () => {
    it('localStorage からの一括移行が成功する', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          display_name: 'Imported',
          handle: '@imported',
          bio: 'From localStorage',
          header_image_url: '',
          header_title: 'Packboard',
        }],
      });

      const app = createApp();
      const res = await request(app)
        .post('/api/v1/profile/import')
        .send({
          displayName: 'Imported',
          handle: '@imported',
          bio: 'From localStorage',
          headerImageUrl: '',
          headerTitle: 'Packboard',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Imported');
    });
  });
});
