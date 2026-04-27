import React, { useState } from 'react';
import { Category } from '../utils/types';
import { STATUS_TONES } from '../utils/designSystem';
import { useWeightUnit } from '../contexts/WeightUnitContext';
import { convertToGrams } from '../utils/weightUnit';
import SeasonBar from './SeasonBar';
import { useFormValidation } from '../hooks/useFormValidation';
import { bulkUpdateSchema } from '../utils/validation';
import { FieldError } from './ui/FieldError';

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
  const errorTone = STATUS_TONES.error;
  const { unit } = useWeightUnit();

  const [action, setAction] = useState<'update' | 'delete'>('update');
  const [updateField, setUpdateField] = useState<'category' | 'priority' | 'owned' | 'required' | 'seasons' | 'weight' | 'price'>('category');
  const [updateValue, setUpdateValue] = useState<string>('');
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const { errors, validate, clearErrors } = useFormValidation(bulkUpdateSchema);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (action === 'delete') {
      const confirmed = window.confirm(`Delete ${selectedCount} items? This action cannot be undone.`);
      if (confirmed) {
        onBulkDelete();
        onClose();
      }
      return;
    }

    if (action === 'update') {
      // discriminated union で field/value を一括検証。NaN や空送信もここで弾く
      const candidate =
        updateField === 'seasons'
          ? { field: 'seasons' as const, value: selectedSeasons }
          : { field: updateField, value: updateValue };
      const result = validate(candidate);
      if (!result.ok) return;

      const parsed = result.data;
      const data: Record<string, unknown> = {};
      switch (parsed.field) {
        case 'category':
          data.categoryId = parsed.value;
          break;
        case 'priority':
          data.priority = parsed.value;
          break;
        case 'owned':
          data.ownedQuantity = parsed.value;
          break;
        case 'required':
          data.requiredQuantity = parsed.value;
          break;
        case 'seasons':
          data.seasons = parsed.value;
          break;
        case 'weight':
          // schema 段階では単位付き数値、ここでグラムへ変換
          data.weightGrams = convertToGrams(parsed.value, unit);
          break;
        case 'price':
          data.priceCents = parsed.value;
          break;
      }

      onBulkUpdate(data);
      onClose();
    }
  };

  const resetForm = () => {
    setAction('update');
    setUpdateField('category');
    setUpdateValue('');
    setSelectedSeasons([]);
    clearErrors();
  };

  React.useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-panel-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Actions ({selectedCount} items)
          </h2>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Action
            </label>
            <div className="space-y-2">
              <label className="flex items-center text-gray-900">
                <input
                  type="radio"
                  name="action"
                  value="update"
                  checked={action === 'update'}
                  onChange={(e) => setAction(e.target.value as 'update')}
                  className="mr-2"
                />
                Bulk Update
              </label>
              <label className="flex items-center text-gray-900">
                <input
                  type="radio"
                  name="action"
                  value="delete"
                  checked={action === 'delete'}
                  onChange={(e) => setAction(e.target.value as 'delete')}
                  className="mr-2"
                />
                Bulk Delete
              </label>
            </div>
          </div>

          {/* Update Options */}
          {action === 'update' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field to Update
                </label>
                <select
                  value={updateField}
                  onChange={(e) => {
                    setUpdateField(e.target.value as any);
                    setUpdateValue('');
                    setSelectedSeasons([]);
                    clearErrors();
                  }}
                  className="input w-full"
                >
                  <option value="category">Category</option>
                  <option value="priority">Priority</option>
                  <option value="owned">Owned Quantity</option>
                  <option value="required">Required Quantity</option>
                  <option value="weight">Weight (g)</option>
                  <option value="price">Price (¥)</option>
                  <option value="seasons">Season</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Value
                </label>
                {updateField === 'category' ? (
                  <select
                    value={updateValue}
                    onChange={(e) => { setUpdateValue(e.target.value); if (errors.value) clearErrors(); }}
                    aria-invalid={errors.value ? true : undefined}
                    className={`input w-full ${errors.value ? 'input-error' : ''}`}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.path.join(' > ')}
                      </option>
                    ))}
                  </select>
                ) : updateField === 'priority' ? (
                  <select
                    value={updateValue}
                    onChange={(e) => { setUpdateValue(e.target.value); if (errors.value) clearErrors(); }}
                    aria-invalid={errors.value ? true : undefined}
                    className={`input w-full ${errors.value ? 'input-error' : ''}`}
                  >
                    <option value="">Select Priority</option>
                    <option value="1">1 - Highest</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - Low</option>
                    <option value="5">5 - Lowest</option>
                  </select>
                ) : updateField === 'seasons' ? (
                  <SeasonBar
                    seasons={selectedSeasons}
                    isEditing={true}
                    onChange={(s) => { setSelectedSeasons(s); if (errors.value) clearErrors(); }}
                    size="md"
                  />
                ) : updateField === 'weight' ? (
                  <input
                    type="number"
                    min="0"
                    step={unit === 'oz' ? 0.1 : 1}
                    value={updateValue}
                    onChange={(e) => { setUpdateValue(e.target.value); if (errors.value) clearErrors(); }}
                    aria-invalid={errors.value ? true : undefined}
                    className={`input w-full ${errors.value ? 'input-error' : ''}`}
                    placeholder={`Weight (${unit})`}
                  />
                ) : updateField === 'price' ? (
                  <input
                    type="number"
                    min="0"
                    value={updateValue}
                    onChange={(e) => { setUpdateValue(e.target.value); if (errors.value) clearErrors(); }}
                    aria-invalid={errors.value ? true : undefined}
                    className={`input w-full ${errors.value ? 'input-error' : ''}`}
                    placeholder="Price (yen)"
                  />
                ) : (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={updateValue}
                    onChange={(e) => { setUpdateValue(e.target.value); if (errors.value) clearErrors(); }}
                    aria-invalid={errors.value ? true : undefined}
                    className={`input w-full ${errors.value ? 'input-error' : ''}`}
                    placeholder={updateField === 'owned' ? 'Owned Quantity' : 'Required Quantity'}
                  />
                )}
                <FieldError message={errors.value} />
                {errors._form && <FieldError message={errors._form} />}
              </div>
            </>
          )}

          {/* Delete Warning */}
          {action === 'delete' && (
            <div
              className="p-4 border rounded-md"
              style={{ backgroundColor: errorTone.background, borderColor: errorTone.border }}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" style={{ color: errorTone.text }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium" style={{ color: errorTone.text }}>
                    Warning: Delete Operation
                  </h3>
                  <div className="mt-2 text-sm" style={{ color: errorTone.text }}>
                    <p>Selected {selectedCount} items will be permanently deleted. This action cannot be undone.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-b border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={action === 'delete' ? 'btn-danger' : 'btn-primary'}
              disabled={
                action === 'update' &&
                ((updateField === 'seasons' && selectedSeasons.length === 0) ||
                  (updateField !== 'seasons' && !updateValue))
              }
            >
              {action === 'delete' ? 'Execute Delete' : 'Execute Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkActionModal;
