import { Router } from 'express';
import { categories, setCategories } from '../data/store.js';

const router = Router();

/**
 * GET /api/v1/categories - 全カテゴリ取得
 */
router.get('/', (req, res) => {
  try {
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({
      success: true,
      data: sortedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/categories/:id - 特定カテゴリ取得
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }
    
    const category = categories.find(cat => cat.id === id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/categories - カテゴリ作成
 */
router.post('/', (req, res) => {
  try {
    const { name, color, parentId } = req.body;
    
    // バリデーション
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Category name is too long (max 100 characters)'
      });
    }
    
    // 重複チェック
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    const newCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      path: [name.trim()],
      color: color || '#6B7280',
      parentId: parentId || undefined,
      createdAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    
    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Category created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/v1/categories/:id - カテゴリ更新
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, parentId } = req.body;
    
    // IDバリデーション
    if (!id?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }
    
    // 名前バリデーション
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Category name is too long (max 100 characters)'
      });
    }
    
    const categoryIndex = categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // 名前の重複チェック（自分以外）
    const existingCategory = categories.find(cat => 
      cat.id !== id && cat.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      name: name.trim(),
      path: [name.trim()],
      color: color || categories[categoryIndex].color,
      parentId: parentId || undefined,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: categories[categoryIndex],
      message: 'Category updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/categories/:id - カテゴリ削除
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }
    
    const initialLength = categories.length;
    setCategories(categories.filter(cat => cat.id !== id));
    
    if (categories.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;