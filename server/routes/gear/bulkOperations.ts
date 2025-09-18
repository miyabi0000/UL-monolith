import { Request, Response } from 'express';
import { gearItems, categories, setGearItems } from '../../data/store';
import { calculateGearFields } from '../../utils/helpers';
import { addHistoryEntry } from '../../data/history';

export const handleBulkOperations = (req: Request, res: Response) => {
  try {
    const { action, ids, data } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    if (!['update', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "update" or "delete"'
      });
    }

    const bulkOperationId = Date.now().toString();
    let processedCount = 0;
    const results: any[] = [];

    if (action === 'delete') {
      // 効率化: Set使用でO(1)のIN相当チェック
      // SQL: DELETE FROM gear_items WHERE id IN (?, ?, ?)
      const idsSet = new Set(ids);
      const itemsToDelete = gearItems.filter(item => idsSet.has(item.id));

      // バッチで履歴エントリーを追加
      const historyEntries = itemsToDelete.map(item => ({
        gearId: item.id,
        action: 'bulk_delete' as const,
        changes: [{ field: 'deleted', oldValue: false, newValue: true }],
        userId: 'user1',
        metadata: { bulkOperationId, reason: 'Bulk delete operation' }
      }));

      // 一括履歴追加（実際のDBでは batch insert）
      historyEntries.forEach(entry => addHistoryEntry(entry));

      // 効率的な削除: 1回のフィルタリングで完了
      setGearItems(gearItems.filter(item => !idsSet.has(item.id)));
      processedCount = itemsToDelete.length;

      res.json({
        success: true,
        message: `${processedCount} gear items deleted successfully`,
        processedCount,
        bulkOperationId
      });

    } else if (action === 'update') {
      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Update data is required for bulk update'
        });
      }

      const allowedFields = ['ownedQuantity', 'requiredQuantity', 'priority', 'categoryId'];

      // 効率化: Set使用でO(1)のIN相当チェック + Map作成で高速参照
      // SQL: UPDATE gear_items SET ... WHERE id IN (?, ?, ?)
      const idsSet = new Set(ids);
      const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
      const updatedAt = new Date().toISOString();
      const historyEntries: any[] = [];

      // 1回のループで全処理を実行
      gearItems.forEach((item, itemIndex) => {
        if (idsSet.has(item.id)) {
          const oldItem = { ...item };
          const changes: any[] = [];

          // データ更新
          Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) {
              const oldValue = oldItem[key];
              const newValue = data[key];

              if (oldValue !== newValue) {
                changes.push({
                  field: key,
                  oldValue,
                  newValue
                });

                gearItems[itemIndex][key] = newValue;
              }
            }
          });

          gearItems[itemIndex].updatedAt = updatedAt;

          if (changes.length > 0) {
            historyEntries.push({
              gearId: item.id,
              action: 'bulk_update',
              changes,
              userId: 'user1',
              metadata: { bulkOperationId, reason: 'Bulk update operation' }
            });

            processedCount++;
          }

          // 効率的なカテゴリ参照
          const category = categoryMap.get(gearItems[itemIndex].categoryId);
          results.push(calculateGearFields({
            ...gearItems[itemIndex],
            category
          }));
        }
      });

      // 一括履歴追加（実際のDBでは batch insert）
      historyEntries.forEach(entry => addHistoryEntry(entry));

      res.json({
        success: true,
        message: `${processedCount} gear items updated successfully`,
        processedCount,
        bulkOperationId,
        updatedItems: results
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk operation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleBulkDelete = (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and must not be empty'
      });
    }

    const bulkOperationId = Date.now().toString();
    const itemsToDelete = gearItems.filter(item => ids.includes(item.id));
    
    // Add history entries for each deleted item
    itemsToDelete.forEach(item => {
      addHistoryEntry({
        gearId: item.id,
        action: 'bulk_delete',
        changes: [{ field: 'deleted', oldValue: false, newValue: true }],
        userId: 'user1', // TODO: Get from authentication
        metadata: { bulkOperationId, reason: 'RESTful bulk delete operation' }
      });
    });

    // Remove items from store
    setGearItems(gearItems.filter(item => !ids.includes(item.id)));
    
    res.json({
      success: true,
      message: `${itemsToDelete.length} gear items deleted successfully`,
      data: {
        deletedCount: itemsToDelete.length,
        deletedIds: itemsToDelete.map(item => item.id),
        bulkOperationId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete gear items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleLegacyBulkDelete = (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'IDs must be provided as an array'
      });
    }

    // Redirect to new bulk endpoint by modifying request
    req.body = { action: 'delete', ids };
    handleBulkOperations(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete gear items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};