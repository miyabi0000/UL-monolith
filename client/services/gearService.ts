import { GearItemWithCalculated, GearItemForm, ApiResponse, WeightBreakdown, ULStatus } from '../utils/types';
import { callAPIWithRetry, API_CONFIG } from './api.client';

// History entry type for frontend
export interface HistoryEntry {
  id: string;
  gearId: string;
  action: 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: string;
  userId: string;
  metadata?: {
    bulkOperationId?: string;
    reason?: string;
  };
}

export class GearService {
  static async getAllGear(): Promise<GearItemWithCalculated[]> {
    try {
      const response = await callAPIWithRetry('/gear', {}, API_CONFIG.timeout.standard, 'GET');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch gear items:', error);
      throw error;
    }
  }

  static async createGear(gearData: GearItemForm): Promise<GearItemWithCalculated> {
    try {
      const response = await callAPIWithRetry('/gear', gearData, API_CONFIG.timeout.standard);
      return response.data;
    } catch (error) {
      console.error('Failed to create gear item:', error);
      throw error;
    }
  }

  static async updateGear(id: string, gearData: GearItemForm): Promise<GearItemWithCalculated> {
    try {
      const response = await callAPIWithRetry(`/gear/${id}`, gearData, API_CONFIG.timeout.standard, 'PUT');
      return response.data;
    } catch (error) {
      console.error('Failed to update gear item:', error);
      throw error;
    }
  }

  // NEW: Partial update for efficient inline editing
  static async patchGear(id: string, updates: Partial<GearItemForm>): Promise<GearItemWithCalculated> {
    try {
      const response = await callAPIWithRetry(`/gear/${id}`, updates, API_CONFIG.timeout.standard, 'PATCH');
      return response.data;
    } catch (error) {
      console.error('Failed to patch gear item:', error);
      throw error;
    }
  }

  static async deleteGear(id: string): Promise<void> {
    try {
      await callAPIWithRetry(`/gear/${id}`, {}, API_CONFIG.timeout.standard, 'DELETE');
    } catch (error) {
      console.error('Failed to delete gear item:', error);
      throw error;
    }
  }

  // ENHANCED: Unified bulk operations
  static async bulkOperation(action: 'update' | 'delete', ids: string[], data?: any): Promise<{
    processedCount: number;
    bulkOperationId: string;
    updatedItems?: GearItemWithCalculated[];
  }> {
    try {
      const response = await callAPIWithRetry('/gear/bulk', { action, ids, data }, API_CONFIG.timeout.standard, 'PATCH');
      return response;
    } catch (error) {
      console.error('Failed to perform bulk operation:', error);
      throw error;
    }
  }

  static async bulkDeleteGear(ids: string[]): Promise<{ deletedCount: number }> {
    try {
      const response = await callAPIWithRetry('/gear/bulk-delete', { ids }, API_CONFIG.timeout.standard);
      return response;
    } catch (error) {
      console.error('Failed to bulk delete gear items:', error);
      throw error;
    }
  }

  // NEW: History management
  static async getGearHistory(id: string, limit = 50): Promise<HistoryEntry[]> {
    try {
      const response = await callAPIWithRetry(`/gear/${id}/history?limit=${limit}`, {}, API_CONFIG.timeout.standard, 'GET');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch gear history:', error);
      throw error;
    }
  }

  // NEW: Revert to previous version
  static async revertGear(id: string, historyId: string): Promise<GearItemWithCalculated> {
    try {
      const response = await callAPIWithRetry(`/gear/${id}/revert/${historyId}`, {}, API_CONFIG.timeout.standard, 'POST');
      return response.data;
    } catch (error) {
      console.error('Failed to revert gear item:', error);
      throw error;
    }
  }

  static async getAnalyticsSummary(): Promise<{
    totalWeight: number;
    totalPrice: number;
    missingItems: number;
    totalItems: number;
    chartData: Array<{
      name: string;
      value: number;
      color: string;
      items: GearItemWithCalculated[];
    }>;
  }> {
    try {
      const response = await callAPIWithRetry('/analytics/summary', {}, API_CONFIG.timeout.standard, 'GET');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
      throw error;
    }
  }

  /**
   * Weight Breakdown集計（データモデル仕様準拠）
   * Base/Worn/Consumables/Packed/SkinOut/Big3 + UL分類
   */
  static async getWeightBreakdown(): Promise<{
    breakdown: WeightBreakdown;
    ulStatus: ULStatus;
  }> {
    try {
      const response = await callAPIWithRetry('/analytics/weight-breakdown', {}, API_CONFIG.timeout.standard, 'GET');
      return {
        breakdown: {
          baseWeight: response.data.baseWeight,
          wornWeight: response.data.wornWeight,
          consumables: response.data.consumables,
          packedWeight: response.data.packedWeight,
          skinOutWeight: response.data.skinOutWeight,
          big3: response.data.big3
        },
        ulStatus: response.data.ulStatus
      };
    } catch (error) {
      console.error('Failed to fetch weight breakdown:', error);
      throw error;
    }
  }
}