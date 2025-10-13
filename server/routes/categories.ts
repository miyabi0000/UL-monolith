import { Router } from 'express';
import { getAllCategories, getCategoryById } from '../data/store';

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
 * NOTE: カテゴリのCUD操作は現在未実装
 * デフォルトカテゴリのみ使用可能（init.sqlで定義）
 * 
 * 今後の実装予定:
 * - POST /api/v1/categories - カテゴリ作成
 * - PUT /api/v1/categories/:id - カテゴリ更新
 * - DELETE /api/v1/categories/:id - カテゴリ削除
 */

export default router;
