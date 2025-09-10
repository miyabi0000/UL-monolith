import { Category } from '../utils/types';
import { callAPIWithRetry, API_CONFIG } from './api.client';

export class CategoryService {
  static async getAllCategories(): Promise<Category[]> {
    try {
      const response = await callAPIWithRetry('/categories', {}, API_CONFIG.timeout.standard, 'GET');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }

  static async createCategory(categoryData: {
    name: string;
    path?: string[];
    color?: string;
  }): Promise<Category> {
    try {
      const response = await callAPIWithRetry('/categories', categoryData, API_CONFIG.timeout.standard);
      return response.data;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }
}