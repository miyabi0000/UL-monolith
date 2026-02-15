import React, { useState, useEffect } from 'react';
import { GearService, HistoryEntry } from '../services/gearService';
import { STATUS_TONES } from '../utils/designSystem';
import Button from './ui/Button';

interface HistoryModalProps {
  isOpen: boolean;
  gearId: string;
  gearName: string;
  onClose: () => void;
  onRevert?: (gearId: string, historyId: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ 
  isOpen, 
  gearId, 
  gearName, 
  onClose, 
  onRevert 
}) => {
  const errorTone = STATUS_TONES.error;
  const successTone = STATUS_TONES.success;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && gearId) {
      loadHistory();
    }
  }, [isOpen, gearId]);

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const historyData = await GearService.getGearHistory(gearId);
      setHistory(historyData);
    } catch (err) {
      setError('Failed to load history');
      console.error('History load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (historyId: string) => {
    if (!onRevert) return;
    
    const confirmed = window.confirm('Are you sure you want to revert to this version? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await onRevert(gearId, historyId);
      onClose();
    } catch (err) {
      setError('Failed to revert changes');
      console.error('Revert error:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionStyle = (action: string): React.CSSProperties | undefined => {
    switch (action) {
      case 'delete':
      case 'bulk_delete':
        return { color: errorTone.text, backgroundColor: errorTone.background };
      default:
        return undefined;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return '作成';
      case 'update': return '更新';
      case 'delete': return '削除';
      case 'bulk_update': return '一括更新';
      case 'bulk_delete': return '一括削除';
      default: return action;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            変更履歴: {gearName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {error && (
            <div
              className="mb-4 p-4 border rounded-md"
              style={{ backgroundColor: errorTone.background, borderColor: errorTone.border }}
            >
              <p className="text-sm" style={{ color: errorTone.text }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600">履歴を読み込み中...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              変更履歴がありません
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.action === 'delete' || entry.action === 'bulk_delete'
                            ? ''
                            : 'text-gray-700 bg-gray-100'
                        }`}
                        style={getActionStyle(entry.action)}
                      >
                        {getActionLabel(entry.action)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      {entry.metadata?.bulkOperationId && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          Bulk ID: {entry.metadata.bulkOperationId.slice(-6)}
                        </span>
                      )}
                    </div>
                    {entry.action !== 'delete' && entry.action !== 'bulk_delete' && onRevert && (
                      <button
                        onClick={() => handleRevert(entry.id)}
                        className="text-xs text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      >
                        この版に戻す
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {entry.changes.map((change, changeIndex) => (
                      <div key={changeIndex} className="bg-gray-50 p-3 rounded">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          {change.field}
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span
                            className="px-2 py-1 rounded"
                            style={{ color: errorTone.text, backgroundColor: errorTone.background }}
                          >
                            {change.oldValue ?? 'null'}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span
                            className="px-2 py-1 rounded"
                            style={{ color: successTone.text, backgroundColor: successTone.background }}
                          >
                            {change.newValue ?? 'null'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {entry.metadata?.reason && (
                    <div className="mt-3 text-xs text-gray-500 italic">
                      理由: {entry.metadata.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
