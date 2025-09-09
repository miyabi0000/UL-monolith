
import { GearItem, GearItemForm, PaginatedResponse, PaginationParams } from '../models';
import { sanitizeGearForm } from '../utils/sanitize';

/**
 * Server-side Gear Service
 * Handles all gear-related business logic
 */

export class GearService {
  // TODO: Replace with actual database implementation
  private gearItems: GearItem[] = [];

  /**
   * Get all gear items with pagination and filtering
   */
  async getGearItems(params?: PaginationParams & {
    categoryId?: string;
    search?: string;
  }): Promise<PaginatedResponse<GearItem>> {
    let filteredItems = [...this.gearItems];

    // Apply filters
    if (params?.categoryId) {
      filteredItems = filteredItems.filter(item => item.categoryId === params.categoryId);
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.brand && item.brand.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (params?.sortBy) {
      filteredItems.sort((a, b) => {
        const aVal = (a as any)[params.sortBy!];
        const bVal = (b as any)[params.sortBy!];
        
        if (aVal < bVal) return params.sortOrder === 'desc' ? 1 : -1;
        if (aVal > bVal) return params.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / limit)
      }
    };
  }

  /**
   * Get gear item by ID
   */
  async getGearItemById(id: string): Promise<GearItem | null> {
    return this.gearItems.find(item => item.id === id) || null;
  }

  /**
   * Create new gear item
   */
  async createGearItem(formData: GearItemForm): Promise<GearItem> {
    // Validate and sanitize input
    const sanitizedForm = sanitizeGearForm(formData);
    
    if (!sanitizedForm.name.trim()) {
      throw new Error('Gear name is required');
    }

    const newItem: GearItem = {
      id: this.generateId(),
      ...sanitizedForm,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.gearItems.push(newItem);
    return newItem;
  }

  /**
   * Update gear item
   */
  async updateGearItem(id: string, formData: Partial<GearItemForm>): Promise<GearItem> {
    const existingItem = await this.getGearItemById(id);
    if (!existingItem) {
      throw new Error('Gear item not found');
    }

    // Sanitize input
    const sanitizedForm = sanitizeGearForm({
      name: formData.name || existingItem.name,
      brand: formData.brand !== undefined ? formData.brand : existingItem.brand,
      productUrl: formData.productUrl !== undefined ? formData.productUrl : existingItem.productUrl,
      categoryId: formData.categoryId !== undefined ? formData.categoryId : existingItem.categoryId,
      requiredQuantity: formData.requiredQuantity !== undefined ? formData.requiredQuantity : existingItem.requiredQuantity,
      ownedQuantity: formData.ownedQuantity !== undefined ? formData.ownedQuantity : existingItem.ownedQuantity,
      weightGrams: formData.weightGrams !== undefined ? formData.weightGrams : existingItem.weightGrams,
      priceCents: formData.priceCents !== undefined ? formData.priceCents : existingItem.priceCents,
      season: formData.season !== undefined ? formData.season : existingItem.season,
      priority: formData.priority !== undefined ? formData.priority : existingItem.priority
    });

    const updatedItem: GearItem = {
      ...existingItem,
      ...sanitizedForm,
      updatedAt: new Date()
    };

    const index = this.gearItems.findIndex(item => item.id === id);
    this.gearItems[index] = updatedItem;

    return updatedItem;
  }

  /**
   * Delete gear item
   */
  async deleteGearItem(id: string): Promise<boolean> {
    const index = this.gearItems.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }

    this.gearItems.splice(index, 1);
    return true;
  }

  /**
   * Delete multiple gear items
   */
  async deleteGearItems(ids: string[]): Promise<number> {
    let deletedCount = 0;
    
    for (const id of ids) {
      const deleted = await this.deleteGearItem(id);
      if (deleted) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Update gear item quantity
   */
  async updateGearQuantity(
    id: string, 
    updates: { ownedQuantity?: number; requiredQuantity?: number }
  ): Promise<GearItem> {
    return this.updateGearItem(id, updates);
  }

  /**
   * Get gear statistics
   */
  async getGearStats(): Promise<{
    totalItems: number;
    totalWeight: number;
    totalValue: number;
    missingItems: number;
  }> {
    const totalItems = this.gearItems.length;
    const totalWeight = this.gearItems.reduce((sum, item) => 
      sum + ((item.weightGrams || 0) * item.requiredQuantity), 0
    );
    const totalValue = this.gearItems.reduce((sum, item) => 
      sum + ((item.priceCents || 0) * item.requiredQuantity), 0
    );
    const missingItems = this.gearItems.filter(item => 
      item.ownedQuantity < item.requiredQuantity
    ).length;

    return {
      totalItems,
      totalWeight,
      totalValue,
      missingItems
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const gearService = new GearService();
