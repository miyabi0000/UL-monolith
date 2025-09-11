import { Request, Response } from 'express';
import { gearItems, categories } from '../../data/store';
import { calculateGearFields } from '../../utils/helpers';
import { addHistoryEntry, getHistoryForGear } from '../../data/history';

export const handleGetGearHistory = (req: Request, res: Response) => {
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
};

export const handleRevertGear = (req: Request, res: Response) => {
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
};