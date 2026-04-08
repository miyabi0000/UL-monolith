import { Category } from '../utils/types';
import { API_CONFIG, getHeaders } from './api.client';

/**
 * カテゴリAPI Service
 */
export class CategoryApiService {
  /**
   * 全カテゴリ取得
   */
  static async getAllCategories(): Promise<Category[]> {
    const response = await fetch(`${API_CONFIG.baseUrl}/categories`, {
      headers: await getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * カテゴリ作成
   */
  static async createCategory(name: string, color: string): Promise<Category> {
    const response = await fetch(`${API_CONFIG.baseUrl}/categories`, {
      method: 'POST',
      headers: await getHeaders(),
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
      headers: await getHeaders(),
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
      method: 'DELETE',
      headers: await getHeaders(),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete category');
    }
  }
}
