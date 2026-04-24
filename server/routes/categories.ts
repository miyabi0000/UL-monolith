import { Router } from 'express';
import { db } from '../database/connection.js';
import { sendError, sendSuccess } from './shared/httpResponse.js';
import { getRequestUserId } from './shared/userContext.js';
import {
  validateCategoryInput,
  normalizeCategoryName,
  DEFAULT_CATEGORY_COLOR
} from '../utils/categoryValidation.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/v1/categories - 全カテゴリ取得
 */
router.get('/', async (req, res) => {
  try {
    const categories = await db.getCategories(getRequestUserId(req));

    return sendSuccess(res, {
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching categories:');
    return sendError(res, 'Failed to fetch categories', error);
  }
});

/**
 * GET /api/v1/categories/:id - 単一カテゴリ取得
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categories = await db.getCategories(getRequestUserId(req));
    const category = categories.find(c => c.id === id);

    if (!category) {
      return sendError(res, 'Category not found', undefined, 404);
    }

    return sendSuccess(res, {
      success: true,
      data: category
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching category:');
    return sendError(res, 'Failed to fetch category', error);
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
      return sendError(res, validationError.message, undefined, 400);
    }

    const normalizedName = normalizeCategoryName(name);
    const userId = getRequestUserId(req);

    // 重複チェック
    const existingCategories = await db.getCategories(userId);
    if (existingCategories.some(cat => cat.name.toLowerCase() === normalizedName.toLowerCase())) {
      return sendError(res, 'Category with this name already exists', undefined, 409);
    }

    const newCategory = await db.createCategory(
      normalizedName,
      color || DEFAULT_CATEGORY_COLOR,
      userId
    );

    return sendSuccess(res, {
      success: true,
      data: newCategory,
      message: 'Category created successfully'
    }, 201);
  } catch (error) {
    logger.error({ err: error }, 'Error creating category:');
    return sendError(res, 'Failed to create category', error);
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
    const categories = await db.getCategories(getRequestUserId(req));
    const category = categories.find(c => c.id === id);

    if (!category) {
      return sendError(res, 'Category not found', undefined, 404);
    }

    // "Other" カテゴリーの名前変更を保護
    if ((category.name.toLowerCase() === 'other' || category.name.toLowerCase() === 'その他') && name !== undefined) {
      return sendError(res, 'Cannot rename the "Other" category. This is a system-protected category.', undefined, 403);
    }

    // バリデーション（共通関数使用）
    if (name !== undefined || color !== undefined) {
      const validationError = validateCategoryInput(
        name !== undefined ? name : category.name,
        color !== undefined ? color : category.color
      );
      if (validationError) {
        return sendError(res, validationError.message, undefined, 400);
      }
    }

    // 重複チェック（自分以外）
    if (name !== undefined) {
      const normalizedName = normalizeCategoryName(name);
      if (categories.some(cat => 
        cat.id !== id && cat.name.toLowerCase() === normalizedName.toLowerCase()
      )) {
        return sendError(res, 'Category with this name already exists', undefined, 409);
      }
    }

    // 型安全な更新オブジェクト
    const updates: Partial<{ name: string; color: string }> = {};
    if (name !== undefined) updates.name = normalizeCategoryName(name);
    if (color !== undefined) updates.color = color;

    const updatedCategory = await db.updateCategory(id, updates);

    return sendSuccess(res, {
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating category:');
    return sendError(res, 'Failed to update category', error);
  }
});

/**
 * DELETE /api/v1/categories/:id - カテゴリ削除
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 存在確認
    const categories = await db.getCategories(getRequestUserId(req));
    const category = categories.find(c => c.id === id);

    if (!category) {
      return sendError(res, 'Category not found', undefined, 404);
    }

    // "Other" カテゴリーの削除を保護
    if (category.name.toLowerCase() === 'other' || category.name.toLowerCase() === 'その他') {
      return sendError(res, 'Cannot delete the "Other" category. This is a system-protected category.', undefined, 403);
    }

    const deleted = await db.deleteCategory(id);

    if (!deleted) {
      return sendError(res, 'Failed to delete category');
    }

    return sendSuccess(res, {
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    // カテゴリが使用中の場合
    if (error instanceof Error && error.message.includes('associated items')) {
      return sendError(res, 'Cannot delete category with associated items. Please reassign or delete items first.', undefined, 409);
    }

    logger.error({ err: error }, 'Error deleting category:');
    return sendError(res, 'Failed to delete category', error);
  }
});

export default router;
