import { useCallback, useMemo, useState } from 'react';
import type { Pack } from '../utils/types';

const STORAGE_KEY = 'ul_packs_v1';

const readPacks = (): Pack[] => {
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

const writePacks = (packs: Pack[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
};

export const usePacks = (userId: string) => {
  const [packs, setPacks] = useState<Pack[]>(() => readPacks());

  const userPacks = useMemo(
    () => packs.filter((pack) => pack.userId === userId),
    [packs, userId]
  );

  const createPack = useCallback(
    (name: string, description?: string) => {
      const now = new Date().toISOString();
      const next: Pack = {
        id: crypto.randomUUID(),
        userId,
        name,
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
    toggleItemInPack
  };
};
