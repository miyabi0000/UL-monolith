import { Router } from 'express';
import { gearItems, categories, setGearItems } from '../data/store';
import { sanitizeGearData, calculateGearFields } from '../utils/helpers';
import { addHistoryEntry, getHistoryForGear } from '../data/history';

const router = Router();

// Get all gear items
router.get('/', (req, res) => {
  try {
    const enrichedItems = gearItems.map(item => {
      const category = categories.find(cat => cat.id === item.categoryId);
      return calculateGearFields({
        ...item,
        category
      });
    });

    res.json({
      success: true,
      data: enrichedItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gear items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new gear item
router.post('/', (req, res) => {
  try {
    const sanitizedData = sanitizeGearData(req.body);
    
    if (!sanitizedData.name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    const newItem = {
      id: Date.now().toString(),
      userId: 'user1', // TODO: Get from authentication
      ...sanitizedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    gearItems.push(newItem);

    const category = categories.find(cat => cat.id === newItem.categoryId);
    const enrichedItem = calculateGearFields({
      ...newItem,
      category
    });

    res.status(201).json({
      success: true,
      data: enrichedItem,
      message: 'Gear item created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update gear item
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const itemIndex = gearItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found'
      });
    }

    const sanitizedData = sanitizeGearData(req.body);
    
    if (!sanitizedData.name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    gearItems[itemIndex] = {
      ...gearItems[itemIndex],
      ...sanitizedData,
      updatedAt: new Date().toISOString()
    };

    const category = categories.find(cat => cat.id === gearItems[itemIndex].categoryId);
    const enrichedItem = calculateGearFields({
      ...gearItems[itemIndex],
      category
    });

    res.json({
      success: true,
      data: enrichedItem,
      message: 'Gear item updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete gear item
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = gearItems.length;
    setGearItems(gearItems.filter(item => item.id !== id));
    
    if (gearItems.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found'
      });
    }

    res.json({
      success: true,
      message: 'Gear item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk delete gear items
// Partial update (PATCH) - NEW FEATURE
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const itemIndex = gearItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found'
      });
    }

    const oldItem = { ...gearItems[itemIndex] };
    const allowedFields = ['ownedQuantity', 'requiredQuantity', 'priority', 'categoryId', 'name', 'brand', 'weightGrams', 'priceCents'];
    
    // Track changes for history
    const changes: any[] = [];
    
    // Apply only provided fields
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        const oldValue = oldItem[key];
        const newValue = updates[key];
        
        if (oldValue !== newValue) {
          changes.push({
            field: key,
            oldValue,
            newValue
          });
          
          // Sanitize based on field type
          if (key === 'ownedQuantity') {
            gearItems[itemIndex][key] = Math.max(0, Math.min(10, parseInt(newValue) || 0));
          } else if (key === 'requiredQuantity') {
            gearItems[itemIndex][key] = Math.max(1, Math.min(10, parseInt(newValue) || 1));
          } else if (key === 'priority') {
            gearItems[itemIndex][key] = Math.max(1, Math.min(5, parseInt(newValue) || 3));
          } else {
            gearItems[itemIndex][key] = newValue;
          }
        }
      }
    });

    // Update timestamp
    gearItems[itemIndex].updatedAt = new Date().toISOString();

    // Add to history if there were changes
    if (changes.length > 0) {
      addHistoryEntry({
        gearId: id,
        action: 'update',
        changes,
        userId: 'user1' // TODO: Get from authentication
      });
    }

    // Return enriched item
    const category = categories.find(cat => cat.id === gearItems[itemIndex].categoryId);
    const enrichedItem = calculateGearFields({
      ...gearItems[itemIndex],
      category
    });

    res.json({
      success: true,
      data: enrichedItem,
      message: 'Gear item updated successfully',
      changesCount: changes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk operations - ENHANCED FEATURE
router.patch('/bulk', (req, res) => {
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
      // Bulk delete with history tracking
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
      // Bulk update with history tracking
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

          // Get enriched item for result
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
});

// Get history for specific gear item - NEW FEATURE
router.get('/:id/history', (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const history = getHistoryForGear(id).slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gear history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Revert to previous version - NEW FEATURE
router.post('/:id/revert/:historyId', (req, res) => {
  try {
    const { id, historyId } = req.params;
    
    const itemIndex = gearItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found'
      });
    }

    const history = getHistoryForGear(id);
    const historyEntry = history.find(entry => entry.id === historyId);
    
    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: 'History entry not found'
      });
    }

    const currentItem = { ...gearItems[itemIndex] };
    const revertChanges: any[] = [];

    // Revert changes (swap oldValue and newValue)
    historyEntry.changes.forEach(change => {
      const currentValue = currentItem[change.field];
      gearItems[itemIndex][change.field] = change.oldValue;
      
      revertChanges.push({
        field: change.field,
        oldValue: currentValue,
        newValue: change.oldValue
      });
    });

    gearItems[itemIndex].updatedAt = new Date().toISOString();

    // Add revert to history
    addHistoryEntry({
      gearId: id,
      action: 'update',
      changes: revertChanges,
      userId: 'user1',
      metadata: { reason: `Reverted to version ${historyId}` }
    });

    const category = categories.find(cat => cat.id === gearItems[itemIndex].categoryId);
    const enrichedItem = calculateGearFields({
      ...gearItems[itemIndex],
      category
    });

    res.json({
      success: true,
      data: enrichedItem,
      message: `Reverted to version ${historyId}`,
      revertedChanges: revertChanges.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to revert gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Legacy bulk-delete endpoint (kept for backward compatibility)
router.post('/bulk-delete', (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'IDs must be provided as an array'
      });
    }

    // Redirect to new bulk endpoint
    req.body = { action: 'delete', ids };
    return router.handle(req, res, () => {});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete gear items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;