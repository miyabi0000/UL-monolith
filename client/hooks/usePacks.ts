import { useCallback, useEffect, useRef, useState } from 'react';
import type { Pack, ApiResponse } from '../utils/types';
import { API_CONFIG } from '../services/api.client';

const STORAGE_KEY = 'ul_packs_v1';
const BASE_URL = API_CONFIG.baseUrl;

/** サーバーが返す snake_case 形式のパックデータ */
interface PackRow {
  id: string;
  user_id: string;
  name: string;
  route_name: string | null;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
  total_weight?: number;
}

/** snake_case → camelCase に変換し Pack 型にマッピング */
const toClientPack = (row: PackRow, itemIds: string[] = []): Pack => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  routeName: row.route_name || undefined,
  description: row.description || undefined,
  itemIds,
  isPublic: row.is_public,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** localStorage から旧パックデータを読み出す（移行用） */
const readLocalPacks = (): Pack[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Pack[];
  } catch {
    return [];
  }
};

/** 共通のfetchラッパー */
const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    signal: AbortSignal.timeout(API_CONFIG.timeout.standard),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message ||
        `HTTP error! status: ${response.status}`,
    );
  }

  const result: ApiResponse<T> = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'API request failed');
  }
  return result.data;
};

export const usePacks = (userId: string) => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // ==================== 初期ロード + localStorage 移行 ====================

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      try {
        setLoading(true);

        // サーバーからパック一覧を取得
        const serverRows = await apiFetch<PackRow[]>('/packs');

        // サーバーが空で localStorage にデータがある場合は移行
        const localPacks = readLocalPacks();
        if (serverRows.length === 0 && localPacks.length > 0) {
          console.info('localStorage → サーバーへパック移行開始');
          const imported = await apiFetch<PackRow[]>('/packs/import', {
            method: 'POST',
            body: JSON.stringify({ packs: localPacks }),
          });

          // 移行後は localStorage を削除
          localStorage.removeItem(STORAGE_KEY);
          console.info(`${imported.length} 件のパックを移行完了`);

          // 移行パックの itemIds を付与（移行元から引く）
          const packsWithItems = imported.map((row) => {
            const original = localPacks.find((lp) => lp.name === row.name);
            return toClientPack(row, original?.itemIds ?? []);
          });
          setPacks(packsWithItems);
        } else {
          // 通常ロード: 各パックの itemIds を並列取得
          const packsWithItems = await Promise.all(
            serverRows.map(async (row) => {
              try {
                const itemIds = await apiFetch<string[]>(
                  `/packs/${row.id}/items`,
                );
                return toClientPack(row, itemIds);
              } catch {
                return toClientPack(row, []);
              }
            }),
          );
          setPacks(packsWithItems);
        }

        setError(null);
      } catch (err) {
        console.error('パック一覧の取得に失敗:', err);
        setError(
          err instanceof Error ? err.message : 'パックの読み込みに失敗しました',
        );
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, []);

  // ==================== パック操作（楽観的更新 + バックグラウンド同期） ====================

  /**
   * パック作成
   * 楽観的にクライアントIDで即座に反映し、サーバー応答で差し替え
   */
  const createPack = useCallback(
    (name: string, description?: string, routeName?: string): Pack => {
      const now = new Date().toISOString();
      const tempId = crypto.randomUUID();
      const optimistic: Pack = {
        id: tempId,
        userId,
        name,
        routeName: routeName?.trim() || undefined,
        description: description?.trim() || undefined,
        itemIds: [],
        // 新規パックは非公開で作成。ユーザーが編集 UI で明示的に公開を ON にする
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      };

      setPacks((prev) => [optimistic, ...prev]);

      // バックグラウンドでサーバーに作成し、IDを差し替え
      void apiFetch<PackRow>('/packs', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description?.trim() || undefined,
          routeName: routeName?.trim() || undefined,
          isPublic: false,
        }),
      })
        .then((row) => {
          const serverPack = toClientPack(row, []);
          setPacks((prev) =>
            prev.map((p) => (p.id === tempId ? serverPack : p)),
          );
        })
        .catch((err) => {
          console.error('パック作成に失敗:', err);
          // 楽観的更新をロールバック
          setPacks((prev) => prev.filter((p) => p.id !== tempId));
        });

      return optimistic;
    },
    [userId],
  );

  /** パック更新 */
  const updatePack = useCallback(
    (id: string, updates: Partial<Omit<Pack, 'id' | 'userId' | 'createdAt'>>) => {
      // 楽観的更新
      setPacks((prev) =>
        prev.map((pack) =>
          pack.id === id
            ? {
                ...pack,
                ...updates,
                routeName: updates.routeName?.trim() || undefined,
                description: updates.description?.trim() || undefined,
                updatedAt: new Date().toISOString(),
              }
            : pack,
        ),
      );

      // バックグラウンドでサーバーに反映
      void apiFetch<PackRow>(`/packs/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updates.name,
          description: updates.description?.trim() || undefined,
          routeName: updates.routeName?.trim() || undefined,
          isPublic: updates.isPublic,
        }),
      }).catch((err) => {
        console.error('パック更新に失敗:', err);
      });
    },
    [],
  );

  /** パック削除 */
  const deletePack = useCallback((id: string) => {
    setPacks((prev) => prev.filter((pack) => pack.id !== id));

    void apiFetch<void>(`/packs/${id}`, { method: 'DELETE' }).catch((err) => {
      console.error('パック削除に失敗:', err);
    });
  }, []);

  /** アイテムのトグル（追加/削除） */
  const toggleItemInPack = useCallback((packId: string, itemId: string) => {
    setPacks((prev) => {
      const target = prev.find((p) => p.id === packId);
      if (!target) return prev;

      const exists = target.itemIds.includes(itemId);
      const newItemIds = exists
        ? target.itemIds.filter((id) => id !== itemId)
        : [...target.itemIds, itemId];

      // バックグラウンドでサーバーに反映
      void apiFetch<string[]>(`/packs/${packId}/items`, {
        method: 'PUT',
        body: JSON.stringify({ gearIds: newItemIds }),
      }).catch((err) => {
        console.error('パックアイテム更新に失敗:', err);
      });

      return prev.map((pack) =>
        pack.id === packId
          ? { ...pack, itemIds: newItemIds, updatedAt: new Date().toISOString() }
          : pack,
      );
    });
  }, []);

  /** 複数アイテムを一括追加 */
  const addItemsToPack = useCallback((packId: string, itemIds: string[]): number => {
    if (itemIds.length === 0) return 0;

    let addedCount = 0;

    setPacks((prev) => {
      const target = prev.find((p) => p.id === packId);
      if (!target) return prev;

      const existing = new Set(target.itemIds);
      const uniqueNewIds = itemIds.filter((id) => !existing.has(id));
      addedCount = uniqueNewIds.length;
      if (addedCount === 0) return prev;

      const newItemIds = [...target.itemIds, ...uniqueNewIds];

      // バックグラウンドでサーバーに反映
      void apiFetch<string[]>(`/packs/${packId}/items`, {
        method: 'PUT',
        body: JSON.stringify({ gearIds: newItemIds }),
      }).catch((err) => {
        console.error('パックアイテム一括追加に失敗:', err);
      });

      return prev.map((pack) =>
        pack.id === packId
          ? { ...pack, itemIds: newItemIds, updatedAt: new Date().toISOString() }
          : pack,
      );
    });

    return addedCount;
  }, []);

  /** IDからパックを取得 */
  const getPackById = useCallback(
    (packId: string) => packs.find((pack) => pack.id === packId),
    [packs],
  );

  return {
    allPacks: packs,
    packs,
    getPackById,
    createPack,
    updatePack,
    deletePack,
    toggleItemInPack,
    addItemsToPack,
    loading,
    error,
  };
};
