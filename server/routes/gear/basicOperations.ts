import { Request, Response } from 'express';
import { sanitizeGearData } from '../../utils/helpers';
import { 
  getAllGearItems, 
  getGearItemById, 
  addGearItem, 
  updateGearItem, 
  deleteGearItem,
  getAllCategories,
  getGearStats
} from '../../data/store';

export const handleGetAllGear = async (req: Request, res: Response) => {
  try {
    const items = getAllGearItems();

    // 計算フィールドを追加
    const itemsWithCalculations = items.map(item => ({
      ...item,
      shortage: item.requiredQuantity - item.ownedQuantity,
      totalWeight: (item.weightGrams || 0) * item.requiredQuantity,
      totalPrice: (item.priceCents || 0) * item.requiredQuantity,
      missingQuantity: Math.max(0, item.requiredQuantity - item.ownedQuantity)
    }));

    res.json({
      success: true,
      data: itemsWithCalculations,
      meta: {
        total: items.length,
        page: 1,
        limit: items.length,
        hasNext: false,
        hasPrev: false,
        filtered: false
      }
    });
  } catch (error) {
    console.error('Error in handleGetAllGear:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gear items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleGetGearById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = getGearItemById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found'
      });
    }

    // 計算フィールドを追加
    const itemWithCalculations = {
      ...item,
      shortage: item.requiredQuantity - item.ownedQuantity,
      totalWeight: (item.weightGrams || 0) * item.requiredQuantity,
      totalPrice: (item.priceCents || 0) * item.requiredQuantity,
      missingQuantity: Math.max(0, item.requiredQuantity - item.ownedQuantity)
    };

    res.json({
      success: true,
      data: itemWithCalculations
    });
  } catch (error) {
    console.error('Error in handleGetGearById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleGetGearSummary = async (req: Request, res: Response) => {
  try {
    const summary = getGearStats();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in handleGetGearSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate gear summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleCreateGear = async (req: Request, res: Response) => {
  try {
    const sanitizedData = sanitizeGearData(req.body);
    
    if (!sanitizedData.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    const newItem = addGearItem(sanitizedData);

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Gear item created successfully'
    });
  } catch (error) {
    console.error('Error in handleCreateGear:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleUpdateGear = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sanitizedData = sanitizeGearData(req.body);
    
    const updatedItem = updateGearItem(id, sanitizedData);
    
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found or no changes made'
      });
    }

    res.json({
      success: true,
      data: updatedItem,
      message: 'Gear item updated successfully'
    });
  } catch (error) {
    console.error('Error in handleUpdateGear:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleDeleteGear = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = deleteGearItem(id);
    
    if (!deleted) {
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
    console.error('Error in handleDeleteGear:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
