import { GearItem, Category } from '../models/types.js';

// In-memory data store (replace with database in production)
export let gearItems: GearItem[] = [];

export let categories: Category[] = [
  { 
    id: '1', 
    name: 'Clothing', 
    path: ['Clothing'], 
    color: '#FF6B6B', 
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: '2', 
    name: 'Sleep', 
    path: ['Sleep'], 
    color: '#4ECDC4', 
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: '3', 
    name: 'Pack', 
    path: ['Pack'], 
    color: '#FFE66D', 
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const setGearItems = (items: GearItem[]) => {
  gearItems = items;
};

export const setCategories = (cats: Category[]) => {
  categories = cats;
};