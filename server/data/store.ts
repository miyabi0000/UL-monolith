// In-memory data store (replace with database in production)
export let gearItems: any[] = [];
export let categories: any[] = [
  { id: '1', name: 'Clothing', path: ['Clothing'], color: '#FF6B6B', createdAt: new Date().toISOString() },
  { id: '2', name: 'Sleep', path: ['Sleep'], color: '#4ECDC4', createdAt: new Date().toISOString() },
  { id: '3', name: 'Pack', path: ['Pack'], color: '#FFE66D', createdAt: new Date().toISOString() },
  { id: '4', name: 'Electronics', path: ['Electronics'], color: '#4D96FF', createdAt: new Date().toISOString() },
  { id: '5', name: 'Hygiene', path: ['Hygiene'], color: '#A66DFF', createdAt: new Date().toISOString() },
];

export const setGearItems = (items: any[]) => {
  gearItems = items;
};

export const setCategories = (cats: any[]) => {
  categories = cats;
};