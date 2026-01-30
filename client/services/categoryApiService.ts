import { Category } from '../utils/types';
import { API_CONFIG } from './api.client';

/**
 * カテゴリAPI Service
 */
export class CategoryApiService {
  /**
   * 全カテゴリ取得
   */
  static async getAllCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/categories`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[v0] Failed to fetch categories (using defaults):', error);
      // Return default categories when backend is not available
      return [
        { id: '1', name: 'Sleep', color: '#22c55e' },
        { id: '2', name: 'Pack', color: '#eab308' },
        { id: '3', name: 'Cooking', color: '#f97316' },
        { id: '4', name: 'Tools', color: '#a855f7' },
        { id: '5', name: 'Clothing', color: '#ec4899' },
        { id: '6', name: 'Safety', color: '#ef4444' },
      ];
    }
  }

  /**
   * カテゴリ作成
   */
  static async createCategory(name: string, color: string): Promise<Category> {
    const response = await fetch(`${API_CONFIG.baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, color })
    });
    
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to create category');
    }
    
    const result = await response.json();
    return result.data;
  }

  /**
   * カテゴリ更新
   */
  static async updateCategory(id: string, name: string, color: string): Promise<Category> {
    const response = await fetch(`${API_CONFIG.baseUrl}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, color })
    });
    
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to update category');
    }
    
    const result = await response.json();
    return result.data;
  }

  /**
   * カテゴリ削除
   */
  static async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`${API_CONFIG.baseUrl}/categories/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete category');
    }
  }
}

