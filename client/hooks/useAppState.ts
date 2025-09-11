import { useState, useMemo } from 'react';
import { GearItemWithCalculated, Category } from '../utils/types';
import seedData from '../data/seedGear.json';

export const useAppState = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingGear, setEditingGear] = useState<GearItemWithCalculated | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [gearData, setGearData] = useState(seedData);
  const [showGearDropdown, setShowGearDropdown] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Clothing', path: ['Clothing'], color: '#FF6B6B', createdAt: new Date().toISOString() },
    { id: '2', name: 'Sleep', path: ['Sleep'], color: '#4ECDC4', createdAt: new Date().toISOString() },
    { id: '3', name: 'Pack', path: ['Pack'], color: '#FFE66D', createdAt: new Date().toISOString() },
    { id: '4', name: 'Electronics', path: ['Electronics'], color: '#4D96FF', createdAt: new Date().toISOString() },
    { id: '5', name: 'Hygiene', path: ['Hygiene'], color: '#A66DFF', createdAt: new Date().toISOString() },
  ]);

  const gearItems: GearItemWithCalculated[] = useMemo(() => {
    return (gearData as any[]).map((item, index) => {
      const required = Math.max(1, Number(item.required_quantity) || 1);
      const owned = Math.max(0, Number(item.owned_quantity) || 0);
      const weight = Number(item.weight_grams) || 0;
      const price = Number(item.price_cents) || 0;

      const category = categories.find(cat => cat.name === item.category) || categories[0];
      
      return {
        id: item.id || `gear-${index}`,
        userId: 'user1',
        name: item.name || 'Unknown Item',
        brand: item.brand || 'Unknown',
        categoryId: category.id,
        category,
        ownedQuantity: owned,
        requiredQuantity: required,
        priority: Math.max(1, Math.min(5, Number(item.priority) || 3)),
        weightGrams: weight,
        priceCents: price,
        totalWeight: weight * required,
        totalPrice: price * required,
        missingQuantity: Math.max(0, required - owned),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }, [gearData, categories]);

  return {
    showForm, setShowForm,
    editingGear, setEditingGear,
    showLogin, setShowLogin,
    showCategoryManager, setShowCategoryManager,
    showChat, setShowChat,
    gearData, setGearData,
    showGearDropdown, setShowGearDropdown,
    showCheckboxes, setShowCheckboxes,
    successMessage, setSuccessMessage,
    categories, setCategories,
    gearItems
  };
};