import { Request, Response } from 'express';
import { gearItems, categories } from '../../data/store';
import { calculateGearFields } from '../../utils/helpers';
import { addHistoryEntry } from '../../data/history';

export const handlePatchGear = (req: Request, res: Response) => {
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
    
    const changes: any[] = [];
    
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

    gearItems[itemIndex].updatedAt = new Date().toISOString();

    if (changes.length > 0) {
      addHistoryEntry({
        gearId: id,
        action: 'update',
        changes,
        userId: 'user1'
      });
    }

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
};