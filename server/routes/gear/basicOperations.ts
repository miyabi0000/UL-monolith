import { Request, Response } from 'express';
import { sanitizeGearData } from '../../utils/helpers';
import { db } from '../../database/connection';

// デモユーザーID（認証実装までの仮ID）
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440100';

export const handleGetAllGear = async (req: Request, res: Response) => {
  try {
    const result = await db.getGearWithCategories(DEMO_USER_ID);

    res.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: 1,
        limit: result.items.length,
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

    const item = await db.getGearById(id, DEMO_USER_ID);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found'
      });
    }

    res.json({
      success: true,
      data: item
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
    const summary = await db.getAnalyticsSummary(DEMO_USER_ID);

    res.json({
      success: true,
      data: {
        totalWeight: summary.totalWeight,
        totalPrice: summary.totalPrice,
        totalItems: summary.totalItems,
        missingItems: summary.missingItems
      }
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

    const newItem = await db.createGearItem(sanitizedData, DEMO_USER_ID);

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
    
    const updatedItem = await db.updateGearItem(id, sanitizedData, DEMO_USER_ID);
    
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
    
    const deleted = await db.deleteGearItem(id, DEMO_USER_ID);
    
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
