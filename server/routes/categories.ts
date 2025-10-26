import { Router } from 'express';
import { db } from '../database/connection';
import { 
  validateCategoryInput, 
  normalizeCategoryName, 
  DEFAULT_CATEGORY_COLOR 
} from '../utils/categoryValidation';

const router = Router();

// デモユーザーID（認証実装までの仮ID）
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440100';

/**
 * GET /api/v1/categories - 全カテゴリ取得
 */
router.get('/', async (req, res) => {
  try {
    const categories = await db.getCategories(DEMO_USER_ID);

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
    const categories = await db.getCategories(DEMO_USER_ID);
    const category = categories.find(c => c.id === id);

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
    const existingCategories = await db.getCategories(DEMO_USER_ID);
    if (existingCategories.some(cat => cat.name.toLowerCase() === normalizedName.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const newCategory = await db.createCategory(
      normalizedName,
      color || DEFAULT_CATEGORY_COLOR,
      DEMO_USER_ID
    );

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
    const categories = await db.getCategories(DEMO_USER_ID);
    const category = categories.find(c => c.id === id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // "Other" カテゴリーの名前変更を保護
    if ((category.name.toLowerCase() === 'other' || category.name.toLowerCase() === 'その他') && name !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Cannot rename the "Other" category. This is a system-protected category.'
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
      if (categories.some(cat => 
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

    const updatedCategory = await db.updateCategory(id, updates);

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
    const categories = await db.getCategories(DEMO_USER_ID);
    const category = categories.find(c => c.id === id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // "Other" カテゴリーの削除を保護
    if (category.name.toLowerCase() === 'other' || category.name.toLowerCase() === 'その他') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete the "Other" category. This is a system-protected category.'
      });
    }

    const deleted = await db.deleteCategory(id);

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
