import { useState, useCallback } from 'react';
import type { GearFieldValue } from '../utils/types';

/**
 * インライン編集時のフィールド変更中状態を管理するフック。
 * 保存中フィールドにハイライトを表示するために使用。
 */
export function useChangedFields(onUpdateItem: (id: string, field: string, value: GearFieldValue) => void) {
  const [changedFields, setChangedFields] = useState<Record<string, Set<string>>>({});

  const handleFieldChange = useCallback(async (id: string, field: string, value: GearFieldValue) => {
    setChangedFields(prev => {
      const updated = { ...prev };
      updated[id] = new Set(updated[id]);
      updated[id].add(field);
      return updated;
    });
    try {
      await onUpdateItem(id, field, value);
    } catch (err) {
      console.error('Failed to update field:', err);
    } finally {
      setChangedFields(prev => {
        const updated = { ...prev };
        if (updated[id]) {
          updated[id] = new Set(updated[id]);
          updated[id].delete(field);
          if (updated[id].size === 0) delete updated[id];
        }
        return updated;
      });
    }
  }, [onUpdateItem]);

  const clearChangedFields = useCallback(() => {
    setChangedFields({});
  }, []);

  return { changedFields, handleFieldChange, clearChangedFields };
}
