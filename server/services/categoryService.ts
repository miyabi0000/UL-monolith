import { Category, CategoryForm } from '../models';

/**
 * Server-side Category Service
 * Handles all category-related business logic
 */

export class CategoryService {
  // TODO: Replace with actual database implementation
  private categories: Category[] = [];

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return this.categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    return this.categories.find(category => category.id === id) || null;
  }

  /**
   * Create new category
   */
  async createCategory(formData: CategoryForm): Promise<Category> {
    if (!formData.name.trim()) {
      throw new Error('Category name is required');
    }

    // Check if category name already exists
    const existingCategory = this.categories.find(cat => 
      cat.name.toLowerCase() === formData.name.toLowerCase()
    );
    if (existingCategory) {
      throw new Error('Category name already exists');
    }

    // Build path
    let path = [formData.name];
    if (formData.parentId) {
      const parent = await this.getCategoryById(formData.parentId);
      if (!parent) {
        throw new Error('Parent category not found');
      }
      path = [...parent.path, formData.name];
    }

    const newCategory: Category = {
      id: this.generateId(),
      name: formData.name.trim(),
      englishName: formData.englishName?.trim(),
      color: formData.color,
      parentId: formData.parentId,
      path,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.categories.push(newCategory);
    return newCategory;
  }

  /**
   * Update category
   */
  async updateCategory(id: string, formData: Partial<CategoryForm>): Promise<Category> {
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check for name conflicts (excluding current category)
    if (formData.name) {
      const conflictingCategory = this.categories.find(cat => 
        cat.id !== id && cat.name.toLowerCase() === formData.name!.toLowerCase()
      );
      if (conflictingCategory) {
        throw new Error('Category name already exists');
      }
    }

    const updatedCategory: Category = {
      ...existingCategory,
      name: formData.name?.trim() || existingCategory.name,
      englishName: formData.englishName !== undefined ? formData.englishName?.trim() : existingCategory.englishName,
      color: formData.color || existingCategory.color,
      parentId: formData.parentId !== undefined ? formData.parentId : existingCategory.parentId,
      updatedAt: new Date()
    };

    // Rebuild path if name or parent changed
    if (formData.name || formData.parentId !== undefined) {
      let path = [updatedCategory.name];
      if (updatedCategory.parentId) {
        const parent = await this.getCategoryById(updatedCategory.parentId);
        if (!parent) {
          throw new Error('Parent category not found');
        }
        path = [...parent.path, updatedCategory.name];
      }
      updatedCategory.path = path;

      // Update paths of all child categories
      await this.updateChildPaths(id, path);
    }

    const index = this.categories.findIndex(category => category.id === id);
    this.categories[index] = updatedCategory;

    return updatedCategory;
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<boolean> {
    const category = await this.getCategoryById(id);
    if (!category) {
      return false;
    }

    // Check if category has children
    const hasChildren = this.categories.some(cat => cat.parentId === id);
    if (hasChildren) {
      throw new Error('Cannot delete category with subcategories');
    }

    // TODO: Check if category is used by gear items
    // This would require integration with gear service

    const index = this.categories.findIndex(category => category.id === id);
    this.categories.splice(index, 1);

    return true;
  }

  /**
   * Get category hierarchy
   */
  async getCategoryHierarchy(): Promise<Category[]> {
    const categories = await this.getCategories();
    
    // Build tree structure
    const rootCategories = categories.filter(cat => !cat.parentId);
    
    const buildTree = (parent: Category): Category => {
      const children = categories.filter(cat => cat.parentId === parent.id);
      return {
        ...parent,
        children: children.map(buildTree) as any
      };
    };

    return rootCategories.map(buildTree);
  }

  /**
   * Search categories by name
   */
  async searchCategories(query: string): Promise<Category[]> {
    const searchTerm = query.toLowerCase();
    return this.categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm) ||
      (category.englishName && category.englishName.toLowerCase().includes(searchTerm))
    );
  }

  private async updateChildPaths(parentId: string, parentPath: string[]): Promise<void> {
    const children = this.categories.filter(cat => cat.parentId === parentId);
    
    for (const child of children) {
      const newPath = [...parentPath, child.name];
      child.path = newPath;
      child.updatedAt = new Date();
      
      // Recursively update grandchildren
      await this.updateChildPaths(child.id, newPath);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const categoryService = new CategoryService();
