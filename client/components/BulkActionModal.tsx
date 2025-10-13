import React, { useState } from 'react';
import { Category } from '../utils/types';

interface BulkActionModalProps {
  isOpen: boolean;
  selectedCount: number;
  categories: Category[];
  onClose: () => void;
  onBulkUpdate: (data: any) => void;
  onBulkDelete: () => void;
}

const BulkActionModal: React.FC<BulkActionModalProps> = ({ 
  isOpen, 
  selectedCount, 
  categories,
  onClose, 
  onBulkUpdate, 
  onBulkDelete 
}) => {
  const [action, setAction] = useState<'update' | 'delete'>('update');
  const [updateField, setUpdateField] = useState<'category' | 'priority' | 'owned' | 'required'>('category');
  const [updateValue, setUpdateValue] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (action === 'delete') {
      const confirmed = window.confirm(`${selectedCount}個のアイテムを削除しますか？この操作は取り消せません。`);
      if (confirmed) {
        onBulkDelete();
        onClose();
      }
      return;
    }

    if (action === 'update') {
      let data: any = {};
      
      switch (updateField) {
        case 'category':
          data.categoryId = updateValue;
          break;
        case 'priority':
          data.priority = parseInt(updateValue);
          break;
        case 'owned':
          data.ownedQuantity = parseInt(updateValue);
          break;
        case 'required':
          data.requiredQuantity = parseInt(updateValue);
          break;
      }

      if (Object.keys(data).length > 0) {
        onBulkUpdate(data);
        onClose();
      }
    }
  };

  const resetForm = () => {
    setAction('update');
    setUpdateField('category');
    setUpdateValue('');
  };

  React.useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            一括操作 ({selectedCount}個のアイテム)
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              操作を選択
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="update"
                  checked={action === 'update'}
                  onChange={(e) => setAction(e.target.value as 'update')}
                  className="mr-2"
                />
                一括更新
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="delete"
                  checked={action === 'delete'}
                  onChange={(e) => setAction(e.target.value as 'delete')}
                  className="mr-2"
                />
                一括削除
              </label>
            </div>
          </div>

          {/* Update Options */}
          {action === 'update' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  更新する項目
                </label>
                <select
                  value={updateField}
                  onChange={(e) => {
                    setUpdateField(e.target.value as any);
                    setUpdateValue('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="category">カテゴリ</option>
                  <option value="priority">優先度</option>
                  <option value="owned">所有数量</option>
                  <option value="required">必要数量</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しい値
                </label>
                {updateField === 'category' ? (
                  <select
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">カテゴリを選択</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.path.join(' > ')}
                      </option>
                    ))}
                  </select>
                ) : updateField === 'priority' ? (
                  <select
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">優先度を選択</option>
                    <option value="1">1 - 最高</option>
                    <option value="2">2 - 高</option>
                    <option value="3">3 - 中</option>
                    <option value="4">4 - 低</option>
                    <option value="5">5 - 最低</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={updateField === 'owned' ? '所有数量' : '必要数量'}
                    required
                  />
                )}
              </div>
            </>
          )}

          {/* Delete Warning */}
          {action === 'delete' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    警告: 削除操作
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>選択した{selectedCount}個のアイテムが完全に削除されます。この操作は取り消せません。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white font-medium ${
                action === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } ${
                action === 'update' && !updateValue 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              disabled={action === 'update' && !updateValue}
            >
              {action === 'delete' ? '削除実行' : '更新実行'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkActionModal;