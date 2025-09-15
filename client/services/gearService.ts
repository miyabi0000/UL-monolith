import { GearItemWithCalculated, GearItemForm, ApiResponse } from '../utils/types';
import { callAPIWithRetry, API_ENDPOINTS, API_CONFIG } from './api.client';

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

  static async deleteGear(id: string): Promise<void> {
    try {
      await callAPIWithRetry(`/gear/${id}`, {}, API_CONFIG.timeout.standard, 'DELETE');
    } catch (error) {
      console.error('Failed to delete gear item:', error);
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
}