import { Router } from 'express';
import { 
  getAllCategories, 
  getCategoryById, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from '../data/store';
import { 
  validateCategoryInput, 
  normalizeCategoryName, 
  DEFAULT_CATEGORY_COLOR 
} from '../utils/categoryValidation';

const router = Router();

/**
 * GET /api/v1/categories - 全カテゴリ取得
 */
router.get('/', async (req, res) => {
  try {
    const categories = getAllCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/categories/:id - 単一カテゴリ取得
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = getCategoryById(id);

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
    console.error('Error fetching category:', error);
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
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;

    // バリデーション（共通関数使用）
    const validationError = validateCategoryInput(name, color);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    const normalizedName = normalizeCategoryName(name);

    // 重複チェック
    const existingCategories = getAllCategories();
    if (existingCategories.some(cat => cat.name.toLowerCase() === normalizedName.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const newCategory = addCategory({
      name: normalizedName,
      color: color || DEFAULT_CATEGORY_COLOR
    });

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    // 存在確認
    const category = getCategoryById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // バリデーション（共通関数使用）
    if (name !== undefined || color !== undefined) {
      const validationError = validateCategoryInput(
        name !== undefined ? name : category.name,
        color !== undefined ? color : category.color
      );
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError.message
        });
      }
    }

    // 重複チェック（自分以外）
    if (name !== undefined) {
      const normalizedName = normalizeCategoryName(name);
      const existingCategories = getAllCategories();
      if (existingCategories.some(cat => 
        cat.id !== id && cat.name.toLowerCase() === normalizedName.toLowerCase()
      )) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // 型安全な更新オブジェクト
    const updates: Partial<{ name: string; color: string }> = {};
    if (name !== undefined) updates.name = normalizeCategoryName(name);
    if (color !== undefined) updates.color = color;

    const updatedCategory = updateCategory(id, updates);

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 存在確認
    const category = getCategoryById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const deleted = deleteCategory(id);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete category'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    // カテゴリが使用中の場合
    if (error instanceof Error && error.message.includes('associated items')) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete category with associated items. Please reassign or delete items first.'
      });
    }

    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
