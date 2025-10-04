import { Request, Response } from 'express';
import { sanitizeGearData } from '../../utils/helpers';
import { db } from '../../database/connection';

export const handleGetAllGear = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    // クエリパラメータからフィルタ・ページネーション・ソートを取得
    const filters = {
      categoryIds: req.query.categoryIds ? String(req.query.categoryIds).split(',') : undefined,
      priorities: req.query.priorities ? String(req.query.priorities).split(',').map(Number) : undefined,
      seasons: req.query.seasons ? String(req.query.seasons).split(',') : undefined,
      search: req.query.search ? String(req.query.search) : undefined
    };

    const pagination = {
      page: parseInt(String(req.query.page || '1')),
      limit: parseInt(String(req.query.limit || '50'))
    };

    const sort = req.query.sortField ? {
      field: String(req.query.sortField) as any,
      order: (String(req.query.sortOrder || 'ASC').toUpperCase()) as 'ASC' | 'DESC'
    } : undefined;

    const { items, total } = await db.getGearWithCategories(userId, filters, pagination, sort);
    
    res.json({
      success: true,
      data: items,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasNext: pagination.page * pagination.limit < total,
        hasPrev: pagination.page > 1,
        filtered: Object.values(filters).some(v => v !== undefined)
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
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    const item = await db.getGearById(id, userId);

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
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const summary = await db.getAnalyticsSummary(userId);

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
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const sanitizedData = sanitizeGearData(req.body);
    
    if (!sanitizedData.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    const newItemId = await db.createGearItem(userId, sanitizedData);
    const newItem = await db.getGearById(newItemId, userId);

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
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const sanitizedData = sanitizeGearData(req.body);
    
    const updated = await db.updateGearItem(id, userId, sanitizedData);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found or no changes made'
      });
    }

    const updatedItem = await db.getGearById(id, userId);

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
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    const deletedCount = await db.deleteGearItems([id], userId);
    
    if (deletedCount === 0) {
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
