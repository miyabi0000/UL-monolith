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
      const itemsToDelete = gearItems.filter(item => ids.includes(item.id));
      
      itemsToDelete.forEach(item => {
        addHistoryEntry({
          gearId: item.id,
          action: 'bulk_delete',
          changes: [{ field: 'deleted', oldValue: false, newValue: true }],
          userId: 'user1',
          metadata: { bulkOperationId, reason: 'Bulk delete operation' }
        });
      });

      setGearItems(gearItems.filter(item => !ids.includes(item.id)));
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
      
      ids.forEach(id => {
        const itemIndex = gearItems.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
          const oldItem = { ...gearItems[itemIndex] };
          const changes: any[] = [];

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

          gearItems[itemIndex].updatedAt = new Date().toISOString();

          if (changes.length > 0) {
            addHistoryEntry({
              gearId: id,
              action: 'bulk_update',
              changes,
              userId: 'user1',
              metadata: { bulkOperationId, reason: 'Bulk update operation' }
            });
            
            processedCount++;
          }

          const category = categories.find(cat => cat.id === gearItems[itemIndex].categoryId);
          results.push(calculateGearFields({
            ...gearItems[itemIndex],
            category
          }));
        }
      });

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