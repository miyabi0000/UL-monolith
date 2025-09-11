// History tracking for gear items
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

// In-memory history store (replace with database in production)
export let historyEntries: HistoryEntry[] = [];

export const addHistoryEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
  const historyEntry: HistoryEntry = {
    ...entry,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  };
  
  historyEntries.push(historyEntry);
  
  // Keep only last 1000 entries to prevent memory issues
  if (historyEntries.length > 1000) {
    historyEntries = historyEntries.slice(-1000);
  }
  
  return historyEntry;
};

export const getHistoryForGear = (gearId: string): HistoryEntry[] => {
  return historyEntries
    .filter(entry => entry.gearId === gearId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getAllHistory = (limit = 100): HistoryEntry[] => {
  return historyEntries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};