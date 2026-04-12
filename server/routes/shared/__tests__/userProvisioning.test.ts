import { describe, it, expect, vi, beforeEach } from 'vitest';

// pg の Pool をモック
const mockQuery = vi.fn();
vi.mock('pg', () => {
  return {
    Pool: class MockPool {
      query = mockQuery;
    },
  };
});

// モック設定後にインポート
const { resolveUserIdFromSub } = await import('../userProvisioning');

describe('resolveUserIdFromSub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初回呼び出しでは upsert を実行して users.id を返す', async () => {
    const fakeUserId = '550e8400-e29b-41d4-a716-446655440200';
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: fakeUserId }],
    });

    const result = await resolveUserIdFromSub('cognito-sub-1', 'user@example.com', 'Test User');

    expect(result).toBe(fakeUserId);
    expect(mockQuery).toHaveBeenCalledTimes(1);

    // upsert SQL を検証
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO users');
    expect(sql).toContain('ON CONFLICT (cognito_sub)');
    expect(sql).toContain('RETURNING id');

    // パラメータを検証
    const params = mockQuery.mock.calls[0][1] as string[];
    expect(params[0]).toBe('cognito-sub-1');
    expect(params[1]).toBe('user@example.com');
    expect(params[2]).toBe('Test User');
  });

  it('2回目の同一 sub 呼び出しはキャッシュヒットして DB を叩かない', async () => {
    // 1回目の結果がキャッシュに残っている前提
    // (前のテストで resolveUserIdFromSub('cognito-sub-1', ...) を呼んでいるので
    //  別 sub を使ってクリーンに検証)
    const fakeUserId = '550e8400-e29b-41d4-a716-446655440201';
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: fakeUserId }],
    });

    // 1回目: DB に問い合わせ
    const result1 = await resolveUserIdFromSub('cognito-sub-2', 'user2@example.com');
    expect(result1).toBe(fakeUserId);
    expect(mockQuery).toHaveBeenCalledTimes(1);

    // 2回目: キャッシュヒット (DB 問い合わせなし)
    mockQuery.mockClear();
    const result2 = await resolveUserIdFromSub('cognito-sub-2', 'user2@example.com');
    expect(result2).toBe(fakeUserId);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('name が undefined の場合は null がパラメータに渡る', async () => {
    const fakeUserId = '550e8400-e29b-41d4-a716-446655440202';
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: fakeUserId }],
    });

    await resolveUserIdFromSub('cognito-sub-3', 'user3@example.com');

    const params = mockQuery.mock.calls[0][1] as (string | null)[];
    expect(params[2]).toBeNull();
  });

  it('DB エラー時は例外がスローされる', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

    await expect(
      resolveUserIdFromSub('cognito-sub-error', 'error@example.com'),
    ).rejects.toThrow('Connection refused');
  });
});
