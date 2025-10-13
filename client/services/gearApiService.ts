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

  /**
   * ギア作成（Create操作）
   * POST /api/v1/gear
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
   * ギア更新（Update操作）
   * PUT /api/v1/gear/:id
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
   * ギア削除（Delete操作）
   * DELETE /api/v1/gear/:id
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

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete gear item');
      }
    } catch (error) {
      console.error('Failed to delete gear item:', error);
      throw error;
    }
  }

  /**
   * 一括削除（Bulk Delete操作）
   * DELETE /api/v1/gear (with body containing ids)
   */
  static async bulkDeleteGear(ids: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/gear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
        signal: AbortSignal.timeout(API_CONFIG.timeout.standard)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to bulk delete gear items');
      }
    } catch (error) {
      console.error('Failed to bulk delete gear items:', error);
      throw error;
    }
  }

  // Alias method for backward compatibility
  static async getAllGear(): Promise<GearItemWithCalculated[]> {
    return this.getGearList();
  }
}