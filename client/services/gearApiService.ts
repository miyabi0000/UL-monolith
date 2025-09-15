import { GearItemWithCalculated, ApiResponse } from '../utils/types';
import { API_CONFIG } from './api.client';

/**
 * Gear API Service - バックエンドから計算済みデータを取得
 */
export class GearApiService {
  private static baseUrl = API_CONFIG.baseUrl;

  /**
   * 全ギアアイテムを取得（計算フィールド込み）
   */
  static async getAllGear(): Promise<GearItemWithCalculated[]> {
    try {
      const response = await fetch(`${this.baseUrl}/gear`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(API_CONFIG.timeout.standard)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<GearItemWithCalculated[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch gear items');
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch gear items:', error);
      throw error;
    }
  }

  /**
   * ギアアイテムを作成
   */
  static async createGear(gearData: any): Promise<GearItemWithCalculated> {
    try {
      const response = await fetch(`${this.baseUrl}/gear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gearData),
        signal: AbortSignal.timeout(API_CONFIG.timeout.standard)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<GearItemWithCalculated> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create gear item');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to create gear item:', error);
      throw error;
    }
  }

  /**
   * ギアアイテムを更新
   */
  static async updateGear(id: string, gearData: any): Promise<GearItemWithCalculated> {
    try {
      const response = await fetch(`${this.baseUrl}/gear/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gearData),
        signal: AbortSignal.timeout(API_CONFIG.timeout.standard)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<GearItemWithCalculated> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update gear item');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to update gear item:', error);
      throw error;
    }
  }

  /**
   * ギアアイテムを削除
   */
  static async deleteGear(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/gear/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(API_CONFIG.timeout.standard)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<void> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete gear item');
      }
    } catch (error) {
      console.error('Failed to delete gear item:', error);
      throw error;
    }
  }
}
