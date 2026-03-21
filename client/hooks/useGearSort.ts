import { useState, useCallback } from 'react';
import { SortField, SortDirection } from '../components/GearTable/TableHeader';

export function useGearSort(defaultField: SortField = 'name') {
  const [sortField, setSortField] = useState<SortField>(defaultField);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDirection(dir => dir === 'asc' ? 'desc' : 'asc');
        return field;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  return { sortField, sortDirection, handleSort };
}
