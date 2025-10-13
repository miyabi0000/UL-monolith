import { useState, useCallback } from 'react';
import { NotificationMessage } from '../components/NotificationPopup';

export const useNotifications = () => {
  const [messages, setMessages] = useState<NotificationMessage[]>([]);

  const addNotification = useCallback((
    type: 'success' | 'error' | 'info' | 'loading',
    message: string,
    duration?: number
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const defaultDurations = {
      success: 4000,
      error: 6000,
      info: 4000,
      loading: 0, // No auto-hide for loading
    };

    const notification: NotificationMessage = {
      id,
      type,
      message,
      duration: duration !== undefined ? duration : defaultDurations[type],
    };

    setMessages(prev => [...prev, notification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setMessages([]);
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<NotificationMessage>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, duration?: number) =>
    addNotification('success', message, duration), [addNotification]);

  const showError = useCallback((message: string, duration?: number) =>
    addNotification('error', message, duration), [addNotification]);

  const showInfo = useCallback((message: string, duration?: number) =>
    addNotification('info', message, duration), [addNotification]);

  const showLoading = useCallback((message: string) =>
    addNotification('loading', message, 0), [addNotification]);

  return {
    messages,
    addNotification,
    removeNotification,
    clearAll,
    updateNotification,
    showSuccess,
    showError,
    showInfo,
    showLoading,
  };
};