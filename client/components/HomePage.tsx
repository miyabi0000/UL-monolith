import React from 'react';
import { useAppState } from '../hooks/useAppState';
import InventoryWorkspace from './InventoryWorkspace';

export default function HomePage() {
  const appState = useAppState();
  return <InventoryWorkspace appState={appState} />;
}
