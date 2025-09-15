import { Request, Response } from 'express';
import { gearItems, categories, setGearItems } from '../../data/store';
import { sanitizeGearData, calculateGearFields } from '../../utils/helpers';

export const handleGetAllGear = (req: Request, res: Response) => {
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
};

export const handleCreateGear = (req: Request, res: Response) => {
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
};

export const handleUpdateGear = (req: Request, res: Response) => {
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
};

export const handleDeleteGear = (req: Request, res: Response) => {
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
};