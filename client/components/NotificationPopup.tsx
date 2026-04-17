import React, { useEffect, useState } from 'react';
import { COLORS, STATUS_TONES, mondrian, BORDERS, BORDER_WIDTHS } from '../utils/designSystem';

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

  // De Stijl: 通知の枠線は BORDERS.default、左帯のみ Mondrian 3色+黒で意味付け
  const getMessageStyles = (type: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      backgroundColor: COLORS.white,
      color: COLORS.text.primary,
      border: BORDERS.default,
    };
    const accentLeft = (color: string): React.CSSProperties => ({
      borderLeftWidth: BORDER_WIDTHS.thick,
      borderLeftColor: color,
    });
    switch (type) {
      case 'error':
        return { ...base, backgroundColor: errorTone.background, color: errorTone.text, ...accentLeft(mondrian.red) };
      case 'success':
        return { ...base, backgroundColor: successTone.background, color: successTone.text, ...accentLeft(mondrian.black) };
      case 'info':
        return { ...base, ...accentLeft(mondrian.blue) };
      case 'loading':
        return { ...base, ...accentLeft(mondrian.yellow) };
      default:
        return { ...base, ...accentLeft(mondrian.black) };
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
            className={`p-4 transition-all duration-300 transform ${
              isAnimatingOut
                ? 'translate-x-full opacity-0'
                : 'translate-x-0 opacity-100'
            } ${
              message.type === 'loading' ? 'animate-pulse' : ''
            }`}
            style={{ ...getMessageStyles(message.type), borderRadius: 'var(--radius-control)', boxShadow: 'var(--shadow-sm)' }}
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
