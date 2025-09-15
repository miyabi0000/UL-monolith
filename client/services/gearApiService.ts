import { GearItemWithCalculated, ApiResponse, PaginatedResponse } from '../utils/types';
import { API_CONFIG } from './api.client';

/**
 * Gear API Service - RESTful設計に基づく段階的実装
 */
export class GearApiService {
  private static baseUrl = API_CONFIG.baseUrl;

  /**
   * ギア一覧取得（Read操作）
   * GET /api/v1/gear
   */
  static async getGearList(params?: {
    category?: string;
    priority?: number;
    season?: string;
    search?: string;
    sort?: 'name' | 'weight' | 'priority' | 'shortage';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<GearItemWithCalculated[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }

      const url = `${this.baseUrl}/gear${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
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
        throw new Error(result.message || 'Failed to fetch gear list');
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch gear list:', error);
      throw error;
    }
  }

  /**
   * 特定ギア取得（Read操作）
   * GET /api/v1/gear/:id
   */
  static async getGearById(id: string): Promise<GearItemWithCalculated> {
    try {
      const response = await fetch(`${this.baseUrl}/gear/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(API_CONFIG.timeout.standard)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<GearItemWithCalculated> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch gear item');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to fetch gear item:', error);
      throw error;
    }
  }

  /**
   * ギア集計データ取得
   * GET /api/v1/gear/summary
   */
  static async getGearSummary(): Promise<{
    totalWeight: number;
    totalPrice: number;
    totalItems: number;
    missingItems: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/gear/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(API_CONFIG.timeout.light)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch gear summary:', error);
      throw error;
    }
  }

  // TODO: 段階的に以下の操作を実装予定
  // - createGear (Create操作)
  // - updateGear (Update操作) 
  // - deleteGear (Delete操作)
  // - bulkOperations (バルク操作)
}