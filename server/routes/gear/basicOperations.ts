import { Request, Response } from 'express';
import { gearItems, categories, setGearItems } from '../../data/store';
import { sanitizeGearData, calculateGearFields } from '../../utils/helpers';

export const handleGetAllGear = (req: Request, res: Response) => {
  try {
    // TODO: クエリパラメータ対応（フィルタリング・ソート・ページネーション）
    const { category, priority, season, search, sort, order, page, limit, categoryIds } = req.query;

    let filteredItems = [...gearItems];

    // 効率化: IN相当の処理 - 複数カテゴリIDでのフィルタリング
    if (categoryIds && typeof categoryIds === 'string') {
      const categoryIdArray = categoryIds.split(',').map(id => id.trim());
      // SQL: SELECT * FROM gear_items WHERE category_id IN (?, ?, ?)
      filteredItems = filteredItems.filter(item =>
        categoryIdArray.includes(item.categoryId || '')
      );
    } else if (category) {
      // 単一カテゴリでのフィルタリング（後方互換性）
      const categoryObj = categories.find(cat => cat.name === category);
      if (categoryObj) {
        filteredItems = filteredItems.filter(item => item.categoryId === categoryObj.id);
      }
    }

    // 効率化: 複数優先度でのフィルタリング
    if (priority && typeof priority === 'string') {
      const priorityArray = priority.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
      if (priorityArray.length > 0) {
        // SQL: SELECT * FROM gear_items WHERE priority IN (?, ?, ?)
        filteredItems = filteredItems.filter(item =>
          priorityArray.includes(item.priority)
        );
      }
    }

    // 効率化: 複数シーズンでのフィルタリング
    if (season && typeof season === 'string') {
      const seasonArray = season.split(',').map(s => s.trim());
      // SQL: SELECT * FROM gear_items WHERE season IN (?, ?, ?)
      filteredItems = filteredItems.filter(item =>
        seasonArray.includes(item.season || 'all')
      );
    }

    // 効率化: カテゴリデータを事前にMapに変換してO(1)参照
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    const enrichedItems = filteredItems.map(item => {
      const categoryObj = categoryMap.get(item.categoryId);
      return calculateGearFields({
        ...item,
        category: categoryObj
      });
    });

    res.json({
      success: true,
      data: enrichedItems,
      meta: {
        total: enrichedItems.length,
        filtered: filteredItems.length !== gearItems.length
      }
    });
  } catch (error) {
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
    const item = gearItems.find(gear => gear.id === id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gear item not found'
      });
    }

    // 効率化: カテゴリデータを事前にMapに変換してO(1)参照
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const category = categoryMap.get(item.categoryId);

    const enrichedItem = calculateGearFields({
      ...item,
      category
    });

    res.json({
      success: true,
      data: enrichedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gear item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleGetGearSummary = (req: Request, res: Response) => {
  try {
    // 効率化: カテゴリデータを事前にMapに変換してO(1)参照
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    const enrichedItems = gearItems.map(item => {
      const category = categoryMap.get(item.categoryId);
      return calculateGearFields({
        ...item,
        category
      });
    });

    const summary = enrichedItems.reduce(
      (acc, item) => ({
        totalWeight: acc.totalWeight + (item.totalWeight || 0),
        totalPrice: acc.totalPrice + (item.totalPrice || 0),
        totalItems: acc.totalItems + (item.requiredQuantity || 0),
        missingItems: acc.missingItems + (item.missingQuantity || 0)
      }),
      { totalWeight: 0, totalPrice: 0, totalItems: 0, missingItems: 0 }
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate gear summary',
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

    // 効率化: カテゴリデータを事前にMapに変換してO(1)参照
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const category = categoryMap.get(newItem.categoryId);
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

    // 効率化: カテゴリデータを事前にMapに変換してO(1)参照
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const category = categoryMap.get(gearItems[itemIndex].categoryId);
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