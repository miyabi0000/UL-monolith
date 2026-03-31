import { useCallback, useMemo, useState } from 'react';
import type { Pack } from '../utils/types';

const STORAGE_KEY = 'ul_packs_v1';
const LEGACY_LOCAL_USER_ID = 'local-user';

type StoredPack = Partial<Pack> & Pick<Pack, 'id' | 'name' | 'itemIds' | 'isPublic' | 'createdAt' | 'updatedAt'>;

const normalizePack = (pack: StoredPack): Pack => ({
  ...pack,
  userId: pack.userId || LEGACY_LOCAL_USER_ID,
  routeName: pack.routeName?.trim() || undefined,
  description: pack.description?.trim() || undefined,
}) as Pack;

const readPacks = (): Pack[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((pack) => normalizePack(pack as StoredPack));
  } catch {
    return [];
  }
};

const writePacks = (packs: Pack[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
};

export const usePacks = (userId: string) => {
  const [packs, setPacks] = useState<Pack[]>(() => readPacks());

  const userPacks = useMemo(
    () =>
      packs.filter(
        (pack) => pack.userId === userId || pack.userId === LEGACY_LOCAL_USER_ID
      ),
    [packs, userId]
  );

  const createPack = useCallback(
    (name: string, description?: string, routeName?: string) => {
      const now = new Date().toISOString();
      const next: Pack = {
        id: crypto.randomUUID(),
        userId,
        name,
        routeName: routeName?.trim() || undefined,
        description: description?.trim() || undefined,
        itemIds: [],
        isPublic: true,
        createdAt: now,
        updatedAt: now
      };
      setPacks((prev) => {
        const updated = [next, ...prev];
        writePacks(updated);
        return updated;
      });
      return next;
    },
    [userId]
  );

  const updatePack = useCallback((id: string, updates: Partial<Omit<Pack, 'id' | 'userId' | 'createdAt'>>) => {
    setPacks((prev) => {
      const updated = prev.map((pack) =>
        pack.id === id
          ? {
              ...pack,
              ...updates,
              routeName: updates.routeName?.trim() || undefined,
              description: updates.description?.trim() || undefined,
              updatedAt: new Date().toISOString()
            }
          : pack
      );
      writePacks(updated);
      return updated;
    });
  }, []);

  const deletePack = useCallback((id: string) => {
    setPacks((prev) => {
      const updated = prev.filter((pack) => pack.id !== id);
      writePacks(updated);
      return updated;
    });
  }, []);

  const toggleItemInPack = useCallback((packId: string, itemId: string) => {
    setPacks((prev) => {
      const updated = prev.map((pack) => {
        if (pack.id !== packId) return pack;
        const exists = pack.itemIds.includes(itemId);
        const itemIds = exists
          ? pack.itemIds.filter((id) => id !== itemId)
          : [...pack.itemIds, itemId];
        return {
          ...pack,
          itemIds,
          updatedAt: new Date().toISOString()
        };
      });
      writePacks(updated);
      return updated;
    });
  }, []);

  const addItemsToPack = useCallback((packId: string, itemIds: string[]) => {
    if (itemIds.length === 0) return 0;

    let addedCount = 0;
    setPacks((prev) => {
      const updated = prev.map((pack) => {
        if (pack.id !== packId) return pack;
        const existing = new Set(pack.itemIds);
        const uniqueNewIds = itemIds.filter((id) => !existing.has(id));
        addedCount = uniqueNewIds.length;
        if (addedCount === 0) return pack;

        return {
          ...pack,
          itemIds: [...pack.itemIds, ...uniqueNewIds],
          updatedAt: new Date().toISOString()
        };
      });
      writePacks(updated);
      return updated;
    });

    return addedCount;
  }, []);

  const getPackById = useCallback(
    (packId: string) => packs.find((pack) => pack.id === packId),
    [packs]
  );

  return {
    allPacks: packs,
    packs: userPacks,
    getPackById,
    createPack,
    updatePack,
    deletePack,
    toggleItemInPack,
    addItemsToPack,
  };
};
