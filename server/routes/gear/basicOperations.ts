import { Request, Response } from 'express';
import { sanitizeGearData } from '../../utils/helpers';

// 暫定的なin-memoryデータ（テスト用）
let gearItems: any[] = [];

export const handleGetAllGear = (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    // 暫定: in-memoryデータを返す
    const filteredItems = gearItems.filter(item => item.userId === userId);
    
    res.json({
      success: true,
      data: filteredItems,
      meta: {
        total: filteredItems.length,
        page: 1,
        limit: 50,
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

export const handleGetGearById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    const item = gearItems.find(gear => gear.id === id && gear.userId === userId);

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

export const handleGetGearSummary = (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const userItems = gearItems.filter(item => item.userId === userId);
    
    const summary = {
      totalWeight: userItems.reduce((sum, item) => sum + (item.weightGrams || 0), 0),
      totalPrice: userItems.reduce((sum, item) => sum + (item.priceCents || 0), 0),
      totalItems: userItems.length,
      missingItems: userItems.filter(item => item.ownedQuantity < item.requiredQuantity).length,
      chartData: []
    };

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

export const handleCreateGear = (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const sanitizedData = sanitizeGearData(req.body);
    
    if (!sanitizedData.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    const newItem = {
      id: Date.now().toString(),
      userId,
      ...sanitizedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    gearItems.push(newItem);

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

export const handleUpdateGear = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const sanitizedData = sanitizeGearData(req.body);
    
    const itemIndex = gearItems.findIndex(item => item.id === id && item.userId === userId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found'
      });
    }

    gearItems[itemIndex] = {
      ...gearItems[itemIndex],
      ...sanitizedData,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: gearItems[itemIndex],
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

export const handleDeleteGear = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    const initialLength = gearItems.length;
    gearItems = gearItems.filter(item => !(item.id === id && item.userId === userId));
    
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
    console.error('Error in handleDeleteGear:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};