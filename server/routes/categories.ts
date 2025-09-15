import { Router } from 'express';
import { categories, setCategories } from '../data/store';

const router = Router();

// Get all categories
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new category
router.post('/', (req, res) => {
  try {
    const { name, path, color, parentId } = req.body;
    
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const newCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      path: path || [name.trim()],
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

// Update category
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, path, color, parentId } = req.body;
    
    const categoryIndex = categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      name: name.trim(),
      path: path || [name.trim()],
      color: color || categories[categoryIndex].color,
      parentId: parentId || undefined
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

// Delete category
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
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