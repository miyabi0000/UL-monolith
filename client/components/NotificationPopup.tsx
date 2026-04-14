import React, { useEffect, useState } from 'react';
import { COLORS, STATUS_TONES } from '../utils/designSystem';

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  message: string;
  duration?: number; // auto-hide duration in ms (0 = no auto-hide)
}

interface NotificationPopupProps {
  messages: NotificationMessage[];
  onRemove: (id: string) => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ messages, onRemove }) => {
  const errorTone = STATUS_TONES.error;
  const successTone = STATUS_TONES.success;

  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timers: { [key: string]: NodeJS.Timeout } = {};

    messages.forEach((message) => {
      if (message.duration && message.duration > 0 && message.type !== 'loading') {
        timers[message.id] = setTimeout(() => {
          handleRemove(message.id);
        }, message.duration);
      }
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [messages]);

  const handleRemove = (id: string) => {
    setAnimatingOut(prev => new Set(prev).add(id));
    setTimeout(() => {
      onRemove(id);
      setAnimatingOut(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  const getMessageStyles = (type: string): React.CSSProperties => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: errorTone.background,
          color: errorTone.text,
          borderLeftColor: errorTone.solid
        };
      case 'success':
        return {
          backgroundColor: successTone.background,
          color: successTone.text,
          borderLeftColor: successTone.solid
        };
      case 'info':
        return {
          backgroundColor: COLORS.white,
          color: COLORS.gray[700],
          borderLeftColor: COLORS.gray[500]
        };
      case 'loading':
        return {
          backgroundColor: COLORS.white,
          color: COLORS.gray[700],
          borderLeftColor: COLORS.gray[500]
        };
      default:
        return {
          backgroundColor: COLORS.white,
          color: COLORS.gray[700],
          borderLeftColor: COLORS.gray[500]
        };
    }
  };

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {messages.map((message) => {
        const isAnimatingOut = animatingOut.has(message.id);

        return (
          <div
            key={message.id}
            className={`p-4 rounded-lg border-l-4 backdrop-blur-sm shadow-md transition-all duration-300 transform ${
              isAnimatingOut
                ? 'trangray-x-full opacity-0'
                : 'trangray-x-0 opacity-100'
            } ${
              message.type === 'loading' ? 'animate-pulse' : ''
            }`}
            style={getMessageStyles(message.type)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                {message.type === 'loading' && (
                  <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                )}
                <p className="text-sm font-medium flex-1">
                  {message.message}
                </p>
              </div>

              {message.type !== 'loading' && (
                <button
                  onClick={() => handleRemove(message.id)}
                  className="ml-3 text-current opacity-60 hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationPopup;
